export const FLAGS: Record<string, string> = {
  'Verenigde Staten': '🇺🇸',
  'Panama': '🇵🇦',
  'Uruguay': '🇺🇾',
  'Bolivia': '🇧🇴',
  'Argentinië': '🇦🇷',
  'Peru': '🇵🇪',
  'Canada': '🇨🇦',
  'Marokko': '🇲🇦',
  'Spanje': '🇪🇸',
  'Brazilië': '🇧🇷',
  'Japan': '🇯🇵',
  'Servië': '🇷🇸',
  'Frankrijk': '🇫🇷',
  'Australië': '🇦🇺',
  'Costa Rica': '🇨🇷',
  'Engeland': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Mexico': '🇲🇽',
  'Ecuador': '🇪🇨',
  'Portugal': '🇵🇹',
  'Ivoorkust': '🇨🇮',
  'Nederland': '🇳🇱',
  'Zweden': '🇸🇪',
  'Tunesië': '🇹🇳',
  'Duitsland': '🇩🇪',
  'Schotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Colombia': '🇨🇴',
  'Algerije': '🇩🇿',
  'Kroatië': '🇭🇷',
  'Senegal': '🇸🇳',
  'Nigeria': '🇳🇬',
  'Nieuw-Zeeland': '🇳🇿',
  'Italië': '🇮🇹',
  'België': '🇧🇪',
  'Paraguay': '🇵🇾',
  'Kenia': '🇰🇪',
  'Zuid-Korea': '🇰🇷',
  'Ghana': '🇬🇭',
  'Polen': '🇵🇱',
  'Venezuela': '🇻🇪',
  'Zwitserland': '🇨🇭',
  'Oekraïne': '🇺🇦',
  'Egypte': '🇪🇬',
  'Curaçao': '🇨🇼',
  'Turkije': '🇹🇷',
  'Tsjechië': '🇨🇿',
  'Kameroen': '🇨🇲',
  'Honduras': '🇭🇳',
};

export function getFlag(team: string): string {
  return FLAGS[team] || '🏳️';
}

export const GROUPS: Record<string, string[]> = {
  A: ['Verenigde Staten', 'Panama', 'Uruguay', 'Bolivia'],
  B: ['Argentinië', 'Peru', 'Canada', 'Marokko'],
  C: ['Spanje', 'Brazilië', 'Japan', 'Servië'],
  D: ['Frankrijk', 'Australië', 'Costa Rica', 'Engeland'],
  E: ['Mexico', 'Ecuador', 'Portugal', 'Ivoorkust'],
  F: ['Nederland', 'Japan', 'Zweden', 'Tunesië'],
  G: ['Duitsland', 'Schotland', 'Colombia', 'Algerije'],
  H: ['Kroatië', 'Senegal', 'Nigeria', 'Nieuw-Zeeland'],
  I: ['Italië', 'België', 'Paraguay', 'Kenia'],
  J: ['Zuid-Korea', 'Ghana', 'Polen', 'Venezuela'],
  K: ['Zwitserland', 'Oekraïne', 'Egypte', 'Curaçao'],
  L: ['Turkije', 'Tsjechië', 'Kameroen', 'Honduras'],
};

// Alle deelnemende landen, alfabetisch en zonder duplicaten.
export const ALL_TEAMS: string[] = Array.from(
  new Set(Object.values(GROUPS).flat())
).sort((a, b) => a.localeCompare(b, 'nl'));
