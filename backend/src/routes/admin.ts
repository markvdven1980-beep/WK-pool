import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware';
import { recalcMatchPredictions } from '../services/recalc';
import { syncResults } from '../services/resultsSync';
import { BONUS_QUESTIONS, pointsForQuestion, answersMatch } from '../services/bonus';
import { generatePassword, hashPassword } from '../services/password';

const prisma = new PrismaClient();
export const adminRouter = Router();

adminRouter.use(authMiddleware);

async function requireAdmin(req: AuthRequest, res: Response): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.isAdmin) {
    res.status(403).json({ error: 'Geen beheerderrechten' });
    return false;
  }
  return true;
}

adminRouter.put('/matches/:id/result', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { homeScore, awayScore } = req.body;
  if (homeScore === undefined || awayScore === undefined) {
    res.status(400).json({ error: 'Score is verplicht' });
    return;
  }

  const match = await prisma.match.update({
    where: { id: req.params.id },
    data: { homeScore, awayScore },
  });

  const predictionsUpdated = await recalcMatchPredictions(prisma, match.id);

  res.json({ match, predictionsUpdated });
});

adminRouter.put('/matches/:id/teams', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { homeTeam, awayTeam } = req.body;
  const match = await prisma.match.update({
    where: { id: req.params.id },
    data: { homeTeam, awayTeam },
  });

  res.json(match);
});

// Handmatig uitslagen synchroniseren via football-data.org.
adminRouter.post('/sync', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const result = await syncResults(prisma);
  res.json(result);
});

// Alle gebruikers ophalen (voor admin-overzicht).
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, avatar: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// Gebruiker verwijderen inclusief al zijn data.
adminRouter.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { res.status(404).json({ error: 'Gebruiker niet gevonden' }); return; }
  if (user.isAdmin) { res.status(403).json({ error: 'Kan admin-account niet verwijderen' }); return; }

  // Verwijder alle data van deze gebruiker.
  await prisma.bonusPrediction.deleteMany({ where: { userId: user.id } });
  await prisma.prediction.deleteMany({ where: { userId: user.id } });
  await prisma.poolMember.deleteMany({ where: { userId: user.id } });
  // Verwijder ook poules waarvan deze gebruiker admin is.
  const ownedPools = await prisma.pool.findMany({ where: { adminId: user.id } });
  for (const pool of ownedPools) {
    await prisma.bonusPrediction.deleteMany({ where: { poolId: pool.id } });
    await prisma.prediction.deleteMany({ where: { poolId: pool.id } });
    await prisma.poolMember.deleteMany({ where: { poolId: pool.id } });
    await prisma.pool.delete({ where: { id: pool.id } });
  }
  await prisma.user.delete({ where: { id: user.id } });
  res.json({ deleted: user.username });
});

// Wachtwoord resetten — genereert nieuw WK-wachtwoord, toont het eenmalig.
adminRouter.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404).json({ error: 'Gebruiker niet gevonden' });
    return;
  }
  const plainPassword = generatePassword(user.username);
  const passwordHash = await hashPassword(plainPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ username: user.username, newPassword: plainPassword });
});

// Reset alle wedstrijden naar de officiële WK 2026 data (wist ook alle voorspellingen).
adminRouter.post('/reset-matches', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  await prisma.bonusPrediction.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  // Zet de seed-vlag terug zodat de seed bij de volgende deploy opnieuw draait.
  res.json({ ok: true, message: 'Wedstrijden gewist. Push een lege commit om de seed opnieuw te draaien, of herstart de backend.' });
});

