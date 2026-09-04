'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAcademicsData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { STALE_TIMES } from '@/lib/staleTimes';
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

import { ChevronRight } from 'lucide-react';

export default function ParentAcademicsPage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const { data, isLoading: isAcademicsLoading } = useQuery<ParentAcademicsData>({
    queryKey: ['parent', 'academics', selectedChildId],
    queryFn: () => parentPortalService.getAcademics(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isAcademicsLoading && !data) || isSwitcherLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrolledCourses = data?.enrolledCourses || [];
  const enrolledBatches = data?.enrolledBatches || [];
  const academicSummary = data?.academicSummary;
  const recentNotifications = data?.recentNotifications || [];

  const studentName = selectedChild?.name || 'Student';
  const courseDisplay = selectedChild?.courseName || enrolledCourses[0]?.name || 'Not Enrolled';
  const batchDisplay = selectedChild?.batchName || enrolledBatches[0]?.name || 'Unassigned';
  const admissionNoDisplay =
    selectedChild?.admissionNumber && selectedChild.admissionNumber !== 'N/A'
      ? selectedChild.admissionNumber
      : 'N/A';

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200">
        <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
          <span>Parent Portal</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>Academic Profile</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-extrabold text-xl shadow-2xs shrink-0">
              {studentName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
                {studentName}&apos;s Academic Performance Overview
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Enrollment profile, class attendance metrics, test marks summary & active course
                programs.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-[#0052CC]" />
            <span>Active Student Profile</span>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-blue-300 transition-all">
          <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Overall Attendance
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">
              {academicSummary?.overallAttendance ? academicSummary.overallAttendance : 'N/A'}
            </p>
          </div>
        </Card>

        {/* Avg Marks */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-emerald-300 transition-all">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Average Marks
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">
              {academicSummary?.completedExams && academicSummary.completedExams > 0
                ? academicSummary.averageMarks
                : 'N/A'}
            </p>
          </div>
        </Card>

        {/* Exams Taken */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-indigo-300 transition-all">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Exams Completed
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">
              {academicSummary?.completedExams ?? 0}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Student Details Summary & Recent Alerts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="h-5 w-5 text-[#0052CC]" />
            <h3 className="font-extrabold text-sm text-[#0B2447] uppercase tracking-wider">
              Student Profile & Enrollment Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Student Name
              </p>
              <p className="font-extrabold text-sm text-[#0B2447]">{studentName}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Admission Number
              </p>
              <p className="font-mono font-extrabold text-sm text-[#0052CC]">
                {admissionNoDisplay}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Course Program
              </p>
              <p className="font-extrabold text-sm text-[#0B2447]">{courseDisplay}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned Batch
              </p>
              <p className="font-extrabold text-sm text-[#0B2447]">{batchDisplay}</p>
            </div>
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="lg:col-span-1 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-[#0052CC]" />
              <h3 className="font-extrabold text-sm text-[#0B2447] uppercase tracking-wider">
                Recent Alerts
              </h3>
            </div>
            <a
              href="/dashboard/parent/notifications"
              className="text-xs font-extrabold text-[#0052CC] hover:underline"
            >
              View All
            </a>
          </div>
          <div className="space-y-3">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1"
                >
                  <h4 className="font-extrabold text-xs text-[#0B2447]">{notif.title}</h4>
                  <p className="text-xs text-slate-600 font-medium line-clamp-2">{notif.content}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 text-slate-400 text-xs font-medium border border-slate-100">
                No recent alerts
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Course & Batches Breakdown Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Enrolled Courses */}
        <Card className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0B2447] uppercase tracking-wider">
                  Enrolled Program & Courses
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Registered NEET curriculum programs
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
              {enrolledCourses.length || 1} Course(s)
            </span>
          </div>

          <div className="space-y-3">
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-sm text-[#0B2447]">{course.name}</h4>
                    {course.code && (
                      <span className="text-xs font-mono text-[#0052CC] font-bold block">
                        Code: {course.code}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active Enrollment
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 text-slate-400 text-xs font-medium border border-slate-100">
                No active course enrollment found
              </div>
            )}
          </div>
        </Card>

        {/* Enrolled Batches */}
        <Card className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0B2447] uppercase tracking-wider">
                  Enrolled Batches
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Classroom & Special batches assigned
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {enrolledBatches.length} Batch(es)
            </span>
          </div>

          <div className="space-y-3">
            {enrolledBatches.length > 0 ? (
              enrolledBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-sm text-[#0B2447]">{batch.name}</h4>
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
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                    Enrolled
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 text-slate-400 text-xs font-medium border border-slate-100">
                No batch assigned yet
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
