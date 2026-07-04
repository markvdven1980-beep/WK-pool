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
    // Alle wedstrijden ophalen (ook nog niet afgerond), zodat we ook de datum/tijd
    // van komende en lopende wedstrijden kunnen synchroniseren met de echte bron.
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

  const updatedMatches: SyncResult['updatedMatches'] = [];
  // Onbekende landnamen verzamelen, zodat de admin ziet waarom een afgeronde
  // wedstrijd niet automatisch werd verwerkt (en hem handmatig kan invullen).
  const unmatchedSet = new Set<string>();
  let updated = 0;
  let datesUpdated = 0;

  for (const apiMatch of apiMatches) {
    const homeRaw = apiMatch.homeTeam?.name;
    const awayRaw = apiMatch.awayTeam?.name;
    const home = toDutch(homeRaw);
    const away = toDutch(awayRaw);

    // Noteer onherkende landnamen voor diagnose.
    if (homeRaw && !home) unmatchedSet.add(homeRaw);
    if (awayRaw && !away) unmatchedSet.add(awayRaw);
    if (!home || !away) continue;

    // Koppel op teamnaam én fase (groep vs knockout). Zo wordt een teampaar dat
    // zowel in de groepsfase als de knockout kan voorkomen eenduidig gekoppeld,
    // en telt een gelijknamige wedstrijd niet dubbel.
    const apiIsGroup = apiMatch.stage === 'GROUP_STAGE';
    const target = ourMatches.find(
      (m) =>
        ((m.homeTeam === home && m.awayTeam === away) || (m.homeTeam === away && m.awayTeam === home)) &&
        (m.group != null) === apiIsGroup
    );
    if (!target) continue;

    const updateData: { matchDate?: Date; homeScore?: number; awayScore?: number } = {};

    // 1) Datum/tijd synchroniseren met de echte bron.
    if (apiMatch.utcDate) {
      const apiDate = new Date(apiMatch.utcDate);
      if (!isNaN(apiDate.getTime()) && new Date(target.matchDate).getTime() !== apiDate.getTime()) {
        updateData.matchDate = apiDate;
        datesUpdated++;
      }
    }

    // 2) Eindstand exclusief strafschoppen, als de wedstrijd is afgerond. Bij een
    // strafschoppenreeks is regularTime (na 90 min) + extraTime (verlenging) de
    // betrouwbare bron; fullTime bevat dan de strafschoppen en is inconsistent.
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

    let scoreChanged = false;
    if (homeScore != null && awayScore != null) {
      const flipped = target.homeTeam === away && target.awayTeam === home;
      const newHome = flipped ? awayScore : homeScore;
      const newAway = flipped ? homeScore : awayScore;
      if (target.homeScore !== newHome || target.awayScore !== newAway) {
        updateData.homeScore = newHome;
        updateData.awayScore = newAway;
        scoreChanged = true;
      }
    }

    if (updateData.matchDate === undefined && !scoreChanged) continue; // niets te doen

    await prisma.match.update({ where: { id: target.id }, data: updateData });
    if (!scoreChanged) continue; // alleen datum bijgewerkt

    await recalcMatchPredictions(prisma, target.id);
    updated++;
    updatedMatches.push({
      matchNum: target.matchNum,
      homeTeam: target.homeTeam,
      awayTeam: target.awayTeam,
      score: `${updateData.homeScore}-${updateData.awayScore}`,
    });
  }

  const unmatched = [...unmatchedSet];
  if (unmatched.length > 0) {
    console.warn('[sync] onbekende landnamen (niet in NAME_MAP):', unmatched.join(', '));
  }

  let message = updated > 0 ? `${updated} uitslag(en) bijgewerkt` : 'Geen nieuwe uitslagen';
  if (datesUpdated > 0) {
    message += ` — ${datesUpdated} datum/tijd bijgewerkt`;
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
  };
}
