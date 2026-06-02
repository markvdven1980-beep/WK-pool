import { PrismaClient } from '@prisma/client';
import { recalcMatchPredictions } from './recalc';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC'; // FIFA World Cup

// football-data.org gebruikt Engelse landnamen; wij gebruiken Nederlandse.
const NAME_MAP: Record<string, string> = {
  'united states': 'Verenigde Staten',
  'usa': 'Verenigde Staten',
  'panama': 'Panama',
  'uruguay': 'Uruguay',
  'bolivia': 'Bolivia',
  'argentina': 'Argentinië',
  'peru': 'Peru',
  'canada': 'Canada',
  'morocco': 'Marokko',
  'spain': 'Spanje',
  'brazil': 'Brazilië',
  'japan': 'Japan',
  'serbia': 'Servië',
  'france': 'Frankrijk',
  'australia': 'Australië',
  'costa rica': 'Costa Rica',
  'england': 'Engeland',
  'mexico': 'Mexico',
  'ecuador': 'Ecuador',
  'portugal': 'Portugal',
  'ivory coast': 'Ivoorkust',
  "cote d'ivoire": 'Ivoorkust',
  'netherlands': 'Nederland',
  'sweden': 'Zweden',
  'tunisia': 'Tunesië',
  'germany': 'Duitsland',
  'scotland': 'Schotland',
  'colombia': 'Colombia',
  'algeria': 'Algerije',
  'croatia': 'Kroatië',
  'senegal': 'Senegal',
  'nigeria': 'Nigeria',
  'new zealand': 'Nieuw-Zeeland',
  'italy': 'Italië',
  'belgium': 'België',
  'paraguay': 'Paraguay',
  'kenya': 'Kenia',
  'south korea': 'Zuid-Korea',
  'korea republic': 'Zuid-Korea',
  'ghana': 'Ghana',
  'poland': 'Polen',
  'venezuela': 'Venezuela',
  'switzerland': 'Zwitserland',
  'ukraine': 'Oekraïne',
  'egypt': 'Egypte',
  'curacao': 'Curaçao',
  'curaçao': 'Curaçao',
  'turkey': 'Turkije',
  'türkiye': 'Turkije',
  'czech republic': 'Tsjechië',
  'czechia': 'Tsjechië',
  'cameroon': 'Kameroen',
  'honduras': 'Honduras',
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+fc$|\s+national team$/i, '').trim();
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
}

export async function syncResults(prisma: PrismaClient): Promise<SyncResult> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { ok: false, checked: 0, updated: 0, message: 'Geen API-key ingesteld (FOOTBALL_DATA_API_KEY)', updatedMatches: [] };
  }

  let data: any;
  try {
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
  let updated = 0;

  for (const apiMatch of apiMatches) {
    const home = toDutch(apiMatch.homeTeam?.name);
    const away = toDutch(apiMatch.awayTeam?.name);
    // football-data fullTime is de stand na verlenging, exclusief strafschoppen.
    const homeScore = apiMatch.score?.fullTime?.home;
    const awayScore = apiMatch.score?.fullTime?.away;

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

  return {
    ok: true,
    checked: apiMatches.length,
    updated,
    message: updated > 0 ? `${updated} uitslag(en) bijgewerkt` : 'Geen nieuwe uitslagen',
    updatedMatches,
  };
}
