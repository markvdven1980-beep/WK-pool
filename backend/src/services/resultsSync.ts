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

interface SyncResult {
  ok: boolean;
  checked: number;
  updated: number;
  message: string;
  updatedMatches: { matchNum: number; homeTeam: string; awayTeam: string; score: string }[];
  unmatched?: string[];
}

// LET OP: automatische knockout-team-invulling is bewust verwijderd.
// football-data.org's "WC"-competitie gaf knockout-data van een vorig toernooi
// terug, waardoor verkeerde teams (bv. WK 2022) in de 2026-slots belandden.
// Knockout-teams worden daarom handmatig ingevuld via de Beheerder-pagina.

export async function syncResults(prisma: PrismaClient): Promise<SyncResult> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { ok: false, checked: 0, updated: 0, message: 'Geen API-key ingesteld (FOOTBALL_DATA_API_KEY)', updatedMatches: [] };
  }

  let data: any;
  try {
    // Alleen afgeronde wedstrijden ophalen; we koppelen uitsluitend op exact
    // teampaar, zodat alleen echte uitslagen van bestaande wedstrijden landen.
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches?status=FINISHED`, {
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
    // Bepaal de eindstand exclusief strafschoppen. De poule scoort op de stand
    // na de verlenging (bij een strafschoppenreeks altijd gelijk: 0-0, 1-1, ...).
    // football-data's fullTime bevat bij een shootout de strafschoppen en is
    // bovendien inconsistent; regularTime (na 90 min) + extraTime (doelpunten in
    // de verlenging) is de betrouwbare bron.
    const sc = apiMatch.score || {};
    let homeScore = sc.fullTime?.home;
    let awayScore = sc.fullTime?.away;
    const wentToPenalties =
      sc.duration === 'PENALTY_SHOOTOUT' ||
      (sc.penalties && sc.penalties.home != null && sc.penalties.away != null);
    if (wentToPenalties && sc.regularTime?.home != null && sc.regularTime?.away != null) {
      homeScore = sc.regularTime.home + (sc.extraTime?.home ?? 0);
      awayScore = sc.regularTime.away + (sc.extraTime?.away ?? 0);
    }

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

    // Datumcontrole: het teampaar moet ook rond dezelfde datum spelen. Zo wordt
    // een gelijknamige wedstrijd uit een ander toernooi of een oefenwedstrijd
    // (zelfde landen, andere datum) niet per ongeluk overgenomen.
    if (apiMatch.utcDate) {
      const daysApart = Math.abs(
        new Date(apiMatch.utcDate).getTime() - new Date(target.matchDate).getTime()
      ) / (1000 * 60 * 60 * 24);
      if (daysApart > 2) continue;
    }

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

  let message = updated > 0 ? `${updated} uitslag(en) bijgewerkt` : 'Geen nieuwe uitslagen';
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
  };
}