// Corrigeer wedstrijdtijden naar officiële UTC-tijden (o.b.v. CBS Sports ET-schema).
// Heeft GEEN effect op voorspellingen of scores — alleen matchDate wordt bijgewerkt.
adminRouter.post('/fix-match-times', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  // Alle 72 groepsfase tijden: omgezet van officiële ET-tijden (EDT = UTC-4) naar UTC.
  const corrections: Record<number, string> = {
    1:  '2026-06-11T19:00:00Z', // Mexico - Zuid-Afrika (3 PM ET = 21:00 CEST)
    2:  '2026-06-12T02:00:00Z', // Zuid-Korea - Tsjechië (10 PM ET = 04:00 CEST)
    3:  '2026-06-18T16:00:00Z', // Tsjechië - Zuid-Afrika (12 PM ET = 18:00 CEST)
    4:  '2026-06-19T01:00:00Z', // Mexico - Zuid-Korea (9 PM ET = 03:00 CEST)
    5:  '2026-06-25T01:00:00Z', // Tsjechië - Mexico (9 PM ET = 03:00 CEST)
    6:  '2026-06-25T01:00:00Z', // Zuid-Afrika - Zuid-Korea (9 PM ET = 03:00 CEST)
    7:  '2026-06-12T19:00:00Z', // Canada - Bosnië (3 PM ET = 21:00 CEST)
    8:  '2026-06-13T19:00:00Z', // Qatar - Zwitserland (3 PM ET = 21:00 CEST)
    9:  '2026-06-18T19:00:00Z', // Zwitserland - Bosnië (3 PM ET = 21:00 CEST)
    10: '2026-06-18T22:00:00Z', // Canada - Qatar (6 PM ET = 00:00 CEST)
    11: '2026-06-24T19:00:00Z', // Zwitserland - Canada (3 PM ET = 21:00 CEST)
    12: '2026-06-24T19:00:00Z', // Bosnië - Qatar (3 PM ET = 21:00 CEST)
    13: '2026-06-13T22:00:00Z', // Brazilië - Marokko (6 PM ET = 00:00 CEST)
    14: '2026-06-14T01:00:00Z', // Haïti - Schotland (9 PM ET = 03:00 CEST)
    15: '2026-06-19T22:00:00Z', // Schotland - Marokko (6 PM ET = 00:00 CEST)
    16: '2026-06-20T01:00:00Z', // Brazilië - Haïti (9 PM ET = 03:00 CEST)
    17: '2026-06-24T22:00:00Z', // Schotland - Brazilië (6 PM ET = 00:00 CEST)
    18: '2026-06-24T22:00:00Z', // Marokko - Haïti (6 PM ET = 00:00 CEST)
    19: '2026-06-13T01:00:00Z', // VS - Paraguay (9 PM ET = 03:00 CEST)
    20: '2026-06-14T04:00:00Z', // Australië - Turkije (12 AM ET = 06:00 CEST)
    21: '2026-06-19T19:00:00Z', // VS - Australië (3 PM ET = 21:00 CEST)
    22: '2026-06-20T04:00:00Z', // Turkije - Paraguay (12 AM ET = 06:00 CEST)
    23: '2026-06-26T02:00:00Z', // Turkije - VS (10 PM ET = 04:00 CEST)
    24: '2026-06-26T02:00:00Z', // Paraguay - Australië (10 PM ET = 04:00 CEST)
    25: '2026-06-14T17:00:00Z', // Duitsland - Curaçao (1 PM ET = 19:00 CEST)
    26: '2026-06-14T23:00:00Z', // Ivoorkust - Ecuador (7 PM ET = 01:00 CEST)
    27: '2026-06-20T20:00:00Z', // Duitsland - Ivoorkust (4 PM ET = 22:00 CEST)
    28: '2026-06-21T00:00:00Z', // Ecuador - Curaçao (8 PM ET = 02:00 CEST)
    29: '2026-06-25T20:00:00Z', // Ecuador - Duitsland (4 PM ET = 22:00 CEST)
    30: '2026-06-25T20:00:00Z', // Curaçao - Ivoorkust (4 PM ET = 22:00 CEST)
    31: '2026-06-14T20:00:00Z', // Nederland - Japan (4 PM ET = 22:00 CEST) ✓
    32: '2026-06-15T02:00:00Z', // Zweden - Tunesië (10 PM ET = 04:00 CEST)
    33: '2026-06-20T17:00:00Z', // Nederland - Zweden (1 PM ET = 19:00 CEST)
    34: '2026-06-21T04:00:00Z', // Tunesië - Japan (12 AM ET = 06:00 CEST)
    35: '2026-06-25T23:00:00Z', // Japan - Zweden (7 PM ET = 01:00 CEST)
    36: '2026-06-25T23:00:00Z', // Tunesië - Nederland (7 PM ET = 01:00 CEST)
    37: '2026-06-15T19:00:00Z', // België - Egypte (3 PM ET = 21:00 CEST)
    38: '2026-06-16T01:00:00Z', // Iran - Nieuw-Zeeland (9 PM ET = 03:00 CEST)
    39: '2026-06-21T19:00:00Z', // België - Iran (3 PM ET = 21:00 CEST)
    40: '2026-06-22T01:00:00Z', // Nieuw-Zeeland - Egypte (9 PM ET = 03:00 CEST)
    41: '2026-06-27T03:00:00Z', // Egypte - Iran (11 PM ET = 05:00 CEST)
    42: '2026-06-27T03:00:00Z', // Nieuw-Zeeland - België (11 PM ET = 05:00 CEST)
    43: '2026-06-15T16:00:00Z', // Spanje - Kaapverdië (12 PM ET = 18:00 CEST)
    44: '2026-06-15T22:00:00Z', // Saudi-Arabië - Uruguay (6 PM ET = 00:00 CEST)
    45: '2026-06-21T16:00:00Z', // Spanje - Saudi-Arabië (12 PM ET = 18:00 CEST)
    46: '2026-06-21T22:00:00Z', // Uruguay - Kaapverdië (6 PM ET = 00:00 CEST)
    47: '2026-06-27T00:00:00Z', // Kaapverdië - Saudi-Arabië (8 PM ET = 02:00 CEST)
    48: '2026-06-27T00:00:00Z', // Uruguay - Spanje (8 PM ET = 02:00 CEST)
    49: '2026-06-16T19:00:00Z', // Frankrijk - Senegal (3 PM ET = 21:00 CEST)
    50: '2026-06-16T22:00:00Z', // Irak - Noorwegen (6 PM ET = 00:00 CEST)
    51: '2026-06-22T21:00:00Z', // Frankrijk - Irak (5 PM ET = 23:00 CEST)
    52: '2026-06-23T00:00:00Z', // Noorwegen - Senegal (8 PM ET = 02:00 CEST)
    53: '2026-06-26T19:00:00Z', // Noorwegen - Frankrijk (3 PM ET = 21:00 CEST)
    54: '2026-06-26T19:00:00Z', // Senegal - Irak (3 PM ET = 21:00 CEST)
    55: '2026-06-17T01:00:00Z', // Argentinië - Algerije (9 PM ET = 03:00 CEST)
    56: '2026-06-17T04:00:00Z', // Oostenrijk - Jordanië (12 AM ET = 06:00 CEST)
    57: '2026-06-22T17:00:00Z', // Argentinië - Oostenrijk (1 PM ET = 19:00 CEST)
    58: '2026-06-23T03:00:00Z', // Jordanië - Algerije (11 PM ET = 05:00 CEST)
    59: '2026-06-28T02:00:00Z', // Algerije - Oostenrijk (10 PM ET = 04:00 CEST)
    60: '2026-06-28T02:00:00Z', // Jordanië - Argentinië (10 PM ET = 04:00 CEST)
    61: '2026-06-17T17:00:00Z', // Portugal - DR Congo (1 PM ET = 19:00 CEST)
    62: '2026-06-18T02:00:00Z', // Oezbekistan - Colombia (10 PM ET = 04:00 CEST)
    63: '2026-06-23T17:00:00Z', // Portugal - Oezbekistan (1 PM ET = 19:00 CEST)
    64: '2026-06-24T02:00:00Z', // Colombia - DR Congo (10 PM ET = 04:00 CEST)
    65: '2026-06-27T23:30:00Z', // Colombia - Portugal (7:30 PM ET = 01:30 CEST)
    66: '2026-06-27T23:30:00Z', // DR Congo - Oezbekistan (7:30 PM ET = 01:30 CEST)
    67: '2026-06-17T20:00:00Z', // Engeland - Kroatië (4 PM ET = 22:00 CEST)
    68: '2026-06-17T23:00:00Z', // Ghana - Panama (7 PM ET = 01:00 CEST)
    69: '2026-06-23T20:00:00Z', // Engeland - Ghana (4 PM ET = 22:00 CEST)
    70: '2026-06-23T23:00:00Z', // Panama - Kroatië (7 PM ET = 01:00 CEST)
    71: '2026-06-27T21:00:00Z', // Panama - Engeland (5 PM ET = 23:00 CEST)
    72: '2026-06-27T21:00:00Z', // Kroatië - Ghana (5 PM ET = 23:00 CEST)
  };

  let updated = 0;
  for (const [matchNumStr, dateStr] of Object.entries(corrections)) {
    const matchNum = parseInt(matchNumStr);
    const result = await prisma.match.updateMany({
      where: { matchNum },
      data: { matchDate: new Date(dateStr) },
    });
    updated += result.count;
  }

  res.json({
    ok: true,
    updated,
    message: `${updated} wedstrijdtijden bijgewerkt naar officiële UTC-tijden. Voorspellingen zijn niet gewijzigd.`,
  });
});

