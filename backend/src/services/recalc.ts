import { PrismaClient } from '@prisma/client';
import { calculatePointsClean } from './scoring';

/**
 * Herbereken de punten van alle voorspellingen voor één wedstrijd.
 * Wordt aangeroepen na het invoeren of automatisch ophalen van een uitslag.
 */
export async function recalcMatchPredictions(prisma: PrismaClient, matchId: string): Promise<number> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return 0;

  const predictions = await prisma.prediction.findMany({ where: { matchId } });

  for (const pred of predictions) {
    if (match.homeScore === null || match.awayScore === null) {
      // Uitslag (weer) leeg → punten resetten.
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { pointsEarned: null },
      });
      continue;
    }
    const result = calculatePointsClean(
      pred.homeScore,
      pred.awayScore,
      match.homeScore,
      match.awayScore,
      match.round,
      pred.toto,
      match.homeTeam,
      match.awayTeam
    );
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { pointsEarned: result.points },
    });
  }

  return predictions.length;
}
