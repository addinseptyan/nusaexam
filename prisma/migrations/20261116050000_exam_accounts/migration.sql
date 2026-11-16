-- CreateTable
CREATE TABLE "ExamAccount" (
    "id" TEXT NOT NULL,
    "examPeriodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "participantNumber" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "usernameKey" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamAccount_examPeriodId_idx" ON "ExamAccount"("examPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAccount_examPeriodId_participantNumber_key" ON "ExamAccount"("examPeriodId", "participantNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAccount_examPeriodId_usernameKey_key" ON "ExamAccount"("examPeriodId", "usernameKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAccount_studentId_examPeriodId_key" ON "ExamAccount"("studentId", "examPeriodId");

-- AddForeignKey
ALTER TABLE "ExamAccount" ADD CONSTRAINT "ExamAccount_examPeriodId_fkey" FOREIGN KEY ("examPeriodId") REFERENCES "ExamPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAccount" ADD CONSTRAINT "ExamAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