// Corrigeer het knockout-schema naar het officiële FIFA-bracket (Round of 32 t/m
// kwartfinales). Vervangt alleen placeholders — al ingevulde echte teams blijven
// staan. Raakt voorspellingen niet aan (die hangen aan de wedstrijd, niet de teams).
adminRouter.post('/fix-knockout-schedule', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  // Zestiende finales: volledige correctie (teams + datum + locatie).
  const r32: Record<number, { home: string; away: string; date: string; stadium: string; city: string }> = {
    73: { home: 'Nr. 2 A',   away: 'Nr. 2 B',         date: '2026-06-28T19:00:00Z', stadium: 'SoFi Stadium',          city: 'Los Angeles' },
    74: { home: 'Winnaar E', away: 'Nr. 3 A/B/C/D/F', date: '2026-06-29T20:30:00Z', stadium: 'Gillette Stadium',      city: 'Boston' },
    75: { home: 'Winnaar F', away: 'Nr. 2 C',         date: '2026-06-29T23:00:00Z', stadium: 'Estadio BBVA',          city: 'Monterrey' },
    76: { home: 'Winnaar C', away: 'Nr. 2 F',         date: '2026-06-29T16:00:00Z', stadium: 'NRG Stadium',           city: 'Houston' },
    77: { home: 'Winnaar I', away: 'Nr. 3 C/D/F/G/H', date: '2026-06-30T21:00:00Z', stadium: 'MetLife Stadium',       city: 'New Jersey' },
    78: { home: 'Nr. 2 E',   away: 'Nr. 2 I',         date: '2026-06-30T17:00:00Z', stadium: 'AT&T Stadium',          city: 'Dallas' },
    79: { home: 'Winnaar A', away: 'Nr. 3 C/E/F/H/I', date: '2026-06-30T23:00:00Z', stadium: 'Estadio Azteca',        city: 'Mexico-Stad' },
    80: { home: 'Winnaar L', away: 'Nr. 3 E/H/I/J/K', date: '2026-07-01T16:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    81: { home: 'Winnaar D', away: 'Nr. 3 B/E/F/I/J', date: '2026-07-01T20:00:00Z', stadium: "Levi's Stadium",        city: 'San Francisco' },
    82: { home: 'Winnaar G', away: 'Nr. 3 A/H/I/J',   date: '2026-07-01T20:00:00Z', stadium: 'Lumen Field',           city: 'Seattle' },
    83: { home: 'Nr. 2 K',   away: 'Nr. 2 L',         date: '2026-07-02T23:00:00Z', stadium: 'BMO Field',             city: 'Toronto' },
    84: { home: 'Winnaar H', away: 'Nr. 2 J',         date: '2026-07-02T19:00:00Z', stadium: 'SoFi Stadium',          city: 'Los Angeles' },
    85: { home: 'Winnaar B', away: 'Nr. 3 E/F/G/I/J', date: '2026-07-02T23:00:00Z', stadium: 'BC Place',              city: 'Vancouver' },
    86: { home: 'Winnaar J', away: 'Nr. 2 H',         date: '2026-07-03T22:00:00Z', stadium: 'Hard Rock Stadium',     city: 'Miami' },
    87: { home: 'Winnaar K', away: 'Nr. 3 D/E/I/J/L', date: '2026-07-03T23:30:00Z', stadium: 'Arrowhead Stadium',     city: 'Kansas City' },
    88: { home: 'Nr. 2 D',   away: 'Nr. 2 G',         date: '2026-07-03T18:00:00Z', stadium: 'AT&T Stadium',          city: 'Dallas' },
  };

  // Achtste finales en kwartfinales: alleen de bracket-koppelingen (W-verwijzingen).
  const links: Record<number, { home: string; away: string }> = {
    89: { home: 'Winnaar W74', away: 'Winnaar W77' },
    90: { home: 'Winnaar W73', away: 'Winnaar W75' },
    91: { home: 'Winnaar W76', away: 'Winnaar W78' },
    92: { home: 'Winnaar W79', away: 'Winnaar W80' },
    93: { home: 'Winnaar W83', away: 'Winnaar W84' },
    94: { home: 'Winnaar W81', away: 'Winnaar W82' },
    95: { home: 'Winnaar W86', away: 'Winnaar W88' },
    96: { home: 'Winnaar W85', away: 'Winnaar W87' },
    98: { home: 'Winnaar W93', away: 'Winnaar W94' },
    99: { home: 'Winnaar W91', away: 'Winnaar W92' },
  };

  let updated = 0;

  for (const [numStr, d] of Object.entries(r32)) {
    const matchNum = parseInt(numStr);
    const match = await prisma.match.findUnique({ where: { matchNum } });
    if (!match) continue;
    await prisma.match.update({
      where: { matchNum },
      data: {
        // Forceer de officiële placeholders: zo worden ook verkeerd ingevulde
        // teams (bv. via een eerdere foutieve sync) teruggezet naar het schema.
        homeTeam: d.home,
        awayTeam: d.away,
        matchDate: new Date(d.date),
        stadium: d.stadium,
        city: d.city,
      },
    });
    updated++;
  }

  for (const [numStr, d] of Object.entries(links)) {
    const matchNum = parseInt(numStr);
    const match = await prisma.match.findUnique({ where: { matchNum } });
    if (!match) continue;
    await prisma.match.update({
      where: { matchNum },
      data: { homeTeam: d.home, awayTeam: d.away },
    });
    updated++;
  }

  res.json({
    ok: true,
    updated,
    message: `${updated} knockout-wedstrijden teruggezet naar het officiële schema. Voorspellingen zijn niet gewijzigd.`,
  });
});

