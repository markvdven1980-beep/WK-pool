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
  const predictions = await prisma.bonusPrediction.findMany({ where: { question } });
  for (const pred of predictions) {
    const correct = answersMatch(pred.answer, answer);
    await prisma.bonusPrediction.update({
      where: { id: pred.id },
      data: { correct, points: correct ? maxPoints : 0 },
    });
  }

  res.json({ question, answer, predictionsUpdated: predictions.length });
});
