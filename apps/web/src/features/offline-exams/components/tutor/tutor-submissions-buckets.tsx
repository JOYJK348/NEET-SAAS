'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTutorSubmissionsBuckets } from '../../hooks/use-tutor-exams';
import type { TutorSubmissionListItem } from '../../types/tutor-exams';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
  Search,
  Sparkles,
  UserX,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface TutorSubmissionsBucketsProps {
  examId: string;
}

export function TutorSubmissionsBucketsView({ examId }: TutorSubmissionsBucketsProps) {
  const router = useRouter();
  const { data: buckets, isLoading } = useTutorSubmissionsBuckets(examId);

  const [activeTab, setActiveTab] = useState<
    'PENDING' | 'OVERDUE' | 'RETURNED' | 'COMPLETED' | 'ABSENT'
  >('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!buckets) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto py-24">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <p className="text-slate-600 font-bold text-sm">Exam workload data not found.</p>
        <button
          onClick={() => router.push('/dashboard/tutor/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tutor Exams
        </button>
      </div>
    );
  }

  let listToDisplay: TutorSubmissionListItem[] = [];
  if (activeTab === 'PENDING') listToDisplay = buckets.todaysPending || [];
  if (activeTab === 'OVERDUE') listToDisplay = buckets.overdue || [];
  if (activeTab === 'RETURNED') listToDisplay = buckets.returned || [];
  if (activeTab === 'COMPLETED') listToDisplay = buckets.completed || [];
  if (activeTab === 'ABSENT') listToDisplay = buckets.absent || [];

  const filteredList = listToDisplay.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentAdmissionId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Header with Back Button ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <Link
          href="/dashboard/tutor/exams"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-violet-600" />
          <span>Back to Exams</span>
        </Link>

        <div className="text-left sm:text-center flex-1 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {buckets.title}
          </h1>
          <p className="text-xs font-bold text-slate-500">
            Student submissions workload & OMR marking queue ({buckets.totalCount} Total Papers)
          </p>
        </div>

        <div className="hidden sm:block w-32 shrink-0" />
      </div>

      {/* ── Search & Bucket Category Filter Bar (Modern 2-Row / Mobile Native) ──── */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Top Row: Search Input & Quick Status Pill Indicator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student name or admission ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 font-semibold px-1">
            <span className="text-[11px] text-slate-400">Viewing Filter:</span>
            <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 font-extrabold border border-violet-100 text-[11px]">
              {activeTab === 'PENDING' && `Today's Pending (${buckets.todaysPending?.length || 0})`}
              {activeTab === 'OVERDUE' && `Overdue (${buckets.overdue?.length || 0})`}
              {activeTab === 'RETURNED' && `Returned (${buckets.returned?.length || 0})`}
              {activeTab === 'COMPLETED' && `Completed (${buckets.completed?.length || 0})`}
              {activeTab === 'ABSENT' && `Absent (${buckets.absent?.length || 0})`}
            </span>
          </div>
        </div>

        {/* Bottom Row: Category Filter Tabs (Responsive Flex-Wrap / No Horizontal Scrollbar) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/70 rounded-xl border border-slate-200/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({buckets.todaysPending?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue ({buckets.overdue?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RETURNED')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'RETURNED'
                ? 'bg-violet-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returned ({buckets.returned?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({buckets.completed?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ABSENT')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ABSENT'
                ? 'bg-slate-700 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Absent ({buckets.absent?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* ── Submissions View Layout (Mobile Cards + Desktop Table) ────────────────── */}
      {filteredList.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-slate-400 font-semibold text-xs">
            No student submissions found in this category.
          </p>
        </Card>
      ) : (
        <>
          {/* Mobile-First View: Premium Cards List (block sm:hidden - Matching Courses & Batches) */}
          <div className="block sm:hidden space-y-3">
            {filteredList.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs"
              >
                {/* Header: Student Name & Avatar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-black text-xs shrink-0">
                      {sub.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm leading-snug truncate">
                        {sub.studentName}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">
                        ADM ID: {sub.studentAdmissionId}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {sub.evaluationStatus === 'RE_EVALUATION' ? (
                      <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black rounded-xl">
                        RETURNED
                      </span>
                    ) : sub.evaluationStatus === 'COMPLETED' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-xl">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black rounded-xl">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details: Date & Time */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Submitted At:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-violet-500" />
                    <span>
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Full Width Action Button (Courses / Batches Match) */}
                <div className="pt-0.5">
                  <Link
                    href={`/dashboard/tutor/exams/${examId}/evaluate/${sub.id}`}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs shadow-violet-600/20 text-center"
                  >
                    <span>Evaluate Paper</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Rich Table Layout (hidden sm:block) */}
          <div className="hidden sm:block">
            <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase font-extrabold text-[10px] border-b border-slate-100 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Student Information</th>
                      <th className="py-3.5 px-5">Submitted Date & Time</th>
                      <th className="py-3.5 px-5">Evaluation Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredList.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-extrabold text-slate-900 text-sm">{sub.studentName}</p>
                          <p className="text-[11px] text-slate-400 font-mono font-semibold">
                            ID: {sub.studentAdmissionId}
                          </p>
                        </td>

                        <td className="py-4 px-5 text-slate-600 font-medium">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                        </td>

                        <td className="py-4 px-5">
                          {sub.evaluationStatus === 'RE_EVALUATION' ? (
                            <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold rounded-xl shadow-2xs">
                              RETURNED BY ADMIN
                            </span>
                          ) : sub.evaluationStatus === 'COMPLETED' ? (
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold rounded-xl shadow-2xs">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold rounded-xl shadow-2xs">
                              PENDING EVALUATION
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <Link
                            href={`/dashboard/tutor/exams/${examId}/evaluate/${sub.id}`}
                            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs shadow-violet-600/20"
                          >
                            <span>Evaluate Paper</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