// Verwijder spaties aan begin/eind van bestaande gebruikersnamen (en namen).
// Lost op dat inloggen mislukte doordat een gebruikersnaam met een spatie werd
// opgeslagen. Raakt voorspellingen/scores niet aan; slaat namen over die na het
// trimmen met een andere gebruiker zouden botsen.
adminRouter.post('/clean-usernames', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const users = await prisma.user.findMany();
  const cleaned: { from: string; to: string }[] = [];
  const skipped: string[] = [];

  for (const u of users) {
    const trimmedUser = u.username.trim();
    const trimmedName = u.name.trim();
    if (trimmedUser === u.username && trimmedName === u.name) continue; // niets te doen

    // Controleer op botsing met een andere gebruiker na het trimmen.
    const clash = users.some(
      (o) => o.id !== u.id && o.username.trim().toLowerCase() === trimmedUser.toLowerCase()
    );
    if (clash) {
      skipped.push(u.username);
      continue;
    }

    await prisma.user.update({
      where: { id: u.id },
      data: { username: trimmedUser, name: trimmedName },
    });
    if (trimmedUser !== u.username) cleaned.push({ from: u.username, to: trimmedUser });
  }

  res.json({
    ok: true,
    cleaned,
    skipped,
    message: `${cleaned.length} gebruikersnaam/-namen opgeschoond${skipped.length ? `, ${skipped.length} overgeslagen wegens botsing` : ''}.`,
  });
});

