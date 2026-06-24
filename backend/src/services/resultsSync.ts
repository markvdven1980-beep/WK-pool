import { PrismaClient } from '@prisma/client';
import { recalcMatchPredictions } from './recalc';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC'; // FIFA World Cup

// football-data.org gebruikt Engelse landnamen; wij gebruiken Nederlandse.
// Alle keys zijn accent- en hoofdletterloos (zie normalize). Per land staan
// meerdere mogelijke API-namen, omdat football-data.org soms varianten gebruikt
// (bijv. "Korea Republic" vs "South Korea", "Türkiye" vs "Turkey").
const NAME_MAP: Record<string, string> = {
  // Groep A
  'mexico': 'Mexico',
  'south africa': 'Zuid-Afrika',
  'south korea': 'Zuid-Korea',
  'korea republic': 'Zuid-Korea',
  'korea south': 'Zuid-Korea',
  'czechia': 'Tsjechië',
  'czech republic': 'Tsjechië',
  // Groep B
  'canada': 'Canada',
  'bosnia and herzegovina': 'Bosnië-Herzegovina',
  'bosnia-herzegovina': 'Bosnië-Herzegovina',
  'bosnia & herzegovina': 'Bosnië-Herzegovina',
  'bosnia': 'Bosnië-Herzegovina',
  'qatar': 'Qatar',
  'switzerland': 'Zwitserland',
  // Groep C
  'brazil': 'Brazilië',
  'morocco': 'Marokko',
  'haiti': 'Haïti',
  'scotland': 'Schotland',
  // Groep D
  'united states': 'Verenigde Staten',
  'united states of america': 'Verenigde Staten',
  'usa': 'Verenigde Staten',
  'paraguay': 'Paraguay',
  'australia': 'Australië',
  'turkey': 'Turkije',
  'turkiye': 'Turkije',
  // Groep E
  'germany': 'Duitsland',
  'ivory coast': 'Ivoorkust',
  "cote d'ivoire": 'Ivoorkust',
  'ecuador': 'Ecuador',
  'curacao': 'Curaçao',
  // Groep F
  'netherlands': 'Nederland',
  'holland': 'Nederland',
  'japan': 'Japan',
  'sweden': 'Zweden',
  'tunisia': 'Tunesië',
  // Groep G
  'belgium': 'België',
  'egypt': 'Egypte',
  'iran': 'Iran',
  'ir iran': 'Iran',
  'iran islamic republic': 'Iran',
  'new zealand': 'Nieuw-Zeeland',
  // Groep H
  'spain': 'Spanje',
  'cape verde': 'Kaapverdië',
  'cabo verde': 'Kaapverdië',
  'cape verde islands': 'Kaapverdië',
  'saudi arabia': 'Saudi-Arabië',
  'uruguay': 'Uruguay',
  // Groep I
  'france': 'Frankrijk',
  'senegal': 'Senegal',
  'iraq': 'Irak',
  'norway': 'Noorwegen',
  // Groep J
  'argentina': 'Argentinië',
  'algeria': 'Algerije',
  'austria': 'Oostenrijk',
  'jordan': 'Jordanië',
  // Groep K
  'portugal': 'Portugal',
  'dr congo': 'DR Congo',
  'congo dr': 'DR Congo',
  'democratic republic of congo': 'DR Congo',
  'democratic republic of the congo': 'DR Congo',
  'congo democratic republic': 'DR Congo',
  'uzbekistan': 'Oezbekistan',
  'colombia': 'Colombia',
  // Groep L
  'england': 'Engeland',
  'croatia': 'Kroatië',
  'ghana': 'Ghana',
  'panama': 'Panama',
};

