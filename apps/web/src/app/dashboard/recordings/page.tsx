'use client';

import { Video, ChevronRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RecordingsListView } from '@/components/recordings/RecordingsListView';

export default function RecordingsPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN', 'ADMIN']}>
      <DashboardLayout>
        <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
          {/* Header Banner - ISML LMS Light Blue Style */}
          <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Management Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Platform Recordings Library</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
                All Class Recordings
              </h1>
              <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                Replay auto-recorded live classes at your own pace with playback controls. Filter by
                status, subject, or batch.
              </p>
            </div>
          </div>

          <RecordingsListView watchHrefBase="/dashboard/recordings" allowDelete />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
