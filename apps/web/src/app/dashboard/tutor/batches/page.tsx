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

function SemiCircleGauge({
  value,
  max,
  percent,
}: {
  value: number;
  max: number;
  percent: number;
}) {
  const radius = 75;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <svg className="w-56 h-28 overflow-visible" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
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
        <span className="text-3xl font-extrabold text-slate-900 leading-none">{value}</span>
        <span className="text-xs font-bold text-slate-500 mt-1">
          {value} / {max} ({percent}%)
        </span>
      </div>
    </div>
  );
}

// ─── Batch Card Component (Matches User Screenshot) ─────────────────────────

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
  const subjectName = assignment.subject?.name || 'Chemistry';
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

        {/* Top Header Row 2: Subject & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-3 py-1 bg-emerald-100/70 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            {subjectName}
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-extrabold uppercase tracking-wider">
            STATUS: {batch.status || 'PLANNED'}
          </span>
        </div>

        {/* Large Batch Title */}
        <div className="text-center my-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            {batch.name}
          </h3>
          {batch.course && (
            <p className="text-xs font-bold text-slate-500 mt-0.5">{batch.course.name}</p>
          )}
        </div>

        {/* Semi-Circle Progress Gauge */}
        <SemiCircleGauge value={enrolledCount} max={maxStudents} percent={percent} />

        {/* Info Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-700">
            <MapPin className="h-4 w-4 text-violet-600 shrink-0" />
            <span className="truncate">{branchName}</span>
          </div>

          <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-violet-600 shrink-0" />
            <span className="truncate">Review Period {academicYearName}</span>
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
      </div>

      {/* Action Button */}
      <div className="pt-4 mt-2">
        <Link
          href={isDeactivated ? '#' : `/dashboard/tutor/batches/${batch.id}`}
          className={cn(
            'flex items-center justify-center w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/20 text-center',
            isDeactivated && 'opacity-60 cursor-not-allowed',
          )}
          onClick={(e) => isDeactivated && e.preventDefault()}
        >
          VIEW BATCH DETAILS
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
      <div className="space-y-6 p-4 lg:p-8 bg-slate-50/50 min-h-screen">
        <div className="h-24 rounded-3xl bg-slate-200 animate-pulse max-w-xl mx-auto" />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 bg-slate-50/50 min-h-screen">
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Top Centered Header (Matches Screenshot Title) ────────────────── */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          MY BATCHES HUB
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Allocated tutor batches & student capacities
        </p>
      </div>

      {/* ── Search Bar & Filter Toggle ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 max-w-xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-violet-500 shadow-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setSubjectFilter(subjectFilter === 'ALL' ? 'Chemistry' : 'ALL')}
          className="p-2.5 bg-white rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
          title="Filter"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {filteredBatches.length === 0 && (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white p-12 text-center shadow-xs max-w-xl mx-auto mt-6">
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

      {/* ── Batch Cards Grid ─────────────────────────────────────────────────── */}
      {filteredBatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