// Lowercase, strip accenten en veelvoorkomende suffixen, zodat "Türkiye",
// "Côte d'Ivoire" en "Curaçao" matchen met de accentloze keys hierboven.
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diakritische tekens (accenten) verwijderen
    .replace(/\s+fc$|\s+national team$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDutch(apiName: string): string | null {
  if (!apiName) return null;
  const key = normalize(apiName);
  return NAME_MAP[key] ?? null;
}

// Alle echte landnamen (waarden uit NAME_MAP). Onze knockout-wedstrijden bevatten
// placeholders ("Winnaar A", "Nr. 2 B"), die niet in deze set zitten.
const REAL_TEAMS = new Set(Object.values(NAME_MAP));
function isPlaceholderTeam(team: string): boolean {
  return !REAL_TEAMS.has(team);
}

// football-data.org "stage" → onze ronde-naam. Meerdere varianten omdat de exacte
// benaming per editie kan verschillen (en het 48-team formaat een Round of 32 heeft).
const STAGE_TO_ROUND: Record<string, string> = {
  LAST_32: 'Zestiende finale',
  ROUND_OF_32: 'Zestiende finale',
  LAST_16: 'Achtste finale',
  ROUND_OF_16: 'Achtste finale',
  QUARTER_FINALS: 'Kwartfinale',
  QUARTER_FINAL: 'Kwartfinale',
  SEMI_FINALS: 'Halve finale',
  SEMI_FINAL: 'Halve finale',
  THIRD_PLACE: 'Troostfinale',
  THIRD_PLACE_PLAYOFF: 'Troostfinale',
  PLAY_OFF_FOR_THIRD_PLACE: 'Troostfinale',
  FINAL: 'Finale',
};

interface SyncResult {
  ok: boolean;
  checked: number;
  updated: number;
  message: string;
  updatedMatches: { matchNum: number; homeTeam: string; awayTeam: string; score: string }[];
  unmatched?: string[];
  teamsFilled?: { matchNum: number; homeTeam: string; awayTeam: string }[];
}

/**
 * Vult automatisch de teams van knockout-wedstrijden in zodra die bij
 * football-data.org bekend zijn. Conservatief:
 *  - vult alleen placeholders in, overschrijft nooit een al ingevuld echt team
 *    (zo blijft een handmatige correctie van de admin staan);
 *  - koppelt football-data-wedstrijden aan onze wedstrijden per ronde, op
 *    chronologische volgorde, en alleen als de aantallen exact overeenkomen.
 * Past de meegegeven ourMatches in-memory aan, zodat de uitslagen-sync daarna
 * meteen de nieuwe teams kan gebruiken.
 */
async function fillKnockoutTeams(
  prisma: PrismaClient,
  apiMatches: any[],
  ourMatches: { id: string; matchNum: number; round: string; homeTeam: string; awayTeam: string }[]
): Promise<SyncResult['teamsFilled']> {
  const filled: NonNullable<SyncResult['teamsFilled']> = [];

  // Groepeer football-data knockout-wedstrijden per onze ronde.
  const apiByRound = new Map<string, any[]>();
  for (const am of apiMatches) {
    const round = STAGE_TO_ROUND[am.stage];
    if (!round) continue;
    (apiByRound.get(round) ?? apiByRound.set(round, []).get(round)!).push(am);
  }

  for (const [round, apiRoundMatches] of apiByRound) {
    const sortedApi = [...apiRoundMatches].sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );
    const ourRound = ourMatches.filter((m) => m.round === round).sort((a, b) => a.matchNum - b.matchNum);
    // Structuur wijkt af → niet gokken, laat de admin het handmatig doen.
    if (sortedApi.length === 0 || sortedApi.length !== ourRound.length) continue;

    for (let i = 0; i < ourRound.length; i++) {
      const our = ourRound[i];
      const apiHome = toDutch(sortedApi[i].homeTeam?.name);
      const apiAway = toDutch(sortedApi[i].awayTeam?.name);
      if (!apiHome || !apiAway) continue; // teams nog niet bekend/vertaalbaar

      // Alleen placeholders invullen; bestaande echte teams met rust laten.
      const newHome = isPlaceholderTeam(our.homeTeam) ? apiHome : our.homeTeam;
      const newAway = isPlaceholderTeam(our.awayTeam) ? apiAway : our.awayTeam;
      if (newHome === our.homeTeam && newAway === our.awayTeam) continue;

      await prisma.match.update({
        where: { id: our.id },
        data: { homeTeam: newHome, awayTeam: newAway },
      });
      our.homeTeam = newHome; // in-memory bijwerken voor de uitslagen-sync hierna
      our.awayTeam = newAway;
      filled.push({ matchNum: our.matchNum, homeTeam: newHome, awayTeam: newAway });
    }
  }

  return filled;
}

