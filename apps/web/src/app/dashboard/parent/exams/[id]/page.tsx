'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ChevronRight,
  ShieldCheck,
  User,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';
import { cn } from '@/lib/utils';

import { useQuery } from '@tanstack/react-query';

export default function ParentExamResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';
  const { selectedChildId, selectedChild } = useChildSwitcher();

  const { data, isLoading } = useQuery<ParentExamResultData>({
    queryKey: ['parent', 'examResult', selectedChildId || 'default', examId],
    queryFn: () => parentPortalService.getExamResult(selectedChildId || 'default', examId),
    enabled: !!selectedChildId && !!examId,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading && !data) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
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
  const overallPercentage =
    result.totalMarksPossible > 0
      ? Math.round((result.totalMarksObtained / result.totalMarksPossible) * 100)
      : 0;

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) return <Atom className="h-4 w-4 text-indigo-600 shrink-0" />;
    if (s.includes('chem')) return <FlaskConical className="h-4 w-4 text-emerald-600 shrink-0" />;
    if (s.includes('botan')) return <Sprout className="h-4 w-4 text-green-600 shrink-0" />;
    if (s.includes('zoo') || s.includes('bio')) return <Dna className="h-4 w-4 text-purple-600 shrink-0" />;
    return <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />;
  };

  return (
    <div suppressHydrationWarning className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-20">
      {/* ── Header Banner — ISML LMS Light Blue Style ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <Link href="/dashboard/parent/exams" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" />
              Parent Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <Link href="/dashboard/parent/exams" className="hover:underline">
              Examinations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Scorecard Detail</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span>{result.examTitle}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              OFFICIAL EVALUATION SCORECARD 🎓
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold pt-1">
            <span className="flex items-center gap-1 text-[#0B2447]">
              <User className="w-3.5 h-3.5 text-[#0052CC]" />
              Student: <strong className="font-extrabold">{selectedChild?.name || 'Student'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date: {formatDate(result.date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {isPassed ? (
            <span className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PASSED
            </span>
          ) : (
            <span className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-800 font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs">
              <XCircle className="w-4 h-4 text-rose-600" /> NEEDS REMEDIATION
            </span>
          )}

          <button
            suppressHydrationWarning
            onClick={() => router.push('/dashboard/parent/exams')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
            <span>Back to Exams</span>
          </button>
        </div>
      </div>

      {/* ── 4 Top Performance Metric KPI Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-blue-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Obtained Score
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5 font-mono">
              {result.totalMarksObtained}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {result.totalMarksPossible}</span>
            </p>
            <p className="text-[10px] font-bold text-blue-600 mt-0.5">{overallPercentage}% Overall</p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-amber-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Overall Rank
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5 font-mono">
              #{result.rank}
            </p>
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">Top Merit List</p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Percentile Score
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-0.5 font-mono">
              {result.percentile}%
            </p>
            <p className="text-[10px] font-bold text-indigo-600 mt-0.5">Batch Benchmark</p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-teal-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50 text-teal-600 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Centre Rank
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-teal-700 mt-0.5 font-mono">
              #{result.centreRank || 1}
            </p>
            <p className="text-[10px] font-bold text-teal-600 mt-0.5">Local Campus Rank</p>
          </div>
        </Card>
      </div>

      {/* ── Subject-wise Performance Breakdown Table Card ── */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden space-y-0">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                Subject-wise Performance Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Detailed subject score card and accuracy percentage
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 text-[#0B2447] uppercase font-black text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Subject Name</th>
                <th className="py-3.5 px-5 text-right">Max Marks</th>
                <th className="py-3.5 px-5 text-right">Obtained Marks</th>
                <th className="py-3.5 px-5 text-center">Score Percentage</th>
                <th className="py-3.5 px-5 text-center">Performance Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {result.subjectBreakdown.map((sb, idx) => {
                const pct = sb.total > 0 ? Math.round((sb.obtained / sb.total) * 100) : 0;
                const isHigh = pct >= 80;
                const isMedium = pct >= 65;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-extrabold text-[#0B2447]">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                          {getSubjectIcon(sb.subject)}
                        </div>
                        <span className="text-sm">{sb.subject}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-slate-500">
                      {sb.total}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-[#0B2447] text-sm">
                      {sb.obtained}
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-black">
                      <span className="text-sm text-slate-800">{pct}%</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-black inline-block shadow-2xs whitespace-nowrap',
                          isHigh
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isMedium
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200',
                        )}
                      >
                        {isHigh ? 'High Mastery 🌟' : isMedium ? 'Good Progress 👍' : 'Practice Needed 🎯'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Faculty & Tutor Academic Feedback Remarks Card ── */}
      <Card className="p-5 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-[#0B2447] uppercase tracking-wider">
              Faculty & Evaluator Academic Feedback
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Tutor observations & study recommendations</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-800 leading-relaxed space-y-1.5">
          <p className="font-extrabold text-[#0052CC] text-xs">Faculty Remark:</p>
          <p className="italic text-slate-700 text-sm">&ldquo;{result.tutorNotes || 'Performance evaluated successfully based on submitted answer response.'}&rdquo;</p>
        </div>
      </Card>
    </div>
  );
}
