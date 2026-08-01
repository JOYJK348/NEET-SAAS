'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTutorAssignedExams } from '../../hooks/use-tutor-exams';
import type { TutorExamItem } from '../../types/tutor-exams';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';

export function TutorExamsDashboard() {
  const router = useRouter();
  const { data: response, isLoading, refetch } = useTutorAssignedExams();

  const exams: TutorExamItem[] = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.data)
      ? (response as any).data
      : [];

  const totalPending = exams.reduce((acc, e) => acc + e.pendingEvaluations, 0);
  const totalCompleted = exams.reduce((acc, e) => acc + e.completedEvaluations, 0);
  const totalReturned = exams.reduce((acc, e) => acc + e.returnedEvaluations, 0);

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Signature Violet Gradient Hero Banner (Tenant Admin Theme) ──────── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/tutor')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all shadow-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4 text-violet-200" />
            <span>← Back to Tutor Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Evaluation & Marking Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            Tutor Evaluation Workload 📝
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Evaluate assigned OMR answer sheets, record section marks, and submit for admin
            verification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards (Tenant Admin Theme Match) ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-amber-300">
          <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Pending Evaluation
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">{totalPending}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-rose-300">
          <div className="p-2.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 shrink-0">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Returned by Admin
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">{totalReturned}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Completed Evaluation
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {totalCompleted}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Assigned Exams Table Layout (Tenant Admin Match) ────────────────── */}
      <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Assigned Exams Queue</h3>
              <p className="text-xs text-slate-400">
                Select an exam to view and grade student submissions
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-extrabold text-[10px] border-b border-slate-100 tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Exam Title</th>
                <th className="py-3.5 px-5">Total Marks</th>
                <th className="py-3.5 px-5">Pending</th>
                <th className="py-3.5 px-5">Returned</th>
                <th className="py-3.5 px-5">Completed</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Loading assigned exams...
                  </td>
                </tr>
              ) : (exams || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    No assigned exams found in your workload queue.
                  </td>
                </tr>
              ) : (
                (exams || []).map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900 text-sm">{exam.title}</div>
                    </td>

                    <td className="py-4 px-5 font-extrabold text-slate-800">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-xs">
                        <Award className="w-3.5 h-3.5 text-violet-600" />
                        {exam.totalMarks} pts
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      {exam.pendingEvaluations > 0 ? (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl shadow-2xs">
                          {exam.pendingEvaluations} Pending
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">0</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {exam.returnedEvaluations > 0 ? (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl shadow-2xs">
                          {exam.returnedEvaluations} Returned
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">0</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-emerald-700 font-extrabold text-xs">
                      {exam.completedEvaluations}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/dashboard/tutor/exams/${exam.id}`}
                        className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs shadow-violet-600/20"
                      >
                        <span>Open Submissions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
