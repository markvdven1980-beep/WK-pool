export const FLAGS: Record<string, string> = {
  // Groep A
  'Mexico': '🇲🇽',
  'Zuid-Afrika': '🇿🇦',
  'Zuid-Korea': '🇰🇷',
  'Tsjechië': '🇨🇿',
  // Groep B
  'Canada': '🇨🇦',
  'Bosnië-Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦',
  'Zwitserland': '🇨🇭',
  // Groep C
  'Brazilië': '🇧🇷',
  'Marokko': '🇲🇦',
  'Haïti': '🇭🇹',
  'Schotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  // Groep D
  'Verenigde Staten': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australië': '🇦🇺',
  'Turkije': '🇹🇷',
  // Groep E
  'Duitsland': '🇩🇪',
  'Ivoorkust': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Curaçao': '🇨🇼',
  // Groep F
  'Nederland': '🇳🇱',
  'Japan': '🇯🇵',
  'Zweden': '🇸🇪',
  'Tunesië': '🇹🇳',
  // Groep G
  'België': '🇧🇪',
  'Egypte': '🇪🇬',
  'Iran': '🇮🇷',
  'Nieuw-Zeeland': '🇳🇿',
  // Groep H
  'Spanje': '🇪🇸',
  'Kaapverdië': '🇨🇻',
  'Saudi-Arabië': '🇸🇦',
  'Uruguay': '🇺🇾',
  // Groep I
  'Frankrijk': '🇫🇷',
  'Senegal': '🇸🇳',
  'Irak': '🇮🇶',
  'Noorwegen': '🇳🇴',
  // Groep J
  'Argentinië': '🇦🇷',
  'Algerije': '🇩🇿',
  'Oostenrijk': '🇦🇹',
  'Jordanië': '🇯🇴',
  // Groep K
  'Portugal': '🇵🇹',
  'DR Congo': '🇨🇩',
  'Oezbekistan': '🇺🇿',
  'Colombia': '🇨🇴',
  // Groep L
  'Engeland': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Kroatië': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panama': '🇵🇦',
};

export function getFlag(team: string): string {
  return FLAGS[team] || '🏳️';
}

export const GROUPS: Record<string, string[]> = {
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

export const ALL_TEAMS: string[] = Array.from(
  new Set(Object.values(GROUPS).flat())
).sort((a, b) => a.localeCompare(b, 'nl'));
