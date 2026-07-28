-- CreateEnum
CREATE TYPE "ExamSubmissionStatusEnum" AS ENUM ('SUBMITTED', 'LATE', 'ABSENT');

-- AlterTable
ALTER TABLE "Exams" ADD COLUMN     "isSubmissionLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submissionLockedAt" TIMESTAMP(3),
ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "questionPaperFileId" TEXT,
ADD COLUMN     "answerKeyFileId" TEXT;

-- CreateTable
CREATE TABLE "ExamSubmissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "answerSheetFileId" TEXT,
    "status" "ExamSubmissionStatusEnum" NOT NULL DEFAULT 'SUBMITTED',
    "evaluationStatus" "EvaluationStatusEnum" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "evaluationStartedAt" TIMESTAMP(3),
    "evaluationCompletedAt" TIMESTAMP(3),
    "evaluatedByUserId" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "tutorNotes" TEXT,
    "obtainedMarks" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "marksBreakdown" JSONB,
    "isResultsPublished" BOOLEAN NOT NULL DEFAULT false,
    "resultsPublishedAt" TIMESTAMP(3),
    "resultsPublishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "ExamSubmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSubmissionHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "editedByUserId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldMarks" DECIMAL(65,30) NOT NULL,
    "newMarks" DECIMAL(65,30) NOT NULL,
    "oldBreakdown" JSONB,
    "newBreakdown" JSONB,
    "reason" TEXT,

    CONSTRAINT "ExamSubmissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubmissions_tenantId_id_key" ON "ExamSubmissions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubmissions_examId_studentAdmissionId_key" ON "ExamSubmissions"("examId", "studentAdmissionId");

-- CreateIndex
CREATE INDEX "ExamSubmissions_tenantId_examId_idx" ON "ExamSubmissions"("tenantId", "examId");

-- CreateIndex
CREATE INDEX "ExamSubmissions_tenantId_studentAdmissionId_idx" ON "ExamSubmissions"("tenantId", "studentAdmissionId");

-- CreateIndex
CREATE INDEX "ExamSubmissionHistory_submissionId_idx" ON "ExamSubmissionHistory"("submissionId");

-- CreateIndex
CREATE INDEX "ExamSubmissionHistory_tenantId_submissionId_idx" ON "ExamSubmissionHistory"("tenantId", "submissionId");

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_questionPaperFileId_fkey" FOREIGN KEY ("questionPaperFileId") REFERENCES "FileUploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_answerKeyFileId_fkey" FOREIGN KEY ("answerKeyFileId") REFERENCES "FileUploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmissions" ADD CONSTRAINT "ExamSubmissions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmissions" ADD CONSTRAINT "ExamSubmissions_studentAdmissionId_fkey" FOREIGN KEY ("studentAdmissionId") REFERENCES "StudentAdmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmissions" ADD CONSTRAINT "ExamSubmissions_answerSheetFileId_fkey" FOREIGN KEY ("answerSheetFileId") REFERENCES "FileUploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmissionHistory" ADD CONSTRAINT "ExamSubmissionHistory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExamSubmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
