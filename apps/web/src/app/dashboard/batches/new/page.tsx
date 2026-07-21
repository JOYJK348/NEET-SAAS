'use client';

import { useCallback, Suspense } from 'react';
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
import { ArrowLeft, Save } from 'lucide-react';
import {
  useCreateBatch,
  useCoursesForBatch,
  useBranchesForBatch,
  useAcademicYearsForBatch,
  useDeliveryTypes,
} from '@/features/batches/hooks/use-batches';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { BatchFormLayout } from '@/features/batches/components/forms/BatchFormLayout';
import {
  batchFormSchema,
  type BatchFormData,
  defaultFormValues,
} from '@/features/batches/validation/batch-schema';
import { toast } from '@/hooks/use-toast';

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
    watch,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = useCallback(
    async (data: BatchFormData) => {
      try {
        const result = await createBatch({
          code: data.code,
          name: data.name,
          description: data.description || '',
          branchId: data.branchId,
          courseId: data.courseId,
          academicYearId: data.academicYearId,
          deliveryTypeId: data.deliveryTypeId,
          maxStudents: data.maxStudents,
          startDate: data.startDate,
          endDate: data.endDate,
          allowNewAdmissions: data.allowNewAdmissions,
        });

        if (result) {
          toast({
            title: 'Batch Created',
            description: `Batch ${result.code} - ${result.name} has been created successfully.`,
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
        const msg = err.response?.data?.message || err.message || 'Failed to create batch';
        toast({
          title: 'Batch Creation Failed',
          description: Array.isArray(msg) ? msg.join('. ') : msg,
          variant: 'destructive',
        });
      }
    },
    [createBatch, router],
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => router.push('/dashboard/batches')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Batch</h1>
          <p className="text-sm text-gray-500">Create a new course batch or section</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <BatchFormLayout title="Batch Details" description="Fill in the batch information below">
          <div className="space-y-6">
            {/* Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Batch Code *</Label>
                <Input id="code" placeholder="e.g. NEET25A" {...register('code')} />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name *</Label>
                <Input id="name" placeholder="e.g. NEET 2026 Batch A" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional batch description"
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Academic Year & Branch Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYearId">Academic Year *</Label>
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
                        className="w-full h-11 rounded-xl border-gray-200 bg-white"
                      >
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select academic year</SelectItem>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.academicYearId && (
                  <p className="text-sm text-red-500">{errors.academicYearId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchId">Branch *</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => {
                    const selectedYear = watch('academicYearId');
                    const filteredBranches = branches.filter((b) => {
                      if (!selectedYear) return false;
                      return branchCourses.some(
                        (m) => m.academicYearId === selectedYear && m.branchId === b.id,
                      );
                    });

                    return (
                      <Select
                        value={field.value || ''}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setValue('courseId', '');
                        }}
                        disabled={!selectedYear}
                      >
                        <SelectTrigger
                          id="branchId"
                          className="w-full h-11 rounded-xl border-gray-200 bg-white disabled:bg-gray-50"
                        >
                          <SelectValue
                            placeholder={
                              selectedYear ? 'Select a branch' : 'Select academic year first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select a branch</SelectItem>
                          {filteredBranches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.branchId && (
                  <p className="text-sm text-red-500">{errors.branchId.message}</p>
                )}
              </div>
            </div>

            {/* Course & Delivery Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => {
                    const selectedYear = watch('academicYearId');
                    const selectedBranch = watch('branchId');
                    const filteredCourses = courses.filter((c) => {
                      if (!selectedBranch) return false;
                      return branchCourses.some(
                        (m) =>
                          m.branchId === selectedBranch &&
                          m.courseId === c.id &&
                          m.academicYearId === selectedYear,
                      );
                    });

                    return (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!selectedBranch}
                      >
                        <SelectTrigger
                          id="courseId"
                          className="w-full h-11 rounded-xl border-gray-200 bg-white disabled:bg-gray-50"
                        >
                          <SelectValue
                            placeholder={selectedBranch ? 'Select a course' : 'Select branch first'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select a course</SelectItem>
                          {filteredCourses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.courseId && (
                  <p className="text-sm text-red-500">{errors.courseId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTypeId">Delivery Type *</Label>
                <Controller
                  name="deliveryTypeId"
                  control={control}
                  render={({ field }) => {
                    const selectedCourse = watch('courseId');
                    return (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!selectedCourse}
                      >
                        <SelectTrigger
                          id="deliveryTypeId"
                          className="w-full h-11 rounded-xl border-gray-200 bg-white disabled:bg-gray-50"
                        >
                          <SelectValue
                            placeholder={
                              selectedCourse ? 'Select delivery type' : 'Select course first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select delivery type</SelectItem>
                          {deliveryTypes.map((dt) => (
                            <SelectItem key={dt.id} value={dt.id}>
                              {dt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.deliveryTypeId && (
                  <p className="text-sm text-red-500">{errors.deliveryTypeId.message}</p>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Maximum Students *</Label>
              <Input
                id="maxStudents"
                type="number"
                min={1}
                max={500}
                {...register('maxStudents', { valueAsNumber: true })}
              />
              {errors.maxStudents && (
                <p className="text-sm text-red-500">{errors.maxStudents.message}</p>
              )}
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Daily Start & End Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Daily Start Time (e.g. 09:00 AM)</Label>
                <Input id="startTime" type="time" {...register('startTime')} />
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Daily End Time (e.g. 05:00 PM)</Label>
                <Input id="endTime" type="time" {...register('endTime')} />
                {errors.endTime && <p className="text-sm text-red-500">{errors.endTime.message}</p>}
              </div>
            </div>

            {/* Allow New Admissions */}
            <div className="flex items-center gap-3">
              <input
                id="allowNewAdmissions"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                {...register('allowNewAdmissions')}
              />
              <Label htmlFor="allowNewAdmissions" className="cursor-pointer">
                Allow new admissions
              </Label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11 px-5"
              onClick={() => router.push('/dashboard/batches')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isCreating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Batch'}
            </Button>
          </div>
        </BatchFormLayout>
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
