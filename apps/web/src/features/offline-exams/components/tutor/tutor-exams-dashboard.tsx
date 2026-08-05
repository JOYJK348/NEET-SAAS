'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTutorAssignedExams } from '../../hooks/use-tutor-exams';
import type { TutorExamItem } from '../../types/tutor-exams';
import { Card } from '@/components/ui/card';
import { useBatches } from '@/features/students/hooks/use-students';
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
  Layers,
} from 'lucide-react';

export function TutorExamsDashboard() {
  const router = useRouter();
  const { data: response, isLoading, refetch } = useTutorAssignedExams();
  const { batches } = useBatches();
  const batchMap = new Map(batches.map((b) => [b.id, b.name]));

  const rawExams: TutorExamItem[] = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.data)
      ? (response as any).data
      : [];

  const groupedMap = new Map<
    string,
    TutorExamItem & { batchNames: string[]; allExamIds: string[] }
  >();

  rawExams.forEach((exam) => {
    const key = `${exam.title.trim().toLowerCase()}-${exam.totalMarks}`;
    const batchName = batchMap.get(exam.batchId) || exam.batchId;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        ...exam,
        batchNames: [batchName].filter(Boolean),
        allExamIds: [exam.id],
      });
    } else {
      const existing = groupedMap.get(key)!;
      if (batchName && !existing.batchNames.includes(batchName)) {
        existing.batchNames.push(batchName);
      }
      if (!existing.allExamIds.includes(exam.id)) {
        existing.allExamIds.push(exam.id);
      }
      existing.pendingEvaluations += exam.pendingEvaluations;
      existing.completedEvaluations += exam.completedEvaluations;
      existing.returnedEvaluations += exam.returnedEvaluations;
    }
  });

  const exams = Array.from(groupedMap.values());

  const totalPending = exams.reduce((acc, e) => acc + e.pendingEvaluations, 0);
  const totalCompleted = exams.reduce((acc, e) => acc + e.completedEvaluations, 0);
  const totalReturned = exams.reduce((acc, e) => acc + e.returnedEvaluations, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Header with Back Button ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <Link
          href="/dashboard/tutor"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-violet-600" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="text-left sm:text-center flex-1 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            MY EXAMS EVALUATION
          </h1>
          <p className="text-xs font-bold text-slate-500">
            Assigned exam answer sheets & student grading workload
          </p>
        </div>

        <div className="hidden sm:block w-36 shrink-0" />
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

        {/* Mobile View: Premium Cards (hidden on md and larger) */}
        <div className="block md:hidden p-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs">
              Loading assigned exams...
            </div>
          ) : (exams || []).length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs">
              No assigned exams found in your workload queue.
            </div>
          ) : (
            (exams || []).map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs"
              >
                {/* Title & Total Marks */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 leading-snug">{exam.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {exam.batchNames.map((bName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200"
                        >
                          <Layers className="w-3 h-3 text-violet-500" />
                          {bName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-xs font-black shrink-0">
                    <Award className="w-3.5 h-3.5 text-violet-600" />
                    {exam.totalMarks} pts
                  </span>
                </div>

                {/* Submissions Status Counters */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                    <p className="text-[9px] font-extrabold text-amber-700 uppercase">Pending</p>
                    <p className="text-sm font-black text-amber-800 mt-0.5">{exam.pendingEvaluations}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                    <p className="text-[9px] font-extrabold text-rose-700 uppercase">Returned</p>
                    <p className="text-sm font-black text-rose-800 mt-0.5">{exam.returnedEvaluations}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <p className="text-[9px] font-extrabold text-emerald-700 uppercase">Done</p>
                    <p className="text-sm font-black text-emerald-800 mt-0.5">{exam.completedEvaluations}</p>
                  </div>
                </div>

                {/* Open Submissions Action Button */}
                <div className="pt-1">
                  <Link
                    href={`/dashboard/tutor/exams/${exam.id}`}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs shadow-violet-600/20 text-center"
                  >
                    <span>Open Submissions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {exam.batchNames.map((bName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200"
                          >
                            <Layers className="w-3 h-3 text-violet-500" />
                            {bName}
                          </span>
                        ))}
                      </div>
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
