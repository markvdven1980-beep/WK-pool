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

// Vergelijk antwoorden tolerant: hoofdletters/spaties negeren.
export function answersMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return norm(a) === norm(b);
}
