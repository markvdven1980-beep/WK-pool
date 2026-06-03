import bcrypt from 'bcryptjs';

// WK-thema woordenlijst voor wachtwoordgeneratie.
const WK_WORDS = [
  'Oranje', 'Keeper', 'Penalty', 'Offside', 'Voetbal',
  'Tribune', 'Kampioen', 'Corners', 'Referee', 'Vrijschop',
];

/**
 * Genereert een kort WK-thema wachtwoord.
 * Formaat: WKwoord + 2 cijfers  →  bijv. Oranje47, Keeper82
 */
export function generatePassword(_username: string): string {
  const word = WK_WORDS[Math.floor(Math.random() * WK_WORDS.length)];
  const num = Math.floor(Math.random() * 90 + 10); // 10–99
  return `${word}${num}`;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
