'use client';

import { PlayCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RecordingsListView } from '@/components/recordings/RecordingsListView';

import { ChevronRight } from 'lucide-react';

export default function TutorRecordingsPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR', 'FACULTY', 'TEACHER', 'INSTRUCTOR', 'STAFF']}>
      <DashboardLayout>
        <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
          {/* ── ISML LMS Light Blue Header Banner ── */}
          <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Faculty Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Class Recordings Library</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
                My Live Class Recordings 📹
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Replay your taught live classes. Access course, batch & subject recordings anytime.
              </p>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 text-xs font-extrabold flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <PlayCircle className="w-4 h-4 text-[#0052CC]" />
              <span>Recordings Library</span>
            </div>
          </div>

          <RecordingsListView watchHrefBase="/dashboard/tutor/recordings" />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
