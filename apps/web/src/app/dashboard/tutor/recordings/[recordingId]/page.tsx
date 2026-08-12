'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RecordingWatchView } from '@/components/recordings/RecordingWatchView';

export default function TutorRecordingWatchPage() {
  const params = useParams();
  const recordingId = typeof params.recordingId === 'string' ? params.recordingId : '';

  return (
    <ProtectedRoute
      allowedRoles={['TUTOR', 'FACULTY', 'TEACHER', 'INSTRUCTOR', 'STAFF']}
    >
      <DashboardLayout>
        <RecordingWatchView
          recordingId={recordingId}
          backHref="/dashboard/tutor/recordings"
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
