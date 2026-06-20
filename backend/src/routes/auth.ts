import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { signToken, authMiddleware, AuthRequest } from '../middleware';
import { generatePassword, hashPassword, verifyPassword } from '../services/password';

const prisma = new PrismaClient();
export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, name, email } = req.body;
  if (!username || !name) {
    res.status(400).json({ error: 'Gebruikersnaam en naam zijn verplicht' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Gebruikersnaam is al in gebruik' });
    return;
  }
  try {
    const plainPassword = generatePassword(username);
    const passwordHash = await hashPassword(plainPassword);
    const user = await prisma.user.create({
      data: { username, name, email: email || null, avatar: '⚽', passwordHash },
    });
    const token = signToken(user.id);
    // Wachtwoord wordt EENMALIG teruggegeven — daarna nooit meer opvraagbaar.
    res.json({
      token,
      generatedPassword: plainPassword,
      user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar, isAdmin: user.isAdmin },
    });
  } catch {
    res.status(500).json({ error: 'Registratie mislukt' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' });
    return;
  }
  // Exacte match eerst; valt terug op hoofdletter-ongevoelig zoeken zodat
  // mobiele auto-capitalisatie (bijv. "Mariekevandeven" i.p.v. "mariekevandeven")
  // of een afwijkende casing geen inlogfout veroorzaakt.
  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    const target = username.trim().toLowerCase();
    const all = await prisma.user.findMany();
    user = all.find((u) => u.username.toLowerCase() === target) ?? null;
  }
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Gebruikersnaam of wachtwoord onjuist' });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Gebruikersnaam of wachtwoord onjuist' });
    return;
  }
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar, isAdmin: user.isAdmin } });
});

// Eenmalige bootstrap: stel het wachtwoord van de admin in als die nog geen hash heeft.
// Werkt ALLEEN als de admin nog geen passwordHash heeft — daarna automatisch uitgeschakeld.
authRouter.post('/bootstrap-admin', async (req: Request, res: Response) => {
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!admin) {
    res.status(404).json({ error: 'Geen admin-account gevonden' });
    return;
  }
  if (admin.passwordHash) {
    res.status(403).json({ error: 'Admin heeft al een wachtwoord — gebruik reset via admin-dashboard' });
    return;
  }
  const plain = generatePassword('admin');
  const hash = await hashPassword(plain);
  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: hash } });
  res.json({ message: 'Admin wachtwoord ingesteld', password: plain });
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: 'Gebruiker niet gevonden' });
    return;
  }
  res.json({ id: user.id, username: user.username, name: user.name, avatar: user.avatar, isAdmin: user.isAdmin, email: user.email });
});
