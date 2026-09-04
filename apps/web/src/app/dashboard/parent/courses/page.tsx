'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAcademicsData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { STALE_TIMES } from '@/lib/staleTimes';
import { GraduationCap, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';

import { ChevronRight } from 'lucide-react';

export default function ParentCoursesPage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const { data, isLoading: isCoursesLoading } = useQuery<ParentAcademicsData>({
    queryKey: ['parent', 'academics', selectedChildId],
    queryFn: () => parentPortalService.getAcademics(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isCoursesLoading && !data) || isSwitcherLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrolledCourses = data?.enrolledCourses || [];
  const studentName = selectedChild?.name || 'Student';

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200">
        <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
          <span>Parent Portal</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>Enrolled Courses</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-extrabold text-xl shadow-2xs shrink-0">
              {studentName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
                {studentName}&apos;s Enrolled Curriculum & Courses
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Active registered NEET academic courses, program codes & subject details
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-[#0052CC]" />
            <span>Active Curriculum</span>
          </div>
        </div>
      </div>

      {/* ── Courses List Grid ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#0052CC]" />
          Enrolled Programs ({enrolledCourses.length})
        </h3>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolledCourses.map((course) => (
              <Card
                key={course.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-base text-[#0B2447] truncate">
                        {course.name}
                      </h4>
                      {course.code && (
                        <p className="text-xs font-mono font-bold text-[#0052CC] mt-0.5">
                          Course Code: {course.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Enrolled
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600 font-medium">
                  <p className="font-extrabold text-[#0B2447]">Curriculum Details:</p>
                  <p>
                    Comprehensive NEET preparatory program covering Physics, Chemistry, Botany, and
                    Zoology with regular mock evaluations.
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-xs font-medium text-slate-400 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            No enrolled course records found.
          </Card>
        )}
      </div>
    </div>
  );
}
