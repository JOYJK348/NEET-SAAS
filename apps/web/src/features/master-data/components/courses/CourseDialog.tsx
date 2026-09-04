'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBranches } from '../../hooks/use-branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { courseSchema } from '../../validation/schemas';
import type { Course, CreateCourseInput } from '../../types';
import { useAcademicYears } from '../../hooks/use-academic-years';
import {
  ArrowLeft,
  GraduationCap,
  Save,
  Calendar,
  Building2,
  BookOpen,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSubmit: (
    data: CreateCourseInput & { branchId?: string; academicYearId?: string },
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function CourseDialog({
  open,
  onOpenChange,
  course,
  onSubmit,
  isSubmitting,
}: CourseDialogProps) {
  const { data: branchesRes } = useBranches({ limit: 100, status: 'ACTIVE' } as any);
  const branches = branchesRes?.data || [];

  const { data: yearsRes } = useAcademicYears({ limit: 100, status: 'ACTIVE' } as any);
  const academicYears = yearsRes?.data || [];

  const [feePlans, setFeePlans] = useState<
    Array<{ id: string; name: string; code: string; totalAmount: number }>
  >([]);
  const [selectedFeePlanId, setSelectedFeePlanId] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<
    CreateCourseInput & {
      branchId?: string;
      academicYearId?: string;
      startDate?: string;
      endDate?: string;
    }
  >({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: '',
      name: '',
      displayName: '',
      description: '',
      courseType: 'REGULAR',
      durationMonths: 12,
      displayOrder: 1,
      isActive: true,
      branchId: '',
      academicYearId: '',
      startDate: '',
      endDate: '',
    },
  });

  const isActive = watch('isActive');
  const selectedBranchId = watch('branchId') || '';
  const selectedYearId = watch('academicYearId') || '';
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    register('branchId');
    register('academicYearId');

    async function fetchFeePlans() {
      try {
        const data = await api.get<any>('/billing/fee-plans');
        if (Array.isArray(data)) {
          setFeePlans(data);
          if (data.length > 0 && !selectedFeePlanId) {
            setSelectedFeePlanId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load fee plans for course mapping', e);
      }
    }
    if (open) {
      fetchFeePlans();
    }
  }, [register, open]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start < end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const computedMonths = Math.round(diffDays / 30.4375);
        if (computedMonths > 0) {
          setValue('durationMonths', computedMonths);
        }
      }
    }
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (course) {
      const startVal = course.startDate
        ? new Date(course.startDate).toISOString().split('T')[0]
        : '';
      const endVal = course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '';
      reset({
        code: course.code,
        name: course.name,
        displayName: course.displayName,
        description: course.description || '',
        courseType: course.courseType,
        durationMonths: course.durationMonths,
        displayOrder: course.displayOrder,
        isActive: course.isActive,
        startDate: startVal,
        endDate: endVal,
      });
    } else {
      reset({
        code: '',
        name: '',
        displayName: '',
        description: '',
        courseType: 'REGULAR',
        durationMonths: 12,
        displayOrder: 1,
        isActive: true,
        startDate: '',
        endDate: '',
      });
    }
  }, [course, reset, open]);

  const onFormSubmit = async (data: any) => {
    const baseFeeNum = Number(data.baseFee || 0);
    const hasSelectedPlan = selectedFeePlanId && selectedFeePlanId !== 'none';
    if (!hasSelectedPlan && baseFeeNum <= 0) {
      toast.error('Please enter a Course Base Fee (₹) or select an existing Fee Structure Plan!');
      return;
    }
    await onSubmit({
      ...data,
      baseFee: baseFeeNum,
      feeStructureId: hasSelectedPlan ? selectedFeePlanId : undefined,
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-4 lg:px-0 pb-12 animate-in fade-in duration-200 text-[#0F172A] font-sans">
      {/* Top Bar with Back Action */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="gap-2 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-2xs text-xs sm:text-sm font-extrabold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 text-[#0052CC]" />
          Back to Courses
        </Button>
      </div>

      {/* Banner Header Card - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-blue-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-[#0052CC] shadow-2xs">
            <GraduationCap className="h-6 w-6 text-[#0052CC]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
              {course ? 'Course Specification' : 'New Program Setup'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-1.5">
              {course ? `Edit: ${course.displayName || course.name}` : 'Create New Course Program'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 max-w-xl">
              {course
                ? 'Update syllabus parameters, duration, start dates, and campus allocations.'
                : 'Configure course credentials, syllabus timeline, and associate initial campus branches.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* SECTION 1: Basic Information */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Basic Course Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Core identification codes and syllabus titles
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="code"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Course Code *
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. NEET-PREMIUM-2026"
                  {...register('code')}
                  disabled={!!course}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-mono font-extrabold text-[#0052CC]"
                />
                {errors.code && (
                  <p className="text-xs text-rose-600 font-bold">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="displayName"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Display Name *
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g. NEET Premium 1-Year"
                  {...register('displayName')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                />
                {errors.displayName && (
                  <p className="text-xs text-rose-600 font-bold">{errors.displayName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Full Course Title *
              </Label>
              <Input
                id="name"
                placeholder="e.g. NEET Complete Year Medical Preparation Master Course"
                {...register('name')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
              />
              {errors.name && (
                <p className="text-xs text-rose-600 font-bold">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Course Description
              </Label>
              <Input
                id="description"
                placeholder="Brief summary of target audience, syllabus coverage, and objectives..."
                {...register('description')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Timeline & Schedule */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Timeline & Schedule Settings
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Duration calculations and academic operational window
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="startDate"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                />
                {errors.startDate && (
                  <p className="text-xs text-rose-600 font-bold">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="endDate"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                />
                {errors.endDate && (
                  <p className="text-xs text-rose-600 font-bold">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="durationMonths"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Calculated Duration (Months)
                </Label>
                <Input
                  id="durationMonths"
                  type="number"
                  {...register('durationMonths')}
                  readOnly
                  className="h-10 sm:h-11 rounded-xl bg-slate-100 font-bold text-[#0052CC] cursor-not-allowed text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="displayOrder"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register('displayOrder')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Active Status
                </Label>
                <Select
                  value={isActive ? 'true' : 'false'}
                  onValueChange={(val) => setValue('isActive', val === 'true')}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold text-[#0B2447]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="true">Active Program</SelectItem>
                    <SelectItem value="false">Inactive / Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Initial Branch & Academic Allocation */}
        {!course && (
          <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0052CC]" />
                <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                  Campus Branch Allocation
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 font-medium">
                Associate this course directly with a campus branch and academic year
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Target Branch Campus
                  </Label>
                  <Select
                    value={selectedBranchId}
                    onValueChange={(val) => setValue('branchId', val)}
                  >
                    <SelectTrigger className="rounded-xl h-10 sm:h-11 bg-slate-50 border-slate-200 text-xs font-medium">
                      <SelectValue placeholder="Select campus branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Academic Year Track
                  </Label>
                  <Select
                    value={selectedYearId}
                    onValueChange={(val) => setValue('academicYearId', val)}
                  >
                    <SelectTrigger className="rounded-xl h-10 sm:h-11 bg-slate-50 border-slate-200 text-xs font-medium">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {academicYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 4: Fee Structure Mapping */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Fee Structure & Plan Mapping
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Map default tuition & installment fee structure for students enrolling in this course
              program
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseFee" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Course Base Fee (₹) *
                </Label>
                <Input
                  id="baseFee"
                  type="number"
                  placeholder="e.g. 45000"
                  {...register('baseFee')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] text-xs font-bold text-[#0052CC]"
                />
                <p className="text-[11px] text-slate-400 font-medium">
                  Standard tuition fee charged for this course program.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pre-Configured Fee Structure Plan (Optional)
                </Label>
                <Select value={selectedFeePlanId} onValueChange={(val) => setSelectedFeePlanId(val)}>
                  <SelectTrigger className="rounded-xl h-10 sm:h-11 bg-slate-50 border-slate-200 text-xs font-medium">
                    <SelectValue placeholder="Select fee structure plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">
                      Auto-Create Standard Fee Plan from Base Fee
                    </SelectItem>
                    {feePlans.map((fp: any) => (
                      <SelectItem key={fp.id} value={fp.id}>
                        {fp.name} ({fp.code}) — ₹
                        {Number(fp.totalAmount || 0).toLocaleString('en-IN')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 font-medium">
                  Select itemized installment plan, or leave as Auto-Create to map base fee.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Controls Footer Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl h-11 px-6 font-bold text-xs border-slate-200 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl h-11 px-8 shadow-2xs gap-2 text-xs"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? 'Saving Course...'
              : course
                ? 'Update Course Specs'
                : 'Save Course Program'}
          </Button>
        </div>
      </form>
    </div>
  );
}