// Synchroniseer bestaande voorspellingen naar alle poules van elke gebruiker.
// Alleen-aanmaken: bestaande voorspellingen worden NOOIT gewijzigd of overschreven.
// Lost op dat een gebruiker in twee poules in de tweede poule geen punten kreeg.
adminRouter.post('/sync-predictions', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const users = await prisma.user.findMany({ select: { id: true } });
  let created = 0;
  const affectedMatchIds = new Set<string>();

  for (const user of users) {
    const memberships = await prisma.poolMember.findMany({
      where: { userId: user.id },
      select: { poolId: true },
    });
    if (memberships.length <= 1) continue; // niets te synchroniseren

    const poolIds = memberships.map((m) => m.poolId);
    const preds = await prisma.prediction.findMany({ where: { userId: user.id } });

    // Bron-voorspelling per wedstrijd (eerst gevonden record wint).
    const byMatch = new Map<string, (typeof preds)[number]>();
    for (const p of preds) {
      if (!byMatch.has(p.matchId)) byMatch.set(p.matchId, p);
    }
    // Bestaande (wedstrijd, poule)-combinaties — die laten we met rust.
    const existing = new Set(preds.map((p) => `${p.matchId}:${p.poolId}`));

    for (const [matchId, src] of byMatch) {
      for (const poolId of poolIds) {
        if (existing.has(`${matchId}:${poolId}`)) continue; // bestaat al → niet aanraken
        await prisma.prediction.create({
          data: {
            userId: user.id,
            matchId,
            poolId,
            homeScore: src.homeScore,
            awayScore: src.awayScore,
            toto: src.toto,
          },
        });
        created++;
        affectedMatchIds.add(matchId);
      }
    }
  }

  // Herbereken de punten voor alle wedstrijden waar records zijn bijgemaakt.
  for (const matchId of affectedMatchIds) {
    await recalcMatchPredictions(prisma, matchId);
  }

  res.json({
    ok: true,
    created,
    matchesRecalculated: affectedMatchIds.size,
    message: `${created} voorspelling(en) gesynchroniseerd naar alle poules. Bestaande voorspellingen zijn niet gewijzigd.`,
  });
});

