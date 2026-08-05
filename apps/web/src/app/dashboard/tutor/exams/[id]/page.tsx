'use client';

import { use } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TutorSubmissionsBucketsView } from '@/features/offline-exams/components/tutor/tutor-submissions-buckets';

export default function TutorExamsSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TutorSubmissionsBucketsView examId={resolvedParams.id} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
