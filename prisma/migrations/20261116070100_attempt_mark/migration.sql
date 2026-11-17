-- Tandai ragu-ragu per soal pada attempt peserta
ALTER TABLE "ExamAttemptItem" ADD COLUMN "marked" BOOLEAN NOT NULL DEFAULT false;
