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

// TIJDELIJK: verwijder alle niet-admin gebruikers + hun data.
adminRouter.delete('/users/all-non-admin', async (req: AuthRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const users = await prisma.user.findMany({ where: { isAdmin: false } });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) { res.json({ deleted: 0 }); return; }
  await prisma.bonusPrediction.deleteMany({ where: { userId: { in: ids } } });
  await prisma.prediction.deleteMany({ where: { userId: { in: ids } } });
  await prisma.poolMember.deleteMany({ where: { userId: { in: ids } } });
  // Verwijder ook pools die door deze gebruikers zijn aangemaakt.
  const pools = await prisma.pool.findMany({ where: { adminId: { in: ids } } });
  const poolIds = pools.map((p) => p.id);
  if (poolIds.length > 0) {
    await prisma.bonusPrediction.deleteMany({ where: { poolId: { in: poolIds } } });
    await prisma.prediction.deleteMany({ where: { poolId: { in: poolIds } } });
    await prisma.poolMember.deleteMany({ where: { poolId: { in: poolIds } } });
    await prisma.pool.deleteMany({ where: { id: { in: poolIds } } });
  }
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  res.json({ deleted: ids.length, names: users.map((u) => u.username) });
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
