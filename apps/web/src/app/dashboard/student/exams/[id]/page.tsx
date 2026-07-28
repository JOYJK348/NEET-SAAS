'use client';

import { use } from 'react';
import { StudentExamRoom } from '@/features/offline-exams/components/student/student-exam-room';

export default function StudentExamRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <StudentExamRoom examId={resolvedParams.id} />;
}
