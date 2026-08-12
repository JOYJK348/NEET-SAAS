'use client';

import { PlayCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RecordingsListView } from '@/components/recordings/RecordingsListView';

export default function TutorRecordingsPage() {
  return (
    <ProtectedRoute
      allowedRoles={['TUTOR', 'FACULTY', 'TEACHER', 'INSTRUCTOR', 'STAFF']}
    >
      <DashboardLayout>
        <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
          {/* Signature Violet Hero Header Banner */}
          <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                <PlayCircle className="w-3.5 h-3.5" /> Faculty Recordings Library
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Class Recordings
              </h1>
              <p className="mt-1 text-violet-100 max-w-xl text-xs sm:text-sm leading-relaxed">
                Replay your taught live classes. Access course, batch & subject recordings anytime.
              </p>
            </div>
          </div>

          <RecordingsListView watchHrefBase="/dashboard/tutor/recordings" />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