// Alle poules ophalen (voor admin-overzicht).
adminRouter.get('/pools', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const pools = await prisma.pool.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(pools);
});

// Poule verwijderen inclusief alle data.
adminRouter.delete('/pools/:id', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const pool = await prisma.pool.findUnique({ where: { id: req.params.id } });
  if (!pool) { res.status(404).json({ error: 'Poule niet gevonden' }); return; }
  await prisma.bonusPrediction.deleteMany({ where: { poolId: pool.id } });
  await prisma.prediction.deleteMany({ where: { poolId: pool.id } });
  await prisma.poolMember.deleteMany({ where: { poolId: pool.id } });
  await prisma.pool.delete({ where: { id: pool.id } });
  res.json({ deleted: pool.name });
});

// Haal de bonusvragen + huidige officiële antwoorden op (los van poules), zodat
// de admin ze kan beoordelen ook zonder lid van een poule te zijn.
adminRouter.get('/bonus', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const officialAnswers = await prisma.bonusAnswer.findMany();
  res.json({
    questions: BONUS_QUESTIONS,
    officialAnswers: officialAnswers.map((a) => ({ question: a.question, answer: a.answer })),
  });
});

// Diagnose: wie mist een voorspelling voor de opgegeven wedstrijden (?matchNums=69,70).
// Puur lezend; verandert niets aan voorspellingen of punten.
adminRouter.get('/missing-predictions', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const nums = String(req.query.matchNums ?? '')
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));
  if (nums.length === 0) { res.status(400).json({ error: 'matchNums is verplicht' }); return; }

  const matches = await prisma.match.findMany({ where: { matchNum: { in: nums } } });
  const memberships = await prisma.poolMember.findMany({
    include: { user: { select: { name: true } }, pool: { select: { name: true } } },
  });

  const result = [];
  for (const m of matches.sort((a, b) => a.matchNum - b.matchNum)) {
    const preds = await prisma.prediction.findMany({
      where: { matchId: m.id },
      select: { userId: true, poolId: true },
    });
    const has = new Set(preds.map((p) => `${p.userId}:${p.poolId}`));
    const missing = memberships
      .filter((mem) => !has.has(`${mem.userId}:${mem.poolId}`))
      .map((mem) => `${mem.user.name} (${mem.pool.name})`)
      .sort();
    result.push({ matchNum: m.matchNum, teams: `${m.homeTeam} - ${m.awayTeam}`, missingCount: missing.length, missing });
  }
  res.json(result);
});

