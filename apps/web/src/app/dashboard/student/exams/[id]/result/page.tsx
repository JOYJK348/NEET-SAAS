'use client';

import { use } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StudentExamRoom } from '@/features/offline-exams/components/student/student-exam-room';

export default function StudentExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <StudentExamRoom examId={resolvedParams.id} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
