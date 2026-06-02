import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const matchRouter = Router();

matchRouter.get('/', async (req: Request, res: Response) => {
  const { round, group, date } = req.query;
  const where: any = {};
  if (round) where.round = round as string;
  if (group) where.group = group as string;
  if (date) {
    const d = new Date(date as string);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.matchDate = { gte: d, lt: next };
  }
  const matches = await prisma.match.findMany({
    where,
    orderBy: [{ matchDate: 'asc' }, { matchNum: 'asc' }],
  });
  res.json(matches);
});

matchRouter.get('/:id', async (req: Request, res: Response) => {
  const match = await prisma.match.findUnique({ where: { id: req.params.id } });
  if (!match) {
    res.status(404).json({ error: 'Wedstrijd niet gevonden' });
    return;
  }
  res.json(match);
});
