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
  FileCheck,
  RotateCcw,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';

import { ChevronRight } from 'lucide-react';

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
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <Link href="/dashboard/tutor" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" />
              Faculty Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Exam Evaluations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
            My Exam Evaluations Queue 📝
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Assigned offline exam answer sheets, pending grading queue & completed evaluations
          </p>
        </div>

        <Link
          href="/dashboard/tutor"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs transition shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-amber-300">
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Pending Evaluation
            </p>
            <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{totalPending}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-rose-300">
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Returned by Admin
            </p>
            <p className="text-2xl font-extrabold text-rose-700 mt-0.5">{totalReturned}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-emerald-300">
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Completed Evaluation
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{totalCompleted}</p>
          </div>
        </Card>
      </div>

      {/* ── Assigned Exams Table Layout ── */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                Assigned Exams Queue
              </h3>
              <p className="text-xs text-slate-500 font-medium">
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
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs"
              >
                {/* Title & Total Marks */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-[#0B2447] leading-snug">
                      {exam.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {exam.batchNames.map((bName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                        >
                          <Layers className="w-3 h-3 text-[#0052CC]" />
                          {bName}
                        </span>
                      ))}
                      {exam.answerKeySignedUrl && (
                        <a
                          href={exam.answerKeySignedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <FileCheck className="w-3 h-3 text-emerald-600" />
                          Answer Key
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-slate-50 text-[#0B2447] border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0">
                    <Award className="w-3.5 h-3.5 text-[#0052CC]" />
                    {exam.totalMarks} pts
                  </span>
                </div>

                {/* Submissions Status Counters */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-[9px] font-extrabold text-amber-700 uppercase">Pending</p>
                    <p className="text-sm font-black text-amber-800 mt-0.5">
                      {exam.pendingEvaluations}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-[9px] font-extrabold text-rose-700 uppercase">Returned</p>
                    <p className="text-sm font-black text-rose-800 mt-0.5">
                      {exam.returnedEvaluations}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[9px] font-extrabold text-emerald-700 uppercase">Done</p>
                    <p className="text-sm font-black text-emerald-800 mt-0.5">
                      {exam.completedEvaluations}
                    </p>
                  </div>
                </div>

                {/* Open Submissions Action Button */}
                <div className="pt-1 flex items-center gap-2">
                  <Link
                    href={`/dashboard/tutor/exams/${exam.id}`}
                    className="flex-1 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs text-center cursor-pointer"
                  >
                    <span>Open Submissions</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                  {exam.answerKeySignedUrl && (
                    <a
                      href={exam.answerKeySignedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer shrink-0"
                      title="View Answer Key PDF"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Key</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[#0B2447] uppercase font-extrabold text-[10px] border-b border-slate-200 tracking-wider">
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
                      <div className="font-extrabold text-[#0B2447] text-sm">{exam.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {exam.batchNames.map((bName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                          >
                            <Layers className="w-3 h-3 text-[#0052CC]" />
                            {bName}
                          </span>
                        ))}
                        {exam.answerKeySignedUrl && (
                          <a
                            href={exam.answerKeySignedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            Answer Key
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 font-extrabold text-slate-800">
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-[#0B2447] px-2.5 py-0.5 rounded-md text-xs font-extrabold">
                        <Award className="w-3.5 h-3.5 text-[#0052CC]" />
                        {exam.totalMarks} pts
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      {exam.pendingEvaluations > 0 ? (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold rounded-lg shadow-2xs">
                          {exam.pendingEvaluations} Pending
                        </span>
                      ) : (
                        <span className="text-slate-400 font-extrabold">0</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {exam.returnedEvaluations > 0 ? (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold rounded-lg shadow-2xs">
                          {exam.returnedEvaluations} Returned
                        </span>
                      ) : (
                        <span className="text-slate-400 font-extrabold">0</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-emerald-700 font-extrabold text-xs">
                      {exam.completedEvaluations}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {exam.answerKeySignedUrl && (
                          <a
                            href={exam.answerKeySignedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Key</span>
                          </a>
                        )}
                        <Link
                          href={`/dashboard/tutor/exams/${exam.id}`}
                          className="px-3.5 py-1.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <span>Open Submissions</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </Link>
                      </div>
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
