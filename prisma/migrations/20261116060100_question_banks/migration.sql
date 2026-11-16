-- Soal lama (data pengembangan) direset karena struktur bank soal berubah.
DELETE FROM "TestItem";
-- DropForeignKey
ALTER TABLE "TestItem" DROP CONSTRAINT "TestItem_testId_fkey";

-- DropIndex
DROP INDEX "TestItem_testId_order_key";

-- AlterTable
ALTER TABLE "TestItem" DROP COLUMN "testId",
ADD COLUMN     "bankId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TestExecution" ADD COLUMN     "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestBank" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBank_title_key" ON "QuestionBank"("title");

-- CreateIndex
CREATE UNIQUE INDEX "TestBank_testId_bankId_key" ON "TestBank"("testId", "bankId");

-- CreateIndex
CREATE UNIQUE INDEX "TestItem_bankId_order_key" ON "TestItem"("bankId", "order");

-- AddForeignKey
ALTER TABLE "TestBank" ADD CONSTRAINT "TestBank_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestBank" ADD CONSTRAINT "TestBank_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestItem" ADD CONSTRAINT "TestItem_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

