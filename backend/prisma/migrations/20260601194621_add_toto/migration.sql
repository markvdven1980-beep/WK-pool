-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "toto" TEXT NOT NULL DEFAULT '',
    "jokerUsed" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prediction_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prediction" ("awayScore", "homeScore", "id", "jokerUsed", "matchId", "pointsEarned", "poolId", "userId") SELECT "awayScore", "homeScore", "id", "jokerUsed", "matchId", "pointsEarned", "poolId", "userId" FROM "Prediction";
DROP TABLE "Prediction";
ALTER TABLE "new_Prediction" RENAME TO "Prediction";
CREATE UNIQUE INDEX "Prediction_userId_matchId_poolId_key" ON "Prediction"("userId", "matchId", "poolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
