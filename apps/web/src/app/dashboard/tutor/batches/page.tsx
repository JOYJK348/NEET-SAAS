'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorBatches } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { StatsSkeleton } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import {
  Layers,
  BookOpen,
  MapPin,
  Calendar,
  WifiOff,
  Search,
  Bell,
  FlaskConical,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import type { BatchAssignmentDto } from '@/features/tutor-dashboard/types/batches';

// ─── Semi-Circle Arc Progress Gauge ────────────────────────────────────────

import { ChevronRight } from 'lucide-react';

function SemiCircleGauge({ value, max, percent }: { value: number; max: number; percent: number }) {
  const radius = 75;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <svg className="w-56 h-28 overflow-visible" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0052CC" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* Background Arc */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Numbers */}
      <div className="absolute bottom-1 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-[#0B2447] leading-none">{value}</span>
        <span className="text-xs font-bold text-slate-500 mt-1">
          {value} / {max} ({percent}%)
        </span>
      </div>
    </div>
  );
}

// ─── Batch Card Component ─────────────────────────────────────────

function BatchCard({ assignment }: { assignment: BatchAssignmentDto }) {
  const batch = assignment.batch;
  if (!batch) return null;

  const isCourseDeactivated = batch.course && batch.course.isActive === false;
  const isBatchInactive = batch.isActive === false || batch.status === 'INACTIVE';
  const isDeactivated = isCourseDeactivated || isBatchInactive;

  const enrolledCount = batch.studentCount || 0;
  const maxStudents = batch.maxStudents || 40;
  const percent = Math.min(100, Math.round((enrolledCount / maxStudents) * 100));

  const branchName = batch.branch?.name || 'Head Office Sivakasi';
  const academicYearName = batch.academicYear?.name || '2026-2027';
  const subjectName = assignment.subject?.name || 'Physics';
  const deliveryCode = batch.deliveryType?.code || 'OFFLINE';

  return (
    <Card
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 font-sans',
        isDeactivated && 'opacity-75 saturate-50 border-rose-200 bg-rose-50/10',
      )}
    >
      <div className="space-y-3.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 bg-blue-50 text-[#0052CC] border border-blue-200 rounded-lg text-xs font-extrabold flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5 text-[#0052CC]" />
              {subjectName}
            </span>
            <span className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-extrabold flex items-center gap-1">
              <Bell className="h-3 w-3 text-[#0052CC]" />
              {batch.code}
            </span>
          </div>

          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
            {batch.status || 'PLANNED'}
          </span>
        </div>

        {/* Batch & Course Title */}
        <div className="space-y-0.5">
          <h3 className="text-lg font-extrabold text-[#0B2447] tracking-tight leading-snug">
            {batch.name}
          </h3>
          {batch.course && (
            <p className="text-xs font-medium text-slate-500">{batch.course.name}</p>
          )}
        </div>

        {/* Capacity Progress Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#0B2447] flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#0052CC]" />
              Student Capacity
            </span>
            <span className="font-extrabold text-[#0052CC] font-mono">
              {enrolledCount} / {maxStudents} ({percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#0052CC] to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-2 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/60 rounded-xl border border-slate-100">
            <MapPin className="h-3.5 w-3.5 text-[#0052CC] shrink-0" />
            <span className="truncate">{branchName}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/60 rounded-xl border border-slate-100">
            <Calendar className="h-3.5 w-3.5 text-[#0052CC] shrink-0" />
            <span className="truncate">Review Period: {academicYearName}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/60 rounded-xl border border-slate-100">
            <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="truncate font-extrabold text-slate-700 uppercase tracking-wider">
              {deliveryCode} CLASSROOM MODE
            </span>
          </div>
        </div>

        {/* Warning if deactivated */}
        {isDeactivated && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs font-bold text-rose-800 leading-tight">
              {isCourseDeactivated ? 'Course deactivated by admin' : 'Batch is currently inactive'}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Link
          href={isDeactivated ? '#' : `/dashboard/tutor/batches/${batch.id}`}
          className={cn(
            'flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs tracking-wider transition-all shadow-2xs text-center cursor-pointer',
            isDeactivated && 'opacity-60 cursor-not-allowed',
          )}
          onClick={(e) => isDeactivated && e.preventDefault()}
        >
          <span>VIEW BATCH DETAILS</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </Link>
      </div>
    </Card>
  );
}

// ─── Main Content ──────────────────────────────────────────────────────────

function MyBatchesContent() {
  const { user } = useAuth();
  const { batches, isLoading, error, refetch } = useTutorBatches();

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  const batchList = useMemo(() => batches?.batches ?? [], [batches]);

  const filteredBatches = useMemo(() => {
    return batchList.filter((assignment) => {
      const b = assignment.batch;
      if (!b) return false;

      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.course?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = subjectFilter === 'ALL' || assignment.subject?.name === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [batchList, searchTerm, subjectFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen">
        <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen">
        <ErrorState
          title="Failed to load batches"
          message={error.message || 'Could not load your assigned batches. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Faculty Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Assigned Batches Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
            My Assigned Batches Hub 🏫
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Allocated tutor classroom batches, active enrollment counts & student capacities
          </p>
        </div>

        {/* Search Bar & Filter Toggle */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#0052CC] shadow-2xs"
            />
          </div>
          <button
            type="button"
            onClick={() => setSubjectFilter(subjectFilter === 'ALL' ? 'Chemistry' : 'ALL')}
            className="p-2.5 bg-white rounded-xl border border-slate-200 text-[#0052CC] hover:bg-blue-50 shadow-2xs transition-colors cursor-pointer"
            title="Filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {filteredBatches.length === 0 && (
        <Card className="rounded-2xl border-dashed border-2 border-slate-200 bg-white p-12 text-center shadow-2xs w-full">
          <EmptyState
            icon={<Layers className="h-10 w-10 text-slate-300" />}
            title="No matching batches found"
            description={
              batchList.length === 0
                ? "You haven't been assigned to any batches yet. Contact your administrator."
                : 'Try adjusting your search query.'
            }
          />
        </Card>
      )}

      {/* ── Batch Cards Grid ── */}
      {filteredBatches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredBatches.map((assignment) => (
            <BatchCard key={assignment.assignmentId} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function MyBatchesPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <MyBatchesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
