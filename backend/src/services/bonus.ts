export type BonusInputType = 'text' | 'number' | 'team' | 'groupWinner';

export interface BonusQuestion {
  key: string;
  label: string;
  placeholder?: string;
  points: number;
  type: BonusInputType;
  group?: string;
}

// Officiële WK 2026 groepen (FIFA loting december 2025)
export const OFFICIAL_GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'Zuid-Afrika', 'Zuid-Korea', 'Tsjechië'],
  B: ['Canada', 'Bosnië-Herzegovina', 'Qatar', 'Zwitserland'],
  C: ['Brazilië', 'Marokko', 'Haïti', 'Schotland'],
  D: ['Verenigde Staten', 'Paraguay', 'Australië', 'Turkije'],
  E: ['Duitsland', 'Ivoorkust', 'Ecuador', 'Curaçao'],
  F: ['Nederland', 'Japan', 'Zweden', 'Tunesië'],
  G: ['België', 'Egypte', 'Iran', 'Nieuw-Zeeland'],
  H: ['Spanje', 'Kaapverdië', 'Saudi-Arabië', 'Uruguay'],
  I: ['Frankrijk', 'Senegal', 'Irak', 'Noorwegen'],
  J: ['Argentinië', 'Algerije', 'Oostenrijk', 'Jordanië'],
  K: ['Portugal', 'DR Congo', 'Oezbekistan', 'Colombia'],
  L: ['Engeland', 'Kroatië', 'Ghana', 'Panama'],
};

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const BONUS_QUESTIONS: BonusQuestion[] = [
  { key: 'wereldkampioen', label: 'Wereldkampioen', points: 25, type: 'team' },
  { key: 'topscorer_wk', label: 'Topscorer van het WK', placeholder: 'Bijv. Kylian Mbappé', points: 25, type: 'text' },
  { key: 'topscorer_nl', label: 'Topscorer van Nederland', placeholder: 'Bijv. Memphis Depay', points: 25, type: 'text' },
  { key: 'curacao_goals', label: 'Totaal aantal doelpunten van Curaçao', placeholder: 'Bijv. 3', points: 10, type: 'number' },
  ...GROUP_LETTERS.map((g) => ({
    key: `groepswinnaar_${g}`,
    label: `Winnaar Groep ${g}`,
    points: 10,
    type: 'groupWinner' as const,
    group: g,
  })),
];

// Deadline voor bonusvragen: 10 juni 2026, 23:59 CEST (= 21:59 UTC).
export const BONUS_DEADLINE = new Date('2026-06-10T21:59:00Z');

export function bonusDeadlinePassed(): boolean {
  return new Date() >= BONUS_DEADLINE;
}

export function pointsForQuestion(key: string): number {
  return BONUS_QUESTIONS.find((q) => q.key === key)?.points ?? 0;
}

// Normaliseer voor vergelijking: kleine letters, accenten en leestekens weg.
function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accenten verwijderen
    .replace(/[^a-z0-9\s]/g, ' ') // leestekens → spatie
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Vergelijk een voorspelling met het officiële antwoord.
 * - Voor team/groepswinnaar/getal: exacte match (na normalisatie).
 * - Voor tekst (bv. topscorer): het officiële antwoord mag meerdere geldige
 *   namen bevatten, gescheiden door "/", ";", "," "&" of " en " (handig bij
 *   twee gedeelde topscorers). Een voor- óf achternaam telt ook: als de
 *   ingevulde naam een deelverzameling is van een geldige naam (of andersom),
 *   is het goed. Zo krijgt "Depay" punten bij het antwoord "Memphis Depay".
 */
export function answersMatch(prediction: string, official: string, type?: BonusInputType): boolean {
  const predNorm = normalizeAnswer(prediction);
  const officialNorm = normalizeAnswer(official);
  if (!predNorm || !officialNorm) return false;

  if (type && type !== 'text') {
    return predNorm === officialNorm;
  }

  const predWords = predNorm.split(' ').filter((w) => w.length >= 2);
  if (predWords.length === 0) return false;
  const predSet = new Set(predWords);

  const officialNames = official
    .split(/\s*[/;,&]\s*|\s+en\s+/i)
    .map(normalizeAnswer)
    .filter(Boolean);

  for (const name of officialNames) {
    if (predNorm === name) return true;
    const nameWords = name.split(' ').filter((w) => w.length >= 2);
    if (nameWords.length === 0) continue;
    const nameSet = new Set(nameWords);
    const predSubsetOfName = predWords.every((w) => nameSet.has(w));
    const nameSubsetOfPred = nameWords.every((w) => predSet.has(w));
    if (predSubsetOfName || nameSubsetOfPred) return true;
  }
  return false;
}
