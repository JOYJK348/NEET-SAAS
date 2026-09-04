'use client';

import { useCallback, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Layers,
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  useBatch,
  useUpdateBatch,
  useCoursesForBatch,
  useBranchesForBatch,
  useAcademicYearsForBatch,
  useDeliveryTypes,
} from '@/features/batches/hooks/use-batches';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { BatchSkeleton } from '@/features/batches/components/BatchSkeleton';
import { BatchEmptyState } from '@/features/batches/components/BatchEmptyState';
import { baseBatchFormSchema } from '@/features/batches/validation/batch-schema';
import { z } from 'zod';
import { canEditBatch } from '@/features/batches/utils/batch-utils';
import { BATCH_STATUS_OPTIONS } from '@/features/batches/types/batch';
import type { BatchStatus } from '@/features/batches/types/batch';
import { toast } from '@/hooks/use-toast';

const editBatchFormSchema = baseBatchFormSchema
  .extend({
    status: z.string().min(1, 'Status is required'),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

function EditBatchContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { batch, isLoading, error } = useBatch(id);
  const { updateBatch, isUpdating } = useUpdateBatch();
  const { courses } = useCoursesForBatch();
  const { branches } = useBranchesForBatch();
  const { years } = useAcademicYearsForBatch();
  const { deliveryTypes } = useDeliveryTypes();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof editBatchFormSchema>>({
    resolver: zodResolver(editBatchFormSchema),
  });

  const { data: branchCourses = [] } = useBranchCourses();

  useEffect(() => {
    if (batch) {
      const startVal = batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '';
      const endVal = batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '';
      reset({
        code: batch.code,
        name: batch.name,
        description: batch.description || '',
        branchId: batch.branchId,
        courseId: batch.courseId,
        academicYearId: batch.academicYearId,
        deliveryTypeId: batch.deliveryTypeId,
        maxStudents: batch.maxStudents,
        startDate: startVal,
        endDate: endVal,
        startTime: batch.startTime || '',
        endTime: batch.endTime || '',
        allowNewAdmissions: batch.allowNewAdmissions,
        status: batch.status,
      });
    }
  }, [batch, reset]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof editBatchFormSchema>) => {
      if (!batch) return;
      const { status, ...rest } = data;
      const result = await updateBatch({
        id: batch.id,
        ...rest,
        status: status as BatchStatus,
      });

      if (result) {
        toast({
          title: 'Batch Updated',
          description: `Batch ${result.code} - ${result.name} has been updated.`,
        });
        router.push(`/dashboard/batches/${batch.id}`);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update batch.',
          variant: 'destructive',
        });
      }
    },
    [batch, updateBatch, router],
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <BatchSkeleton variant="card" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BatchEmptyState hasFilters={false} variant="default" />
        <Button
          variant="outline"
          className="rounded-xl h-11 mt-4"
          onClick={() => router.push('/dashboard/batches')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batches
        </Button>
      </div>
    );
  }

  if (!canEditBatch(batch.status)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <BatchEmptyState hasFilters={false} variant="default" />
        <p className="text-sm text-slate-500 font-medium mt-3">
          Batch <span className="font-bold text-slate-700">{batch.code}</span> is currently{' '}
          <span className="uppercase text-amber-600 font-bold">{batch.status}</span> and cannot be
          modified.
        </p>
        <Button
          variant="outline"
          className="rounded-xl h-11 mt-4"
          onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batch Details
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
            onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC] mb-1">
              <span>Batches & Sections</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Edit Batch</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-[#0B2447]">
              Edit Batch Details
            </h1>
            <p className="text-slate-600 text-xs mt-0.5 font-medium">
              Update capacity, course mappings, schedule timings, and lifecycle status for{' '}
              {batch.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
            className="px-4 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs font-bold shadow-2xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit, () => {
              toast({
                title: 'Validation Required',
                description: 'Please fix all highlighted errors before saving changes.',
                variant: 'destructive',
              });
            })}
            disabled={isUpdating}
            size="sm"
            className="px-4 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          toast({
            title: 'Validation Required',
            description: 'Please fix all highlighted errors before saving changes.',
            variant: 'destructive',
          });
        })}
        className="space-y-6"
      >
        {/* Section 1: Basic Information & Status */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Basic Information & Status
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Manage the identity, code, and operational status of this batch.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label
                  htmlFor="status"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Lifecycle Status <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="status"
                        className="h-11 rounded-xl border-slate-200 bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-bold text-[#0B2447]"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {BATCH_STATUS_OPTIONS.filter((o) => o.value !== 'ALL').map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-xs font-medium"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-xs text-rose-500 font-medium">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label
                  htmlFor="code"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Batch Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. NEET26A"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-mono font-extrabold text-[#0052CC] uppercase text-xs"
                  {...register('code')}
                />
                {errors.code ? (
                  <p className="text-xs text-rose-500 font-medium">{errors.code.message}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Short uppercase identifier</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label
                  htmlFor="name"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Batch Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. NEET 2026 Foundation Batch A"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs text-[#0B2447]"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-700">
                Batch Description (Optional)
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Add special notes, classroom numbers, target objectives..."
                className="rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 font-medium">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Academic & Branch Mapping */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Academic & Branch Association
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Link batch to specific academic year, branch location, course stream, and delivery
                  mode.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Academic Year */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="academicYearId"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Academic Year <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="academicYearId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue('branchId', '');
                        setValue('courseId', '');
                      }}
                    >
                      <SelectTrigger
                        id="academicYearId"
                        className="h-11 rounded-xl border-slate-200 bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                      >
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {years.map((y) => (
                          <SelectItem key={y.id} value={y.id} className="text-xs font-medium">
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.academicYearId && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.academicYearId.message}
                  </p>
                )}
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="branchId"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Branch <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => {
                    const selectedYear = watch('academicYearId');
                    const filteredBranches = branches.filter((b) => {
                      if (!selectedYear) return true;
                      return branchCourses.some(
                        (m) => m.academicYearId === selectedYear && m.branchId === b.id,
                      );
                    });
                    const displayBranches =
                      filteredBranches.length > 0 ? filteredBranches : branches;

                    return (
                      <Select
                        value={field.value || ''}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setValue('courseId', '');
                        }}
                      >
                        <SelectTrigger
                          id="branchId"
                          className="h-11 rounded-xl border-slate-200 bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                        >
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {displayBranches.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.branchId && (
                  <p className="text-xs text-rose-500 font-medium">{errors.branchId.message}</p>
                )}
              </div>

              {/* Course */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="courseId"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Course <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => {
                    const selectedYear = watch('academicYearId');
                    const selectedBranch = watch('branchId');
                    const filteredCourses = courses.filter((c) => {
                      if (!selectedBranch) return true;
                      return branchCourses.some(
                        (m) =>
                          m.branchId === selectedBranch &&
                          m.courseId === c.id &&
                          (!selectedYear || m.academicYearId === selectedYear),
                      );
                    });
                    const displayCourses = filteredCourses.length > 0 ? filteredCourses : courses;

                    return (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="courseId"
                          className="h-11 rounded-xl border-slate-200 bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                        >
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {displayCourses.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.courseId && (
                  <p className="text-xs text-rose-500 font-medium">{errors.courseId.message}</p>
                )}
              </div>

              {/* Delivery Type */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="deliveryTypeId"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Delivery Type <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="deliveryTypeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="deliveryTypeId"
                        className="h-11 rounded-xl border-slate-200 bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                      >
                        <SelectValue placeholder="Select delivery mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {deliveryTypes.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id} className="text-xs font-medium">
                            {dt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.deliveryTypeId && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.deliveryTypeId.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Capacity & Admission Settings */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Capacity & Admission Settings
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Configure student intake quota and new student admission availability.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label
                  htmlFor="maxStudents"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Maximum Seat Capacity <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min={1}
                  max={500}
                  placeholder="e.g. 60"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-bold text-[#0B2447] text-xs"
                  {...register('maxStudents', { valueAsNumber: true })}
                />
                {errors.maxStudents ? (
                  <p className="text-xs text-rose-500 font-medium">{errors.maxStudents.message}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Maximum allowed enrolled students (1 - 500)
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 mt-2 sm:mt-0">
                <div>
                  <p className="text-xs font-bold text-[#0B2447] flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-[#0052CC]" />
                    Allow New Admissions
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Enable or pause enrollment of newly registered students into this batch
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...register('allowNewAdmissions')}
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052CC]"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Schedule & Timings */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Schedule & Daily Timings
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Define start/end batch duration dates and daily lecture shift times.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="startDate"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Batch Start Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-xs text-rose-500 font-medium">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="endDate"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Batch End Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-xs text-rose-500 font-medium">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="startTime"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                  Daily Start Time (e.g. 09:00 AM)
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                  {...register('startTime')}
                />
                {errors.startTime && (
                  <p className="text-xs text-rose-500 font-medium">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="endTime"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                  Daily End Time (e.g. 05:00 PM)
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                  {...register('endTime')}
                />
                {errors.endTime && (
                  <p className="text-xs text-rose-500 font-medium">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating / Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
            className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUpdating}
            className="h-11 px-8 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs text-xs"
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? 'Saving Changes...' : 'Save Batch Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditBatchPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <EditBatchContent />
      </Suspense>
    </DashboardLayout>
  );
}
