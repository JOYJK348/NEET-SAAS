'use client';

import { useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  useCreateBatch,
  useCoursesForBatch,
  useBranchesForBatch,
  useAcademicYearsForBatch,
  useDeliveryTypes,
} from '@/features/batches/hooks/use-batches';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import {
  batchFormSchema,
  type BatchFormData,
  defaultFormValues,
} from '@/features/batches/validation/batch-schema';
import { toast } from '@/hooks/use-toast';

import {
  ArrowLeft,
  Save,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function CreateBatchContent() {
  const router = useRouter();
  const { createBatch, isCreating } = useCreateBatch();
  const { courses } = useCoursesForBatch();
  const { branches } = useBranchesForBatch();
  const { years } = useAcademicYearsForBatch();
  const { deliveryTypes } = useDeliveryTypes();

  const { data: branchCourses = [] } = useBranchCourses();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: defaultFormValues,
  });

  const generateUniqueBatchCode = useCallback(() => {
    const selectedCourseId = watch('courseId');
    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    let codePrefix = 'BTC';

    const courseObj = selectedCourse as any;
    if (courseObj?.code) {
      codePrefix = courseObj.code
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase();
    } else if (courseObj?.name) {
      codePrefix = courseObj.name
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase();
    }

    if (!/^[A-Z]/.test(codePrefix)) {
      codePrefix = 'BTC';
    }

    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `${codePrefix}${yearSuffix}_${randomSuffix}`;

    setValue('code', generatedCode, { shouldValidate: true });
  }, [watch, courses, setValue]);

  // Auto-generate code on mount if empty
  useEffect(() => {
    const currentCode = watch('code');
    if (!currentCode) {
      generateUniqueBatchCode();
    }
  }, [generateUniqueBatchCode, watch]);

  // Auto-select first Delivery Mode if not selected
  useEffect(() => {
    const currentDelivery = watch('deliveryTypeId');
    if (!currentDelivery && deliveryTypes && deliveryTypes.length > 0) {
      setValue('deliveryTypeId', deliveryTypes[0].id, { shouldValidate: true });
    }
  }, [deliveryTypes, setValue, watch]);

  const onSubmit = useCallback(
    async (data: BatchFormData) => {
      try {
        let formattedStartDate = data.startDate;
        let formattedEndDate = data.endDate;

        // If the date is in DD-MM-YYYY format, convert to YYYY-MM-DD
        if (formattedStartDate.includes('-') && formattedStartDate.split('-')[0].length === 2) {
          const parts = formattedStartDate.split('-');
          formattedStartDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (formattedEndDate.includes('-') && formattedEndDate.split('-')[0].length === 2) {
          const parts = formattedEndDate.split('-');
          formattedEndDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        const result = await createBatch({
          code: data.code,
          name: data.name,
          description: data.description || '',
          branchId: data.branchId,
          courseId: data.courseId,
          academicYearId: data.academicYearId,
          deliveryTypeId: data.deliveryTypeId,
          maxStudents: data.maxStudents,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          allowNewAdmissions: data.allowNewAdmissions,
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
        });

        if (result) {
          toast({
            title: 'Batch Created Successfully',
            description: `Batch ${result.code} - ${result.name} is ready.`,
          });
          router.push(`/dashboard/batches/${result.id}`);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create batch.',
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        const responseData = err.response?.data;
        const msg = responseData?.message || err.message || 'Failed to create batch';
        const apiErrors = responseData?.errors;

        if (Array.isArray(apiErrors) && apiErrors.length > 0) {
          apiErrors.forEach((apiErr: { field?: string; message: string }) => {
            if (apiErr.field) {
              setError(apiErr.field as any, {
                type: 'server',
                message: apiErr.message,
              });
            }
          });

          toast({
            title: 'Batch Creation Failed',
            description: apiErrors.map((e) => e.message).join('. '),
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Batch Creation Failed',
            description: Array.isArray(msg) ? msg.join('. ') : msg,
            variant: 'destructive',
          });
        }
      }
    },
    [createBatch, setError, router],
  );

  return (
    <div className="w-full space-y-6 text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
            onClick={() => router.push('/dashboard/batches')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC] mb-1">
              <span>Batches & Sections</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Create New Batch</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-[#0B2447]">
              Create New Batch
            </h1>
            <p className="text-slate-600 text-xs mt-0.5 font-medium">
              Set up a new student section, course mapping, capacity limit, and schedule timings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/batches')}
            className="px-4 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs font-bold shadow-2xs"
          >
            Cancel
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          toast({
            title: 'Validation Required',
            description: 'Please complete all required fields before submitting.',
            variant: 'destructive',
          });
        })}
        className="space-y-6"
      >
        {/* Section 1: Basic Information */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Basic Information
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Assign a unique code and identifier name for this batch section.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="code"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    Batch Code <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={generateUniqueBatchCode}
                    className="text-[11px] font-extrabold text-[#0052CC] hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto Generate
                  </button>
                </div>
                <Input
                  id="code"
                  readOnly
                  placeholder="e.g. NEET26_4912"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-mono font-extrabold uppercase tracking-wider text-[#0052CC] cursor-not-allowed select-none"
                  {...register('code')}
                />
                {errors.code ? (
                  <p className="text-xs text-rose-500 font-medium">{errors.code.message}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Auto-generated unique code identifier
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Batch Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. NEET 2026 Foundation Batch A"
                  className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-700">
                Description & Notes
              </Label>
              <Textarea
                id="description"
                placeholder="Optional batch description, classroom location, or special instructions..."
                rows={3}
                className="rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 resize-none font-medium text-xs"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 font-medium">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Academic Alignment & Delivery */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Academic & Delivery Setup
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Link the batch to an Academic Year, Branch location, Course program, and Delivery
                  mode.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      value={field.value || undefined}
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue('branchId', '');
                        setValue('courseId', '');
                      }}
                    >
                      <SelectTrigger
                        id="academicYearId"
                        className="w-full h-11 rounded-xl border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-100 text-xs"
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
                      if (branchCourses.length === 0) return true;
                      return branchCourses.some(
                        (m) => m.academicYearId === selectedYear && m.branchId === b.id,
                      );
                    });

                    return (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setValue('courseId', '');
                        }}
                      >
                        <SelectTrigger
                          id="branchId"
                          className="w-full h-11 rounded-xl border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-100 text-xs"
                        >
                          <SelectValue
                            placeholder={
                              selectedYear ? 'Select branch' : 'Select academic year first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {filteredBranches.map((b) => (
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      if (branchCourses.length === 0) return true;
                      return branchCourses.some(
                        (m) =>
                          m.branchId === selectedBranch &&
                          m.courseId === c.id &&
                          (!selectedYear || m.academicYearId === selectedYear),
                      );
                    });

                    return (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="courseId"
                          className="w-full h-11 rounded-xl border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-100 text-xs"
                        >
                          <SelectValue
                            placeholder={selectedBranch ? 'Select course' : 'Select branch first'}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {filteredCourses.map((c) => (
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
                  Delivery Mode <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="deliveryTypeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="deliveryTypeId"
                        className="w-full h-11 rounded-xl border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-100 text-xs"
                      >
                        <SelectValue placeholder="Select delivery mode (Offline/Online/Hybrid)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {deliveryTypes.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id} className="text-xs font-medium">
                            {dt.name} {dt.attendanceMode ? `(${dt.attendanceMode})` : ''}
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

        {/* Section 3: Schedule, Capacity & Admission Settings */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#0B2447]">
                  Capacity & Schedule Settings
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Define seat limits, class duration dates, daily timings, and admission flags.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Maximum Capacity */}
            <div className="space-y-1.5">
              <Label
                htmlFor="maxStudents"
                className="text-xs font-bold text-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  Maximum Student Capacity <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-[#0052CC] font-mono font-extrabold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Max 500 Seats
                </span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="maxStudents"
                  type="number"
                  min={1}
                  max={500}
                  placeholder="e.g. 60"
                  className="h-11 pl-10 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-bold text-[#0B2447]"
                  {...register('maxStudents', { valueAsNumber: true })}
                />
              </div>
              {errors.maxStudents && (
                <p className="text-xs text-rose-500 font-medium">{errors.maxStudents.message}</p>
              )}
            </div>

            {/* Start & End Dates */}
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

            {/* Daily Start & End Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-bold text-slate-700">
                  Daily Class Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="startTime"
                    type="time"
                    className="h-11 pl-10 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                    {...register('startTime')}
                  />
                </div>
                {errors.startTime && (
                  <p className="text-xs text-rose-500 font-medium">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-bold text-slate-700">
                  Daily Class End Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="endTime"
                    type="time"
                    className="h-11 pl-10 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium text-xs"
                    {...register('endTime')}
                  />
                </div>
                {errors.endTime && (
                  <p className="text-xs text-rose-500 font-medium">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            {/* Toggle for Allow New Admissions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <Label
                  htmlFor="allowNewAdmissions"
                  className="text-sm font-bold text-[#0B2447] cursor-pointer"
                >
                  Allow New Student Admissions
                </Label>
                <p className="text-xs text-slate-500 font-medium">
                  Enables students to be enrolled directly into this batch section upon
                  registration.
                </p>
              </div>
              <Controller
                name="allowNewAdmissions"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      field.value ? 'bg-[#0052CC]' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        field.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/batches')}
            className="px-6 h-11 rounded-xl text-slate-600 font-bold border-slate-200 hover:bg-slate-50 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating}
            className="px-6 h-11 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs gap-2 text-xs"
          >
            <Save className="h-4 w-4" />
            <span>{isCreating ? 'Creating Batch...' : 'Create Batch'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateBatchPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <CreateBatchContent />
      </Suspense>
    </DashboardLayout>
  );
}
