'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Save,
  Loader2,
  X,
  AlertCircle,
  Clock,
  Award,
  Layers,
  FileText,
} from 'lucide-react';
import { useCourse } from '@/features/master-data/hooks/use-courses';
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
import {
  useCourseSubjects,
  useAssignSubject,
} from '@/features/master-data/hooks/use-course-subjects';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FormErrors {
  subjectId?: string;
  plannedHours?: string;
  totalMarks?: string;
  passingMarks?: string;
}

function MapCourseSubjectContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: subjectsRes, isLoading: subjectsLoading } = useSubjects({ limit: 100 });
  const { data: mappedSubjects = [] } = useCourseSubjects(courseId);
  const assignMutation = useAssignSubject(courseId);

  const subjects = subjectsRes?.data || [];

  // Filter out subjects already mapped
  const availableSubjects = subjects.filter(
    (s) => !mappedSubjects.some((ms) => ms.subjectId === s.id),
  );

  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    subjectId: '',
    plannedHours: 100,
    displayOrder: mappedSubjects.length + 1,
    isMandatory: true,
    totalMarks: 100,
    passingMarks: 40,
    credits: 0,
  });

  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.subjectId) {
      errs.subjectId = 'Please select a core subject to map';
    }

    if (!formData.plannedHours || formData.plannedHours <= 0) {
      errs.plannedHours = 'Planned hours must be greater than 0';
    }

    if (formData.totalMarks <= 0) {
      errs.totalMarks = 'Total marks must be greater than 0';
    }

    if (formData.passingMarks > formData.totalMarks) {
      errs.passingMarks = 'Passing marks cannot exceed total marks';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        courseId,
        subjectId: formData.subjectId,
        displayOrder: Number(formData.displayOrder),
        isMandatory: formData.isMandatory,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        credits: Number(formData.credits),
        plannedHours: Number(formData.plannedHours),
      });

      toast.success('Subject mapped to course syllabus successfully!');
      router.push(`/tenant-admin/courses/${courseId}?tab=curriculum`);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to map subject';
      toast.error(errorMsg);
    }
  };

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Loading course program...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Top Back Action Bar */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push(`/tenant-admin/courses/${courseId}?tab=curriculum`)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="hidden sm:inline">Back to Course Curriculum</span>
            <span className="sm:hidden">Back</span>
          </button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/tenant-admin/courses/${courseId}?tab=curriculum`)}
            className="rounded-xl text-xs font-bold text-slate-600 shrink-0 px-3 sm:px-4 py-2"
          >
            <X className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            Cancel
          </Button>
        </div>

        {/* Dedicated Screen Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                    Course Syllabus Architecture
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Map Subject to {course?.name || 'Syllabus'} 📚
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Associate a master core subject (Physics, Chemistry, Biology) to this course
                  program.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Subject Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" /> Syllabus Mapping Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure planned hours, examination marks, and mandatory status.
              </p>
            </div>

            <Button
              type="submit"
              disabled={assignMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-sm shrink-0 px-4 py-2"
            >
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Map Subject
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Master Subject *
              </label>
              {subjectsLoading ? (
                <p className="text-xs text-slate-400 animate-pulse">Loading core subjects...</p>
              ) : availableSubjects.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  All master subjects have already been mapped to this course syllabus!
                </div>
              ) : (
                <select
                  value={formData.subjectId}
                  onChange={(e) => {
                    setFormData({ ...formData, subjectId: e.target.value });
                    if (errors.subjectId) setErrors((prev) => ({ ...prev, subjectId: undefined }));
                  }}
                  className={cn(
                    'w-full h-11 px-3 rounded-xl border text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500',
                    errors.subjectId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200',
                  )}
                >
                  <option value="">
                    Choose a master subject (e.g. Physics, Chemistry, Biology)...
                  </option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.subjectType}
                    </option>
                  ))}
                </select>
              )}
              {errors.subjectId && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.subjectId}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-violet-600" /> Planned Teaching Hours *
              </label>
              <Input
                type="number"
                min={1}
                value={formData.plannedHours}
                onChange={(e) =>
                  setFormData({ ...formData, plannedHours: parseInt(e.target.value, 10) || 100 })
                }
                placeholder="e.g. 120"
                className="rounded-xl border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Display Order Position
              </label>
              <Input
                type="number"
                min={1}
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })
                }
                className="rounded-xl border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-violet-600" /> Total Marks *
              </label>
              <Input
                type="number"
                min={1}
                value={formData.totalMarks}
                onChange={(e) =>
                  setFormData({ ...formData, totalMarks: parseInt(e.target.value, 10) || 100 })
                }
                className="rounded-xl border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-violet-600" /> Minimum Passing Marks *
              </label>
              <Input
                type="number"
                min={1}
                value={formData.passingMarks}
                onChange={(e) =>
                  setFormData({ ...formData, passingMarks: parseInt(e.target.value, 10) || 40 })
                }
                className={cn(
                  'rounded-xl text-xs font-bold',
                  errors.passingMarks ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200',
                )}
              />
              {errors.passingMarks && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.passingMarks}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Syllabus Requirement Type
              </label>
              <select
                value={formData.isMandatory ? 'MANDATORY' : 'OPTIONAL'}
                onChange={(e) =>
                  setFormData({ ...formData, isMandatory: e.target.value === 'MANDATORY' })
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="MANDATORY">Mandatory Core Subject</option>
                <option value="OPTIONAL">Optional Elective Subject</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/tenant-admin/courses/${courseId}?tab=curriculum`)}
              className="rounded-xl text-xs font-bold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignMutation.isPending || availableSubjects.length === 0}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
            >
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Map Subject
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function MapCourseSubjectPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <MapCourseSubjectContent />
    </ProtectedRoute>
  );
}
