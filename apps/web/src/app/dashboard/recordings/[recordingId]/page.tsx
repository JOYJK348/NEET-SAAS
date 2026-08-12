'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RecordingWatchView } from '@/components/recordings/RecordingWatchView';

export default function RecordingWatchPage() {
  const params = useParams();
  const recordingId = typeof params.recordingId === 'string' ? params.recordingId : '';

  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN', 'ADMIN']}>
      <RecordingWatchView recordingId={recordingId} backHref="/dashboard/recordings" />
    </ProtectedRoute>
  );
}
