'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StudentExamsDashboard } from '@/features/offline-exams/components/student/student-exams-dashboard';

export default function StudentExamsPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <StudentExamsDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
