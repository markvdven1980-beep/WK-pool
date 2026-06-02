const ROUND_MULTIPLIERS: Record<string, number> = {
  'Groepsfase': 1,
  'Zestiende finale': 2,
  'Achtste finale': 3,
  'Kwartfinale': 4,
  'Halve finale': 5,
  'Finale': 6,
  'Troostfinale': 4,
};

const HOME_TEAM = 'Nederland';

function actualToto(homeScore: number, awayScore: number): string {
  if (homeScore > awayScore) return '1';
  if (awayScore > homeScore) return '2';
  return 'X';
}

export function isFavouriteMatch(homeTeam: string, awayTeam: string): boolean {
  return homeTeam === HOME_TEAM || awayTeam === HOME_TEAM;
}

export function calculatePointsClean(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  round: string,
  toto: string,
  homeTeam?: string,
  awayTeam?: string
): { points: number; exact: boolean; toto: boolean } {
  const multiplier = ROUND_MULTIPLIERS[round] || 1;
  // Nederland-wedstrijden leveren altijd dubbele punten op.
  const favouriteMultiplier = homeTeam && awayTeam && isFavouriteMatch(homeTeam, awayTeam) ? 2 : 1;
  const totalMultiplier = multiplier * favouriteMultiplier;

  const isExact = predictedHome === actualHome && predictedAway === actualAway;
  const totoCorrect = toto === actualToto(actualHome, actualAway);

  // Punten zijn optelbaar: exacte uitslag (5) en toto (2) tellen apart.
  let base = 0;
  if (isExact) {
    base += 5;
  } else {
    // Uitslag 1 doelpunt ernaast (alleen als niet exact).
    const homeDiff = Math.abs(predictedHome - actualHome);
    const awayDiff = Math.abs(predictedAway - actualAway);
    if (homeDiff <= 1 && awayDiff <= 1) base += 1;
  }
  if (totoCorrect) base += 2;

  return { points: base * totalMultiplier, exact: isExact, toto: totoCorrect };
}