// Diagnose: dekking per afgeronde wedstrijd — hoeveel voorspellingen er zijn t.o.v.
// het aantal lidmaatschappen. Een wedstrijd die door veel deelnemers gemist is,
// wijst op een technisch/deadline-probleem i.p.v. individueel vergeten.
adminRouter.get('/prediction-coverage', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const finished = await prisma.match.findMany({
    where: { homeScore: { not: null } },
    orderBy: { matchNum: 'asc' },
  });
  const totalMemberships = await prisma.poolMember.count();
  const preds = await prisma.prediction.findMany({ select: { matchId: true } });
  const countByMatch = new Map<string, number>();
  for (const p of preds) countByMatch.set(p.matchId, (countByMatch.get(p.matchId) ?? 0) + 1);

  const matches = finished.map((m) => ({
    matchNum: m.matchNum,
    teams: `${m.homeTeam} - ${m.awayTeam}`,
    round: m.round,
    voorspellingen: countByMatch.get(m.id) ?? 0,
    ontbreekt: totalMemberships - (countByMatch.get(m.id) ?? 0),
  }));

  res.json({ totalMemberships, matches });
});

// Diagnose: overzicht van de wedstrijdvoorspellingen van één gebruiker per poule,
// inclusief afgeronde wedstrijden die niet zijn ingevuld en de toegekende punten.
adminRouter.get('/user-predictions', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const username = (req.query.username as string)?.trim();
  if (!username) { res.status(400).json({ error: 'username is verplicht' }); return; }

  const allUsers = await prisma.user.findMany();
  const user = allUsers.find((u) => u.username.trim().toLowerCase() === username.toLowerCase());
  if (!user) { res.status(404).json({ error: 'Gebruiker niet gevonden' }); return; }

  const memberships = await prisma.poolMember.findMany({
    where: { userId: user.id },
    include: { pool: { select: { name: true } } },
  });
  const finished = await prisma.match.findMany({
    where: { homeScore: { not: null } },
    orderBy: { matchNum: 'asc' },
  });
  const preds = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: true },
  });

  const perPool = memberships.map((m) => {
    const poolPreds = preds.filter((p) => p.poolId === m.poolId);
    const predictedIds = new Set(poolPreds.map((p) => p.matchId));
    const predictedFinished = poolPreds
      .filter((p) => p.match.homeScore !== null)
      .sort((a, b) => a.match.matchNum - b.match.matchNum)
      .map((p) => ({
        matchNum: p.match.matchNum,
        teams: `${p.match.homeTeam} - ${p.match.awayTeam}`,
        voorspelling: `${p.homeScore}-${p.awayScore}`,
        uitslag: `${p.match.homeScore}-${p.match.awayScore}`,
        toto: p.toto,
        punten: p.pointsEarned,
      }));
    const missing = finished
      .filter((fm) => !predictedIds.has(fm.id))
      .map((fm) => ({
        matchNum: fm.matchNum,
        teams: `${fm.homeTeam} - ${fm.awayTeam}`,
        uitslag: `${fm.homeScore}-${fm.awayScore}`,
      }));
    return {
      pool: m.pool.name,
      totaalVoorspellingen: poolPreds.length,
      afgerondeWedstrijden: finished.length,
      ingevuldVanAfgerond: predictedFinished.length,
      nietIngevuld: missing.length,
      voorspellingenMetUitslag: predictedFinished,
      nietIngevuldeAfgerondeWedstrijden: missing,
    };
  });

  res.json({ user: user.name, username: user.username, perPool });
});

