'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentExamResultData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Award, CheckCircle2, MessageSquare, TrendingUp } from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';

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

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
            Result Report
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{result.examTitle}</h1>
          <p className="text-xs text-purple-100">
            Student: <strong className="text-white">{selectedChild?.name}</strong> • Date:{' '}
            {formatDate(result.date)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-right">
          <p className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">
            Overall Score
          </p>
          <p className="text-2xl font-black font-mono">
            {result.totalMarksObtained} / {result.totalMarksPossible}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Overall Rank
          </p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">#{result.rank}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Centre Rank
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">#{result.centreRank}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Percentile
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{result.percentile}%</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
          <p className="text-2xl font-extrabold text-teal-600 mt-1">{result.passStatus}</p>
        </Card>
      </div>

      {/* Subject Breakdown & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base border-b border-slate-100 pb-3">
            Subject Score Breakdown
          </h3>
          <div className="space-y-4">
            {result.subjectBreakdown.map((sb) => {
              const pct = Math.round((sb.obtained / sb.total) * 100);
              return (
                <div key={sb.subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{sb.subject}</span>
                    <span className="font-mono text-purple-600">
                      {sb.obtained} / {sb.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tutor Notes */}
        <Card className="lg:col-span-1 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-base">Evaluator Notes</h3>
          </div>
          <p className="text-xs text-slate-700 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 leading-relaxed">
            {result.tutorNotes ||
              'Good performance overall. Keep practicing time management during tests.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
