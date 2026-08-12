'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RecordingWatchView } from '@/components/recordings/RecordingWatchView';

export default function StudentRecordingWatchPage() {
  const params = useParams();
  const recordingId = typeof params.recordingId === 'string' ? params.recordingId : '';

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <RecordingWatchView
        recordingId={recordingId}
        backHref="/dashboard/student/recordings"
      />
    </ProtectedRoute>
  );
}
