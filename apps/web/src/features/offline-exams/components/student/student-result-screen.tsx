'use client';

import { useRouter } from 'next/navigation';
import { useStudentResult } from '../../hooks/use-student-exams';
import {
  ArrowLeft,
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
  const router = useRouter();
  const { data: result, isLoading } = useStudentResult(examId);

  if (isLoading) {
    return <div className="py-24 text-center text-slate-400 font-medium">Loading your result scorecard...</div>;
  }

  if (!result) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <p className="text-slate-500 font-medium">Result not published or not found.</p>
        <button
          onClick={() => router.push('/dashboard/student/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-800 min-h-screen bg-slate-50 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => router.push('/dashboard/student/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Exams Dashboard
        </button>
      </div>

      {/* Scorecard Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold rounded-full uppercase">
              OFFICIAL RESULT SCORECARD
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              {result.examTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {result.isPassed ? (
              <span className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> PASSED
              </span>
            ) : (
              <span className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-sm">
                <XCircle className="w-5 h-5 text-rose-600" /> NEEDS REMEDIATION
              </span>
            )}
          </div>
        </div>

        {/* Big Performance Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 text-center">
            <p className="text-xs text-slate-500 font-semibold">Obtained Score</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {result.obtainedMarks}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {result.totalMarks}</span>
            </p>
          </div>

          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/60 text-center">
            <div className="flex justify-center mb-0.5">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-amber-700 mt-1">
              {result.rank ? `#${result.rank}` : 'N/A'}
            </p>
            <p className="text-[11px] text-amber-800 font-semibold">Batch Rank</p>
          </div>

          <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200/60 text-center">
            <div className="flex justify-center mb-0.5">
              <Percent className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-black text-indigo-700 mt-1">
              {result.percentile !== null && result.percentile !== undefined
                ? `${result.percentile}%`
                : 'N/A'}
            </p>
            <p className="text-[11px] text-indigo-800 font-semibold">Percentile Score</p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 text-center">
            <p className="text-xs text-slate-500 font-semibold">Passing Threshold</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{result.passingMarks}</p>
            <p className="text-[11px] text-slate-500">Minimum to Pass</p>
          </div>
        </div>

        {/* Section Marks Breakdown Table */}
        {result.marksBreakdown && result.marksBreakdown.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" /> Section Marks Breakdown
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-4 text-right">Max Marks</th>
                    <th className="py-3 px-4 text-right">Obtained Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(() => {
                    const secCount = result.marksBreakdown.length || 1;
                    const defaultMax = Math.round(result.totalMarks / secCount);
                    const defaultObtained = Math.round(
                      (result.obtainedMarks || 0) / secCount,
                    );

                    return result.marksBreakdown.map((sec, idx) => {
                      const sectionMax =
                        sec.maxMarks && Number(sec.maxMarks) > 0
                          ? Number(sec.maxMarks)
                          : defaultMax;

                      const sectionObtained =
                        sec.obtainedMarks !== undefined &&
                        sec.obtainedMarks !== null &&
                        !isNaN(Number(sec.obtainedMarks))
                          ? Number(sec.obtainedMarks)
                          : (sec as any).marks !== undefined
                          ? Number((sec as any).marks)
                          : (sec as any).score !== undefined
                          ? Number((sec as any).score)
                          : defaultObtained;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {sec.sectionName || (sec as any).name || `Section ${idx + 1}`}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">{sectionMax}</td>
                          <td className="py-3 px-4 text-right font-bold text-teal-700">
                            {sectionObtained}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tutor Remarks */}
        {result.tutorNotes && (
          <div className="p-4 bg-indigo-50/80 border border-indigo-200/60 rounded-2xl space-y-1.5">
            <p className="text-xs font-bold text-indigo-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> Tutor Evaluation Remarks
            </p>
            <p className="text-xs text-slate-700 italic">"{result.tutorNotes}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
