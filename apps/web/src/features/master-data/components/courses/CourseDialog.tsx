'use client';

import { useEffect } from 'react';
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
import { ArrowLeft, GraduationCap, Save, Calendar, Building2, BookOpen } from 'lucide-react';

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
  }, [register]);

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
    await onSubmit(data);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-4 lg:px-0 pb-12 animate-in fade-in duration-200">
      {/* Top Bar with Back Action */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="gap-2 rounded-xl border-gray-200 bg-white hover:bg-gray-50 shadow-2xs text-xs sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
          Back to Curriculum
        </Button>
      </div>

      {/* Banner Header Card - Primary Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-2xs font-mono uppercase tracking-wider text-primary-foreground/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              {course ? 'Course Specification' : 'New Program Setup'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-2">
              {course ? `Edit: ${course.displayName || course.name}` : 'Create New Course Program'}
            </h1>
            <p className="text-xs sm:text-sm text-primary-foreground/90 mt-1 max-w-xl">
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
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold">
                Basic Course Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Core identification codes and syllabus titles
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  Course Code *
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. NEET-PREMIUM-2026"
                  {...register('code')}
                  disabled={!!course}
                  className="h-10 sm:h-11 rounded-xl font-mono"
                />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs font-semibold">
                  Display Name *
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g. NEET Premium 1-Year"
                  {...register('displayName')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Full Course Title *
              </Label>
              <Input
                id="name"
                placeholder="e.g. NEET Complete Year Medical Preparation Master Course"
                {...register('name')}
                className="h-10 sm:h-11 rounded-xl"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Course Description
              </Label>
              <Input
                id="description"
                placeholder="Brief summary of target audience, syllabus coverage, and objectives..."
                {...register('description')}
                className="h-10 sm:h-11 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Timeline & Schedule */}
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold">
                Timeline & Schedule Settings
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Duration calculations and academic operational window
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.endDate && (
                  <p className="text-xs text-destructive">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="durationMonths" className="text-xs font-semibold">
                  Calculated Duration (Months)
                </Label>
                <Input
                  id="durationMonths"
                  type="number"
                  {...register('durationMonths')}
                  readOnly
                  className="h-10 sm:h-11 rounded-xl bg-muted font-semibold cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="displayOrder" className="text-xs font-semibold">
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register('displayOrder')}
                  className="h-10 sm:h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Active Status</Label>
                <Select
                  value={isActive ? 'true' : 'false'}
                  onValueChange={(val) => setValue('isActive', val === 'true')}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
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
          <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
            <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm sm:text-base font-semibold">
                  Campus Branch Allocation
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Associate this course directly with a campus branch and academic year
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Target Branch Campus</Label>
                  <Select
                    value={selectedBranchId}
                    onValueChange={(val) => setValue('branchId', val)}
                  >
                    <SelectTrigger className="rounded-xl h-10 sm:h-11">
                      <SelectValue placeholder="Select campus branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Academic Year Track</Label>
                  <Select
                    value={selectedYearId}
                    onValueChange={(val) => setValue('academicYearId', val)}
                  >
                    <SelectTrigger className="rounded-xl h-10 sm:h-11">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
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

        {/* Action Controls Footer Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto btn-primary rounded-xl h-11 px-8 shadow-md gap-2"
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
