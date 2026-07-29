'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTutorAssignedExams } from '../../hooks/use-tutor-exams';
import type { TutorExamItem } from '../../types/tutor-exams';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function TutorExamsDashboard() {
  const router = useRouter();
  const { data: response, isLoading } = useTutorAssignedExams();

  const exams: TutorExamItem[] = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.data)
      ? (response as any).data
      : [];

  const totalPending = exams.reduce((acc, e) => acc + e.pendingEvaluations, 0);
  const totalCompleted = exams.reduce((acc, e) => acc + e.completedEvaluations, 0);
  const totalReturned = exams.reduce((acc, e) => acc + e.returnedEvaluations, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-800 min-h-screen bg-slate-50 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => router.push('/dashboard/tutor')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Tutor Dashboard
        </button>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Tutor Evaluation Workload Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Evaluate Assigned OMR Answer Sheets, Enter Section Marks, and Submit for Admin Approval
          </p>
        </div>
      </div>

      {/* Workload Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-800 font-semibold">Pending Evaluation</p>
            <p className="text-3xl font-black text-amber-700 mt-1">{totalPending}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-600/30" />
        </div>

        <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-800 font-semibold">Returned by Admin</p>
            <p className="text-3xl font-black text-rose-700 mt-1">{totalReturned}</p>
          </div>
          <RotateCcw className="w-8 h-8 text-rose-600/30" />
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-800 font-semibold">Completed Evaluation</p>
            <p className="text-3xl font-black text-emerald-700 mt-1">{totalCompleted}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600/30" />
        </div>
      </div>

      {/* Assigned Exams Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Assigned Exams Queue
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Select an exam to view pending submissions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Exam Title</th>
                <th className="py-3.5 px-4">Total Marks</th>
                <th className="py-3.5 px-4">Pending</th>
                <th className="py-3.5 px-4">Returned</th>
                <th className="py-3.5 px-4">Completed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading assigned exams...
                  </td>
                </tr>
              ) : (exams || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No assigned exams found.
                  </td>
                </tr>
              ) : (
                (exams || []).map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 font-bold text-slate-900 text-sm">{exam.title}</td>

                    <td className="py-4 px-4 font-bold text-slate-800">{exam.totalMarks} pts</td>

                    <td className="py-4 px-4">
                      {exam.pendingEvaluations > 0 ? (
                        <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
                          {exam.pendingEvaluations} Pending
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {exam.returnedEvaluations > 0 ? (
                        <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                          {exam.returnedEvaluations} Returned
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-emerald-700 font-bold">
                      {exam.completedEvaluations}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/dashboard/tutor/exams/${exam.id}`}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Open Submissions <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
