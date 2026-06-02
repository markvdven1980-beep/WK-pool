import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware';
import { calculatePointsClean } from '../services/scoring';

// Genereer een leesbare uitnodigingscode (zonder verwarrende tekens als 0/O, 1/I).
function generateInviteCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

const prisma = new PrismaClient();
export const poolRouter = Router();

poolRouter.use(authMiddleware);

poolRouter.get('/', async (req: AuthRequest, res: Response) => {
  const memberships = await prisma.poolMember.findMany({
    where: { userId: req.userId },
    include: {
      pool: {
        include: { _count: { select: { members: true } } },
      },
    },
  });
  res.json(memberships.map((m) => ({ ...m.pool, role: m.role })));
});

poolRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Naam is verplicht' });
    return;
  }

  const inviteCode = generateInviteCode(8);
  const pool = await prisma.pool.create({
    data: {
      name,
      inviteCode,
      adminId: req.userId!,
      members: {
        create: { userId: req.userId!, role: 'admin' },
      },
    },
  });

  res.json(pool);
});

poolRouter.post('/:id/join', async (req: AuthRequest, res: Response) => {
  const { inviteCode } = req.body;
  const pool = await prisma.pool.findUnique({ where: { id: req.params.id } });

  if (!pool) {
    const poolByCode = await prisma.pool.findUnique({ where: { inviteCode } });
    if (!poolByCode) {
      res.status(404).json({ error: 'Poule niet gevonden' });
      return;
    }
    const existing = await prisma.poolMember.findUnique({
      where: { userId_poolId: { userId: req.userId!, poolId: poolByCode.id } },
    });
    if (existing) {
      res.status(409).json({ error: 'Je bent al lid van deze poule' });
      return;
    }
    await prisma.poolMember.create({
      data: { userId: req.userId!, poolId: poolByCode.id },
    });
    res.json(poolByCode);
    return;
  }

  if (pool.inviteCode !== inviteCode) {
    res.status(403).json({ error: 'Ongeldige uitnodigingscode' });
    return;
  }

  const existing = await prisma.poolMember.findUnique({
    where: { userId_poolId: { userId: req.userId!, poolId: pool.id } },
  });
  if (existing) {
    res.status(409).json({ error: 'Je bent al lid van deze poule' });
    return;
  }

  await prisma.poolMember.create({
    data: { userId: req.userId!, poolId: pool.id },
  });
  res.json(pool);
});

poolRouter.post('/join', async (req: AuthRequest, res: Response) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    res.status(400).json({ error: 'Uitnodigingscode is verplicht' });
    return;
  }

  const pool = await prisma.pool.findUnique({ where: { inviteCode } });
  if (!pool) {
    res.status(404).json({ error: 'Poule niet gevonden' });
    return;
  }

  const existing = await prisma.poolMember.findUnique({
    where: { userId_poolId: { userId: req.userId!, poolId: pool.id } },
  });
  if (existing) {
    res.status(409).json({ error: 'Je bent al lid van deze poule' });
    return;
  }

  await prisma.poolMember.create({
    data: { userId: req.userId!, poolId: pool.id },
  });
  res.json(pool);
});

poolRouter.get('/:id/leaderboard', async (req: AuthRequest, res: Response) => {
  const poolId = req.params.id;

  const members = await prisma.poolMember.findMany({
    where: { poolId },
    include: { user: true },
  });

  const predictions = await prisma.prediction.findMany({
    where: { poolId, pointsEarned: { not: null } },
    include: { match: true },
  });

  const bonusPredictions = await prisma.bonusPrediction.findMany({
    where: { poolId, points: { not: null } },
  });

  const leaderboard = members.map((member) => {
    const userPreds = predictions.filter((p) => p.userId === member.userId);
    let totalPoints = 0;
    let exactResults = 0;
    let correctToto = 0;

    for (const pred of userPreds) {
      if (pred.match.homeScore === null || pred.match.awayScore === null) continue;
      const result = calculatePointsClean(
        pred.homeScore,
        pred.awayScore,
        pred.match.homeScore,
        pred.match.awayScore,
        pred.match.round,
        pred.toto,
        pred.match.homeTeam,
        pred.match.awayTeam
      );
      totalPoints += result.points;
      if (result.exact) exactResults++;
      if (result.toto) correctToto++;
    }

    const userBonus = bonusPredictions.filter((b) => b.userId === member.userId);
    const bonusPoints = userBonus.reduce((sum, b) => sum + (b.points ?? 0), 0);
    totalPoints += bonusPoints;

    return {
      userId: member.userId,
      userName: member.user.name,
      avatar: member.user.avatar,
      totalPoints,
      bonusPoints,
      exactResults,
      correctToto,
      rank: 0,
    };
  });

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints || b.exactResults - a.exactResults);
  leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

  res.json(leaderboard);
});
