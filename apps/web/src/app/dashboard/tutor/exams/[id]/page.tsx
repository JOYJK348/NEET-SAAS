'use client';

import { use } from 'react';
import { TutorSubmissionsBucketsView } from '@/features/offline-exams/components/tutor/tutor-submissions-buckets';

export default function TutorExamsSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <TutorSubmissionsBucketsView examId={resolvedParams.id} />;
}
