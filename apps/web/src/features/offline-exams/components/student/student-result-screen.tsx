'use client';

import { useStudentResult } from '../../hooks/use-student-exams';
import {
  Award,
  BarChart3,
  CheckCircle2,
  FileText,
  MessageSquare,
  Percent,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface StudentResultScreenProps {
  examId: string;
}

export function StudentResultScreen({ examId }: StudentResultScreenProps) {
  const { data: result, isLoading } = useStudentResult(examId);

  if (isLoading) {
    return <div className="py-24 text-center text-slate-400">Loading your result scorecard...</div>;
  }

  if (!result) {
    return (
      <div className="py-24 text-center text-slate-400">Result not published or not found.</div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950 max-w-4xl mx-auto">
      {/* Scorecard Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-full uppercase">
              OFFICIAL RESULT SCORECARD
            </span>
            <h1 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              {result.examTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {result.isPassed ? (
              <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> PASSED
              </span>
            ) : (
              <span className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow">
                <XCircle className="w-5 h-5 text-rose-400" /> NEEDS REMEDIATION
              </span>
            )}
          </div>
        </div>

        {/* Big Performance Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-semibold">Obtained Score</p>
            <p className="text-3xl font-black text-white mt-1">
              {result.obtainedMarks}{' '}
              <span className="text-xs text-slate-500 font-normal">/ {result.totalMarks}</span>
            </p>
          </div>

          <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-800/40 text-center">
            <div className="flex justify-center mb-0.5">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-400 mt-1">
              {result.rank ? `#${result.rank}` : 'N/A'}
            </p>
            <p className="text-[11px] text-amber-300">Batch Rank</p>
          </div>

          <div className="bg-indigo-950/20 p-4 rounded-2xl border border-indigo-800/40 text-center">
            <div className="flex justify-center mb-0.5">
              <Percent className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-3xl font-black text-indigo-400 mt-1">
              {result.percentile !== null && result.percentile !== undefined
                ? `${result.percentile}%`
                : 'N/A'}
            </p>
            <p className="text-[11px] text-indigo-300">Percentile Score</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-semibold">Passing Threshold</p>
            <p className="text-3xl font-black text-slate-200 mt-1">{result.passingMarks}</p>
            <p className="text-[11px] text-slate-500">Minimum to Pass</p>
          </div>
        </div>

        {/* Section Marks Breakdown Table */}
        {result.marksBreakdown && result.marksBreakdown.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" /> Section Marks Breakdown
            </h3>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-4 text-right">Max Marks</th>
                    <th className="py-3 px-4 text-right">Obtained Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {result.marksBreakdown.map((sec, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {sec.sectionName || `Section ${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">{sec.maxMarks || 0}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-400">
                        {sec.obtainedMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tutor Remarks */}
        {result.tutorNotes && (
          <div className="p-4 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl space-y-1.5">
            <p className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Tutor Evaluation Remarks
            </p>
            <p className="text-xs text-slate-300 italic">"{result.tutorNotes}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