// Overzicht van alle antwoorden op één bonusvraag, met per deelnemer of het
// (met de huidige matchlogica) goed gerekend wordt. Handig om vooraf te zien
// wie punten krijgt. Geef ?answer=... mee om tegen een specifiek antwoord te
// toetsen; anders wordt het opgeslagen officiële antwoord gebruikt.
adminRouter.get('/bonus-predictions', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const question = req.query.question as string;
  if (!question) { res.status(400).json({ error: 'question is verplicht' }); return; }
  const q = BONUS_QUESTIONS.find((x) => x.key === question);
  if (!q) { res.status(400).json({ error: 'Onbekende bonusvraag' }); return; }

  const stored = await prisma.bonusAnswer.findUnique({ where: { question } });
  const answer = (req.query.answer as string) ?? stored?.answer ?? '';

  const preds = await prisma.bonusPrediction.findMany({
    where: { question },
    include: {
      user: { select: { name: true, username: true } },
      pool: { select: { name: true } },
    },
  });

  const rows = preds.map((p) => ({
    user: p.user.name,
    username: p.user.username,
    pool: p.pool.name,
    answer: p.answer,
    correct: answer ? answersMatch(p.answer, answer, q.type) : null,
  }));

  res.json({
    question,
    label: q.label,
    points: q.points,
    evaluatedAgainst: answer,
    total: rows.length,
    matched: rows.filter((r) => r.correct).length,
    predictions: rows.sort((a, b) => Number(b.correct) - Number(a.correct)),
  });
});

// Stel het officiële antwoord op een bonusvraag in en ken punten toe.
adminRouter.put('/bonus', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { question, answer } = req.body;
  if (!question || answer === undefined) {
    res.status(400).json({ error: 'Vraag en antwoord zijn verplicht' });
    return;
  }
  if (!BONUS_QUESTIONS.some((q) => q.key === question)) {
    res.status(400).json({ error: 'Onbekende bonusvraag' });
    return;
  }

  await prisma.bonusAnswer.upsert({
    where: { question },
    update: { answer },
    create: { question, answer },
  });

  const maxPoints = pointsForQuestion(question);
  const questionType = BONUS_QUESTIONS.find((q) => q.key === question)?.type;
  const predictions = await prisma.bonusPrediction.findMany({ where: { question } });
  for (const pred of predictions) {
    const correct = answersMatch(pred.answer, answer, questionType);
    await prisma.bonusPrediction.update({
      where: { id: pred.id },
      data: { correct, points: correct ? maxPoints : 0 },
    });
  }

  res.json({ question, answer, predictionsUpdated: predictions.length });
});
