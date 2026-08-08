'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentBatches } from '@/features/student-dashboard/hooks/use-student-batches';
import type { StudentEnrollmentDto } from '@/features/student-dashboard/types/student-dashboard.types';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import {
  Layers,
  BookOpen,
  MapPin,
  Calendar,
  WifiOff,
  Bell,
  FlaskConical,
  AlertCircle,
  Star,
  Search,
} from 'lucide-react';

// ─── Semi-Circle Arc Progress Gauge ────────────────────────────────────────

// ─── Batch Card Component (Matches Tutor Portal Style) ──────────────────────

function BatchCard({ enrollment }: { enrollment: StudentEnrollmentDto }) {
  const { batch, isPrimary } = enrollment;
  if (!batch) return null;

  const isCourseDeactivated = batch.course?.isActive === false;
  const isBatchInactive = batch.isActive === false || batch.status === 'INACTIVE';
  const isDeactivated = isCourseDeactivated || isBatchInactive;

  const enrolledCount = (batch as any).totalEnrolled || (batch as any).studentCount || 0;
  const maxStudents = batch.maxStudents || 40;
  const percent = Math.min(100, Math.round((enrolledCount / maxStudents) * 100));

  const branchName = batch.branch?.name || 'Head Office';
  const academicYearName = batch.academicYear?.name || 'Academic Year';
  const deliveryCode = batch.deliveryType?.code || 'OFFLINE';

  return (
    <Card
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between',
        isDeactivated && 'opacity-75 saturate-50 border-rose-200 bg-rose-50/10',
      )}
    >
      <div className="space-y-4">
        {/* Top Header Row 1: Icon & Batch Code */}
        <div className="flex items-center justify-between gap-2">
          <div className="p-2 rounded-xl bg-violet-100/70 text-violet-600 shrink-0">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 text-slate-700 rounded-xl text-xs font-bold font-mono">
            <Bell className="h-3.5 w-3.5 text-slate-400" />
            <span>Batch Code: {batch.code}</span>
          </div>
        </div>

        {/* Top Header Row 2: Primary Tag & Status */}
        <div className="flex items-center justify-between gap-2">
          {isPrimary ? (
            <span className="px-3 py-1 bg-amber-100/70 text-amber-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              PRIMARY BATCH
            </span>
          ) : (
            <span className="px-3 py-1 bg-violet-100/70 text-violet-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-violet-600" />
              ELECTIVE BATCH
            </span>
          )}
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-extrabold uppercase tracking-wider">
            STATUS: {batch.status || 'ACTIVE'}
          </span>
        </div>

        {/* Large Batch Title & Course Info */}
        <div className="text-center my-2 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-violet-100/70 border border-violet-200/80 text-violet-800 rounded-lg text-xs font-black">
            <span>Batch Name:</span>
            <span className="font-extrabold">{batch.name}</span>
          </div>
          {batch.course && batch.course.name !== batch.name && (
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug pt-1">
              Course: {batch.course.name}
            </h3>
          )}
          <p className="text-xs font-extrabold text-slate-500">
            Section / Batch Code: <span className="font-mono text-slate-800 font-bold">{batch.code}</span>
          </p>
        </div>

        {/* Info Pills */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-700">
            <MapPin className="h-4 w-4 text-violet-600 shrink-0" />
            <span className="truncate">{branchName}</span>
          </div>

          <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-violet-600 shrink-0" />
            <span className="truncate">Academic Year {academicYearName}</span>
          </div>

          <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-700">
            <WifiOff className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="truncate uppercase tracking-wider">{deliveryCode} CLASSROOM MODE</span>
          </div>
        </div>

        {/* Warning if deactivated */}
        {isDeactivated && (
          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs font-bold text-rose-800 leading-tight">
              {isCourseDeactivated
                ? 'Course deactivated by admin'
                : 'Batch is currently inactive'}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 mt-2">
          <Link
            href={isDeactivated ? '#' : `/dashboard/student/batches/${batch.id}`}
            className={cn(
              'flex items-center justify-center w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/20 text-center',
              isDeactivated && 'opacity-60 cursor-not-allowed',
            )}
            onClick={(e) => isDeactivated && e.preventDefault()}
          >
            VIEW BATCH DETAILS
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Content ──────────────────────────────────────────────────────────

function StudentBatchesContent() {
  const { batches, isLoading, error, refetch } = useStudentBatches();
  const [searchTerm, setSearchTerm] = useState('');

  const rawList = batches?.batches || [];

  const filteredBatches = useMemo(() => {
    if (!searchTerm.trim()) return rawList;
    const term = searchTerm.toLowerCase();
    return rawList.filter((item) => {
      const nameMatch = item.batch?.name?.toLowerCase().includes(term);
      const codeMatch = item.batch?.code?.toLowerCase().includes(term);
      const courseMatch = item.batch?.course?.name?.toLowerCase().includes(term);
      return nameMatch || codeMatch || courseMatch;
    });
  }, [rawList, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen">
        <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen">
        <ErrorState
          title="Failed to load enrolled batches"
          message={error.message || 'Could not load your batches. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Centered Header (Matches Tutor Batches Style) ────────────────── */}
      <div className="text-center max-w-xl mx-auto space-y-1 my-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          MY ENROLLED BATCHES
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Enrolled batch sections, branch information & academic year details
        </p>
      </div>

      {/* ── Search & Filter Bar ────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batch name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── Batches Grid ───────────────────────────────────────────────────── */}
      {filteredBatches.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No batch enrollments found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? 'No batches match your search query.' : 'Please contact your administrator if your batch is missing.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((enrollment) => (
            <BatchCard key={enrollment.enrollmentId} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function StudentBatchesPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <StudentBatchesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
