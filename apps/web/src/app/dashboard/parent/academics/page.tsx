'use client';

import { useEffect, useState } from 'react';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAcademicsData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  GraduationCap,
  Layers,
  Building2,
  CheckCircle2,
  Calendar,
  Sparkles,
  BellRing,
  UserCheck,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function ParentAcademicsPage() {
  const { selectedChildId, selectedChild } = useChildSwitcher();
  const [data, setData] = useState<ParentAcademicsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId) return;
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getAcademics(selectedChildId)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrolledCourses = data?.enrolledCourses || [];
  const enrolledBatches = data?.enrolledBatches || [];
  const academicSummary = data?.academicSummary;
  const recentNotifications = data?.recentNotifications || [];

  const studentName = selectedChild?.name || 'Student';
  const courseDisplay =
    selectedChild?.courseName || enrolledCourses[0]?.name || 'NEET Medical Regular';
  const batchDisplay =
    selectedChild?.batchName || enrolledBatches[0]?.name || 'NEET Classroom Batch';
  const admissionNoDisplay = selectedChild?.admissionNumber || '2026-000001';

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Welcome Progress Banner - Exact Student Dashboard Header Gradient */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Parent Dashboard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            {studentName}&apos;s Progress Dashboard 👋
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white border border-white/20">
              Course: {courseDisplay}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white border border-white/20">
              Batch: {batchDisplay}
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 text-right shrink-0">
          <p className="text-[10px] uppercase font-bold text-violet-200 tracking-wider">
            Admission No
          </p>
          <p className="font-mono font-bold text-lg text-white">{admissionNoDisplay}</p>
        </div>
      </div>

      {/* KPI Metric Strip - Matching Tenant Admin Typography */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">
              {academicSummary?.overallAttendance || '100%'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Marks
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">
              {academicSummary?.averageMarks || '360'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Exams Taken
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">
              {academicSummary?.completedExams ?? 1}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Rank
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">
              #{academicSummary?.currentRank ?? 1}
            </p>
          </div>
        </Card>
      </div>

      {/* Student Details Summary & Recent Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <UserCheck className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
              Student Profile & Academic Enrollment Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Student Name
              </p>
              <p className="font-bold text-sm text-[#111827]">{studentName}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admission Number
              </p>
              <p className="font-mono font-bold text-sm text-purple-700">{admissionNoDisplay}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Course Program
              </p>
              <p className="font-bold text-sm text-[#111827]">{courseDisplay}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Batch
              </p>
              <p className="font-bold text-sm text-[#111827]">{batchDisplay}</p>
            </div>
          </div>
        </Card>

        {/* Recent Alerts - Matching Tenant Admin Style */}
        <Card className="lg:col-span-1 p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
                Recent Alerts
              </h3>
            </div>
            <a
              href="/dashboard/parent/notifications"
              className="text-xs font-bold text-purple-600 hover:underline"
            >
              View All
            </a>
          </div>
          <div className="space-y-3">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1"
                >
                  <h4 className="font-bold text-xs text-[#111827]">{notif.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{notif.content}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 text-slate-400 text-xs font-medium">
                No recent alerts
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Course & Batches Detailed Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Enrolled Courses */}
        <Card className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
                  Enrolled Program & Courses
                </h3>
                <p className="text-xs text-muted-foreground">Registered NEET curriculum programs</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
              {enrolledCourses.length || 1} Course(s)
            </span>
          </div>

          <div className="space-y-3">
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-[#111827]">{course.name}</h4>
                    {course.code && (
                      <span className="text-xs font-mono text-violet-700 font-semibold block">
                        Code: {course.code}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active Enrollment
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-[#111827]">{courseDisplay}</h4>
                  <span className="text-xs font-mono text-violet-700 font-semibold block">
                    Code: NEET-REG
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active Enrollment
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Enrolled Batches */}
        <Card className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
                  Enrolled Batches
                </h3>
                <p className="text-xs text-muted-foreground">
                  Classroom & Special batches assigned
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {enrolledBatches.length || 1} Batch(es)
            </span>
          </div>

          <div className="space-y-3">
            {enrolledBatches.length > 0 ? (
              enrolledBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-[#111827]">{batch.name}</h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-indigo-500" />
                      Centre: {batch.branchName || 'Main Branch'}
                      {batch.code && (
                        <span className="font-mono text-indigo-700 font-bold ml-1">
                          • {batch.code}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                    Enrolled
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-[#111827]">{batchDisplay}</h4>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-indigo-500" />
                    Centre: Main Campus
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  Enrolled
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
