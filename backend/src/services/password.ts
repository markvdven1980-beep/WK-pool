import bcrypt from 'bcryptjs';

// WK-thema woordenlijst voor wachtwoordgeneratie.
const WK_WORDS = [
  'Oranje', 'Voetbal', 'WK2026', 'Penalty', 'Keeper',
  'Doelpunt', 'Offside', 'Tribune', 'Kampioen', 'Stadion',
];

const SPECIAL = ['!', '#', '@', '*'];

/**
 * Genereert een WK-thema wachtwoord op basis van de gebruikersnaam.
 * Formaat: WKwoord + 3 letters van naam (hoofdletter) + 2 cijfers + speciaal teken
 * Voorbeeld: Oranje + MAR + 26 + ! → OranjeMAR26!
 */
export function generatePassword(username: string): string {
  const word = WK_WORDS[Math.floor(Math.random() * WK_WORDS.length)];
  const namePart = username.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  const num = Math.floor(Math.random() * 90 + 10); // 10–99
  const special = SPECIAL[Math.floor(Math.random() * SPECIAL.length)];
  return `${word}${namePart}${num}${special}`;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
