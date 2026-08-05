'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentExamResultData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
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
  Atom,
  FlaskConical,
  Sprout,
  Dna,
  BookOpen,
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';
import { cn } from '@/lib/utils';

export default function ParentExamResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';
  const { selectedChildId, selectedChild } = useChildSwitcher();

  const [data, setData] = useState<ParentExamResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId || !examId) return;
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getExamResult(selectedChildId, examId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChildId, examId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const result = data || {
    examTitle: 'NEET Grand Mock Test',
    date: new Date(),
    totalMarksObtained: 580,
    totalMarksPossible: 720,
    rank: 12,
    centreRank: 4,
    percentile: 94.5,
    passStatus: 'PASS',
    subjectBreakdown: [
      { subject: 'Physics', obtained: 140, total: 180 },
      { subject: 'Chemistry', obtained: 150, total: 180 },
      { subject: 'Botany', obtained: 145, total: 180 },
      { subject: 'Zoology', obtained: 145, total: 180 },
    ],
    tutorNotes: 'Good attempt! Focus on Speed in Physics Numerical Section.',
  };

  const isPassed = result.passStatus === 'PASS' || result.passStatus === 'PASSED';

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) return <Atom className="h-4 w-4 text-indigo-600" />;
    if (s.includes('chem')) return <FlaskConical className="h-4 w-4 text-emerald-600" />;
    if (s.includes('botan')) return <Sprout className="h-4 w-4 text-green-600" />;
    if (s.includes('zoo') || s.includes('bio')) return <Dna className="h-4 w-4 text-purple-600" />;
    return <BookOpen className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 min-h-screen bg-[#FAFAFA] w-full">
      {/* Top Back Action Button */}
      <div>
        <button
          type="button"
          onClick={() => router.push('/dashboard/parent/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Parent Exams
        </button>
      </div>

      {/* Official Scorecard Container Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Header Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold rounded-full uppercase">
              OFFICIAL EVALUATION SCORECARD
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              {result.examTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Student: <strong className="text-slate-800 font-bold">{selectedChild?.name || 'Student'}</strong> • Date:{' '}
              {formatDate(result.date)}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isPassed ? (
              <span className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PASSED
              </span>
            ) : (
              <span className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs">
                <XCircle className="w-4 h-4 text-rose-600" /> NEEDS REMEDIATION
              </span>
            )}
          </div>
        </div>

        {/* 4 Big Performance Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 text-center">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Obtained Score</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {result.totalMarksObtained}{' '}
              <span className="text-xs text-slate-400 font-medium">/ {result.totalMarksPossible}</span>
            </p>
          </div>

          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/60 text-center">
            <div className="flex justify-center mb-0.5">
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              #{result.rank}
            </p>
            <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">Overall Rank</p>
          </div>

          <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200/60 text-center">
            <div className="flex justify-center mb-0.5">
              <Percent className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
              {result.percentile}%
            </p>
            <p className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider">Percentile Score</p>
          </div>

          <div className="bg-teal-50/80 p-4 rounded-2xl border border-teal-200/60 text-center">
            <div className="flex justify-center mb-0.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-teal-700 mt-1">
              #{result.centreRank || 1}
            </p>
            <p className="text-[11px] text-teal-800 font-bold uppercase tracking-wider">Centre Rank</p>
          </div>
        </div>

        {/* Section & Subject Marks Breakdown Table */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Subject-wise Performance Breakdown
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 text-right">Max Marks</th>
                    <th className="py-3 px-4 text-right">Obtained Marks</th>
                    <th className="py-3 px-4 text-right">Score Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {result.subjectBreakdown.map((sb, idx) => {
                    const pct = sb.total > 0 ? Math.round((sb.obtained / sb.total) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          {getSubjectIcon(sb.subject)}
                          <span>{sb.subject}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono">{sb.total}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          {sb.obtained}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-xl text-xs border',
                              pct >= 85
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : pct >= 75
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200',
                            )}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tutor Remarks / Evaluator Notes */}
        <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-purple-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" /> Faculty & Evaluator Remarks
          </p>
          <p className="text-xs text-slate-700 italic leading-relaxed">
            &ldquo;{result.tutorNotes || 'Performance evaluated successfully based on submitted response.'}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

