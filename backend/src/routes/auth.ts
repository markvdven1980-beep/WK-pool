import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { signToken, authMiddleware, AuthRequest } from '../middleware';

const prisma = new PrismaClient();
export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, name, email } = req.body;
  if (!username || !name) {
    res.status(400).json({ error: 'Gebruikersnaam en naam zijn verplicht' });
    return;
  }
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'Gebruikersnaam is al in gebruik' });
      return;
    }
    const user = await prisma.user.create({
      data: { username, name, email: email || null, avatar: '⚽' },
    });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar, isAdmin: user.isAdmin } });
  } catch (e) {
    res.status(500).json({ error: 'Registratie mislukt' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: 'Gebruikersnaam is verplicht' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(404).json({ error: 'Gebruiker niet gevonden' });
    return;
  }
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar, isAdmin: user.isAdmin } });
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: 'Gebruiker niet gevonden' });
    return;
  }
  res.json({ id: user.id, username: user.username, name: user.name, avatar: user.avatar, isAdmin: user.isAdmin, email: user.email });
});
