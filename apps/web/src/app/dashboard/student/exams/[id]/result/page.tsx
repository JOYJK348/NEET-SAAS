'use client';

import { use } from 'react';
import { StudentResultScreen } from '@/features/offline-exams/components/student/student-result-screen';

export default function StudentExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <StudentResultScreen examId={resolvedParams.id} />;
}
