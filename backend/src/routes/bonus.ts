import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware';
import { BONUS_QUESTIONS, bonusDeadlinePassed, BONUS_DEADLINE } from '../services/bonus';

const prisma = new PrismaClient();
export const bonusRouter = Router();

bonusRouter.use(authMiddleware);

// Haal de bonusvragen + jouw antwoorden op voor een poule.
bonusRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { poolId } = req.query;
  if (!poolId) {
    res.status(400).json({ error: 'poolId is verplicht' });
    return;
  }

  const predictions = await prisma.bonusPrediction.findMany({
    where: { userId: req.userId, poolId: poolId as string },
  });
  const officialAnswers = await prisma.bonusAnswer.findMany();

  res.json({
    questions: BONUS_QUESTIONS,
    deadline: BONUS_DEADLINE.toISOString(),
    deadlinePassed: bonusDeadlinePassed(),
    predictions,
    officialAnswers: officialAnswers.map((a) => ({ question: a.question, answer: a.answer })),
  });
});

// Sla een bonusvoorspelling op.
bonusRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { poolId, question, answer } = req.body;
  if (!poolId || !question || answer === undefined) {
    res.status(400).json({ error: 'Alle velden zijn verplicht' });
    return;
  }
  if (!BONUS_QUESTIONS.some((q) => q.key === question)) {
    res.status(400).json({ error: 'Onbekende bonusvraag' });
    return;
  }
  if (bonusDeadlinePassed()) {
    res.status(403).json({ error: 'Deadline voor bonusvragen is verstreken' });
    return;
  }

  const membership = await prisma.poolMember.findUnique({
    where: { userId_poolId: { userId: req.userId!, poolId } },
  });
  if (!membership) {
    res.status(403).json({ error: 'Je bent geen lid van deze poule' });
    return;
  }

  const prediction = await prisma.bonusPrediction.upsert({
    where: { userId_poolId_question: { userId: req.userId!, poolId, question } },
    update: { answer },
    create: { userId: req.userId!, poolId, question, answer },
  });

  res.json(prediction);
});
