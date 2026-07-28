'use client';

import { use } from 'react';
import { TutorEvaluationWorkspace } from '@/features/offline-exams/components/tutor/tutor-evaluation-workspace';

export default function TutorEvaluationPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const resolvedParams = use(params);
  return <TutorEvaluationWorkspace examId={resolvedParams.id} submissionId={resolvedParams.sid} />;
}