export async function syncResults(prisma: PrismaClient): Promise<SyncResult> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { ok: false, checked: 0, updated: 0, message: 'Geen API-key ingesteld (FOOTBALL_DATA_API_KEY)', updatedMatches: [] };
  }

  let data: any;
  try {
    // Alle wedstrijden ophalen (niet alleen FINISHED): zo zien we ook de teams
    // van knockout-wedstrijden zodra die bekend zijn, nog vóór ze gespeeld zijn.
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
    });
    if (!res.ok) {
      return { ok: false, checked: 0, updated: 0, message: `API-fout: HTTP ${res.status}`, updatedMatches: [] };
    }
    data = await res.json();
  } catch (err: any) {
    return { ok: false, checked: 0, updated: 0, message: `Netwerkfout: ${err.message}`, updatedMatches: [] };
  }

  const apiMatches: any[] = data.matches || [];
  const ourMatches = await prisma.match.findMany();

  // Stap 1: vul automatisch de knockout-teams in zodra die bekend zijn.
  const teamsFilled = await fillKnockoutTeams(prisma, apiMatches, ourMatches);

  const updatedMatches: SyncResult['updatedMatches'] = [];
  // Onbekende landnamen verzamelen, zodat de admin ziet waarom een afgeronde
  // wedstrijd niet automatisch werd verwerkt (en hem handmatig kan invullen).
  const unmatchedSet = new Set<string>();
  let updated = 0;

  for (const apiMatch of apiMatches) {
    const homeRaw = apiMatch.homeTeam?.name;
    const awayRaw = apiMatch.awayTeam?.name;
    const home = toDutch(homeRaw);
    const away = toDutch(awayRaw);
    // football-data fullTime is de stand na verlenging, exclusief strafschoppen.
    const homeScore = apiMatch.score?.fullTime?.home;
    const awayScore = apiMatch.score?.fullTime?.away;

    // Noteer onherkende landnamen van afgeronde wedstrijden voor diagnose.
    if (homeRaw && !home) unmatchedSet.add(homeRaw);
    if (awayRaw && !away) unmatchedSet.add(awayRaw);

    if (!home || !away || homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
      continue;
    }

    // Zoek de bijbehorende wedstrijd op basis van de teams.
    const target = ourMatches.find(
      (m) => m.homeTeam === home && m.awayTeam === away
    ) || ourMatches.find(
      (m) => m.homeTeam === away && m.awayTeam === home
    );
    if (!target) continue;

    // Bepaal of teams omgedraaid zijn t.o.v. onze opstelling.
    const flipped = target.homeTeam === away && target.awayTeam === home;
    const newHome = flipped ? awayScore : homeScore;
    const newAway = flipped ? homeScore : awayScore;

    if (target.homeScore === newHome && target.awayScore === newAway) {
      continue; // al up-to-date
    }

    await prisma.match.update({
      where: { id: target.id },
      data: { homeScore: newHome, awayScore: newAway },
    });
    await recalcMatchPredictions(prisma, target.id);
    updated++;
    updatedMatches.push({
      matchNum: target.matchNum,
      homeTeam: target.homeTeam,
      awayTeam: target.awayTeam,
      score: `${newHome}-${newAway}`,
    });
  }

  const unmatched = [...unmatchedSet];
  if (unmatched.length > 0) {
    console.warn('[sync] onbekende landnamen (niet in NAME_MAP):', unmatched.join(', '));
  }

  const filled = teamsFilled ?? [];
  if (filled.length > 0) {
    console.log('[sync] knockout-teams ingevuld:', filled.map((f) => `#${f.matchNum} ${f.homeTeam}-${f.awayTeam}`).join(', '));
  }

  let message = updated > 0 ? `${updated} uitslag(en) bijgewerkt` : 'Geen nieuwe uitslagen';
  if (filled.length > 0) {
    message += ` — ${filled.length} knockout-wedstrijd(en) van teams voorzien`;
  }
  if (unmatched.length > 0) {
    message += ` — ${unmatched.length} onbekende landnaam/-namen: ${unmatched.join(', ')}`;
  }

  return {
    ok: true,
    checked: apiMatches.length,
    updated,
    message,
    updatedMatches,
    unmatched,
    teamsFilled: filled,
  };
}
