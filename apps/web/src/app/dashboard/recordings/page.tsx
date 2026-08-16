'use client';

import { Video } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RecordingsListView } from '@/components/recordings/RecordingsListView';

export default function RecordingsPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN', 'ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
          {/* Signature Violet Hero Header Banner */}
          <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                <Video className="w-3.5 h-3.5" /> Platform Recordings Library
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
                All Class Recordings
              </h1>
              <p className="mt-1 text-violet-100 max-w-xl text-xs sm:text-sm leading-relaxed">
                Replay auto-recorded live classes at your own pace with playback controls. Filter by status, subject, or batch.
              </p>
            </div>
          </div>

          <RecordingsListView watchHrefBase="/dashboard/recordings" allowDelete />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
