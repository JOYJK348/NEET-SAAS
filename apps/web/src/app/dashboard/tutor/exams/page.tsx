'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TutorExamsDashboard } from '@/features/offline-exams/components/tutor/tutor-exams-dashboard';

export default function TutorExamsPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TutorExamsDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
