export interface Team {
  name: string;
  code: string;
  flag: string;
}

export interface MatchData {
  matchNum: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  stadium: string;
  city: string;
  round: string;
  group?: string;
}

export interface PredictionData {
  matchId: string;
  homeScore: number;
  awayScore: number;
  jokerUsed?: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  totalPoints: number;
  exactResults: number;
  correctToto: number;
  rank: number;
}

export const ROUNDS = {
  GROUP: 'Groepsfase',
  ROUND_OF_32: 'Zestiende finale',
  ROUND_OF_16: 'Achtste finale',
  QUARTER: 'Kwartfinale',
  SEMI: 'Halve finale',
  FINAL: 'Finale',
} as const;

export const ROUND_MULTIPLIERS: Record<string, number> = {
  [ROUNDS.GROUP]: 1,
  [ROUNDS.ROUND_OF_32]: 2,
  [ROUNDS.ROUND_OF_16]: 3,
  [ROUNDS.QUARTER]: 4,
  [ROUNDS.SEMI]: 5,
  [ROUNDS.FINAL]: 6,
};

export const POINTS = {
  EXACT: 5,
  TOTO: 2,
  ONE_OFF: 1,
  WRONG: 0,
  BONUS_CHAMPION: 50,
  BONUS_TOP_SCORER: 30,
  BONUS_SURPRISE_SEMI: 20,
};

export const TEAMS: Record<string, Team> = {
  'Verenigde Staten': { name: 'Verenigde Staten', code: 'USA', flag: '🇺🇸' },
  'Panama': { name: 'Panama', code: 'PAN', flag: '🇵🇦' },
  'Uruguay': { name: 'Uruguay', code: 'URU', flag: '🇺🇾' },
  'Bolivia': { name: 'Bolivia', code: 'BOL', flag: '🇧🇴' },
  'Argentinië': { name: 'Argentinië', code: 'ARG', flag: '🇦🇷' },
  'Peru': { name: 'Peru', code: 'PER', flag: '🇵🇪' },
  'Canada': { name: 'Canada', code: 'CAN', flag: '🇨🇦' },
  'Marokko': { name: 'Marokko', code: 'MAR', flag: '🇲🇦' },
  'Spanje': { name: 'Spanje', code: 'ESP', flag: '🇪🇸' },
  'Brazilië': { name: 'Brazilië', code: 'BRA', flag: '🇧🇷' },
  'Japan': { name: 'Japan', code: 'JPN', flag: '🇯🇵' },
  'Servië': { name: 'Servië', code: 'SRB', flag: '🇷🇸' },
  'Frankrijk': { name: 'Frankrijk', code: 'FRA', flag: '🇫🇷' },
  'Australië': { name: 'Australië', code: 'AUS', flag: '🇦🇺' },
  'Costa Rica': { name: 'Costa Rica', code: 'CRC', flag: '🇨🇷' },
  'Engeland': { name: 'Engeland', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Mexico': { name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
  'Ecuador': { name: 'Ecuador', code: 'ECU', flag: '🇪🇨' },
  'Portugal': { name: 'Portugal', code: 'POR', flag: '🇵🇹' },
  'Ivoorkust': { name: 'Ivoorkust', code: 'CIV', flag: '🇨🇮' },
  'Nederland': { name: 'Nederland', code: 'NED', flag: '🇳🇱' },
  'Zweden': { name: 'Zweden', code: 'SWE', flag: '🇸🇪' },
  'Tunesië': { name: 'Tunesië', code: 'TUN', flag: '🇹🇳' },
  'Duitsland': { name: 'Duitsland', code: 'GER', flag: '🇩🇪' },
  'Schotland': { name: 'Schotland', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Colombia': { name: 'Colombia', code: 'COL', flag: '🇨🇴' },
  'Algerije': { name: 'Algerije', code: 'ALG', flag: '🇩🇿' },
  'Kroatië': { name: 'Kroatië', code: 'CRO', flag: '🇭🇷' },
  'Senegal': { name: 'Senegal', code: 'SEN', flag: '🇸🇳' },
  'Nigeria': { name: 'Nigeria', code: 'NGA', flag: '🇳🇬' },
  'Nieuw-Zeeland': { name: 'Nieuw-Zeeland', code: 'NZL', flag: '🇳🇿' },
  'Italië': { name: 'Italië', code: 'ITA', flag: '🇮🇹' },
  'België': { name: 'België', code: 'BEL', flag: '🇧🇪' },
  'Paraguay': { name: 'Paraguay', code: 'PAR', flag: '🇵🇾' },
  'Kenia': { name: 'Kenia', code: 'KEN', flag: '🇰🇪' },
  'Zuid-Korea': { name: 'Zuid-Korea', code: 'KOR', flag: '🇰🇷' },
  'Ghana': { name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
  'Polen': { name: 'Polen', code: 'POL', flag: '🇵🇱' },
  'Venezuela': { name: 'Venezuela', code: 'VEN', flag: '🇻🇪' },
  'Zwitserland': { name: 'Zwitserland', code: 'SUI', flag: '🇨🇭' },
  'Oekraïne': { name: 'Oekraïne', code: 'UKR', flag: '🇺🇦' },
  'Egypte': { name: 'Egypte', code: 'EGY', flag: '🇪🇬' },
  'Curaçao': { name: 'Curaçao', code: 'CUW', flag: '🇨🇼' },
  'Turkije': { name: 'Turkije', code: 'TUR', flag: '🇹🇷' },
  'Tsjechië': { name: 'Tsjechië', code: 'CZE', flag: '🇨🇿' },
  'Kameroen': { name: 'Kameroen', code: 'CMR', flag: '🇨🇲' },
  'Honduras': { name: 'Honduras', code: 'HON', flag: '🇭🇳' },
};

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
