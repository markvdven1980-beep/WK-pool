import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware';
import { recalcMatchPredictions } from '../services/recalc';

const prisma = new PrismaClient();
export const predictionRouter = Router();

predictionRouter.use(authMiddleware);

predictionRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { poolId } = req.query;
  const where: any = { userId: req.userId };
  if (poolId) where.poolId = poolId as string;

  const predictions = await prisma.prediction.findMany({
    where,
    include: { match: true },
    orderBy: { match: { matchDate: 'asc' } },
  });
  res.json(predictions);
});

predictionRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { matchId, poolId, homeScore, awayScore, toto } = req.body;

  if (homeScore === undefined || awayScore === undefined || !matchId || !poolId) {
    res.status(400).json({ error: 'Alle velden zijn verplicht' });
    return;
  }

  if (homeScore < 0 || awayScore < 0 || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    res.status(400).json({ error: 'Ongeldige score' });
    return;
  }

  const totoValue = toto || (homeScore > awayScore ? '1' : awayScore > homeScore ? '2' : 'X');

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    res.status(404).json({ error: 'Wedstrijd niet gevonden' });
    return;
  }

  if (new Date() >= new Date(match.matchDate.getTime() - 60000)) {
    res.status(403).json({ error: 'Deadline verstreken — je kunt deze wedstrijd niet meer voorspellen' });
    return;
  }

  const membership = await prisma.poolMember.findUnique({
    where: { userId_poolId: { userId: req.userId!, poolId } },
  });
  if (!membership) {
    res.status(403).json({ error: 'Je bent geen lid van deze poule' });
    return;
  }

  // Eén voorspelling geldt voor ALLE poules van de gebruiker: schrijf hetzelfde
  // record naar elke poule waar de gebruiker lid van is, zodat de punten in elke
  // poule meetellen. (Voorheen ging dit alleen naar de geselecteerde poule.)
  const memberships = await prisma.poolMember.findMany({
    where: { userId: req.userId! },
    select: { poolId: true },
  });

  for (const m of memberships) {
    await prisma.prediction.upsert({
      where: {
        userId_matchId_poolId: { userId: req.userId!, matchId, poolId: m.poolId },
      },
      update: { homeScore, awayScore, toto: totoValue },
      create: {
        userId: req.userId!,
        matchId,
        poolId: m.poolId,
        homeScore,
        awayScore,
        toto: totoValue,
      },
    });
  }

  // Mocht de uitslag al bekend zijn, herbereken meteen de punten voor deze wedstrijd.
  if (match.homeScore !== null && match.awayScore !== null) {
    await recalcMatchPredictions(prisma, matchId);
  }

  // Geef het record van de gevraagde poule terug (voor de UI).
  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId_poolId: { userId: req.userId!, matchId, poolId } },
  });

  res.json(prediction);
});
