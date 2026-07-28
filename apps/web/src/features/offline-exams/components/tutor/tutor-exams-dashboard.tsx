'use client';

import Link from 'next/link';
import { useTutorAssignedExams } from '../../hooks/use-tutor-exams';
import {
  AlertCircle,
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
  const { data: exams, isLoading } = useTutorAssignedExams();

  const totalPending = (exams || []).reduce((acc, e) => acc + e.pendingEvaluations, 0);
  const totalCompleted = (exams || []).reduce((acc, e) => acc + e.completedEvaluations, 0);
  const totalReturned = (exams || []).reduce((acc, e) => acc + e.returnedEvaluations, 0);

  return (
    <div className="p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Tutor Evaluation Workload Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate Assigned OMR Answer Sheets, Enter Section Marks, and Submit for Admin Approval
          </p>
        </div>
      </div>

      {/* Workload Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Pending Evaluation</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{totalPending}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-400/20" />
        </div>

        <div className="bg-rose-950/20 p-4 rounded-2xl border border-rose-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-300 font-semibold">Returned by Admin</p>
            <p className="text-3xl font-black text-rose-400 mt-1">{totalReturned}</p>
          </div>
          <RotateCcw className="w-8 h-8 text-rose-400/30" />
        </div>

        <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300 font-semibold">Completed Evaluation</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{totalCompleted}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/30" />
        </div>
      </div>

      {/* Assigned Exams Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Assigned Exams Queue
          </h3>
          <span className="text-xs text-slate-400">Select an exam to view pending submissions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Exam Title</th>
                <th className="py-3.5 px-4">Total Marks</th>
                <th className="py-3.5 px-4">Pending</th>
                <th className="py-3.5 px-4">Returned</th>
                <th className="py-3.5 px-4">Completed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading assigned exams...
                  </td>
                </tr>
              ) : (exams || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No assigned exams found.
                  </td>
                </tr>
              ) : (
                (exams || []).map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-slate-100 text-sm">{exam.title}</td>

                    <td className="py-4 px-4 font-bold text-slate-200">{exam.totalMarks} pts</td>

                    <td className="py-4 px-4">
                      {exam.pendingEvaluations > 0 ? (
                        <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full">
                          {exam.pendingEvaluations} Pending
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {exam.returnedEvaluations > 0 ? (
                        <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-full">
                          {exam.returnedEvaluations} Returned
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-emerald-400 font-bold">
                      {exam.completedEvaluations}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/dashboard/tutor/exams/${exam.id}`}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
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
