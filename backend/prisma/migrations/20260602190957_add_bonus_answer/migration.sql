-- CreateTable
CREATE TABLE "BonusAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BonusAnswer_question_key" ON "BonusAnswer"("question");
