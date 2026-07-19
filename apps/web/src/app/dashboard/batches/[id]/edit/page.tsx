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
import { ArrowLeft, Save } from 'lucide-react';
import {
  useBatch,
  useUpdateBatch,
  useCoursesForBatch,
  useBranchesForBatch,
  useAcademicYearsForBatch,
  useDeliveryTypes,
} from '@/features/batches/hooks/use-batches';
import { BatchFormLayout } from '@/features/batches/components/forms/BatchFormLayout';
import { BatchSkeleton } from '@/features/batches/components/BatchSkeleton';
import { BatchEmptyState } from '@/features/batches/components/BatchEmptyState';
import { baseBatchFormSchema } from '@/features/batches/validation/batch-schema';
import { z } from 'zod';

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
import { canEditBatch } from '@/features/batches/utils/batch-utils';
import { BATCH_STATUS_OPTIONS } from '@/features/batches/types/batch';
import type { BatchStatus } from '@/features/batches/types/batch';
import { toast } from '@/hooks/use-toast';

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
    formState: { errors },
  } = useForm<z.infer<typeof editBatchFormSchema>>({
    resolver: zodResolver(editBatchFormSchema),
  });

  useEffect(() => {
    if (batch) {
      reset({
        code: batch.code,
        name: batch.name,
        description: batch.description || '',
        branchId: batch.branchId,
        courseId: batch.courseId,
        academicYearId: batch.academicYearId,
        deliveryTypeId: batch.deliveryTypeId,
        maxStudents: batch.maxStudents,
        startDate: batch.startDate,
        endDate: batch.endDate,
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
      <div className="p-4">
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BatchEmptyState hasFilters={false} variant="default" />
        <p className="text-sm text-gray-500 mt-2">
          Batch {batch.code} is {batch.status.toLowerCase()} and cannot be edited.
        </p>
        <Button
          variant="outline"
          className="rounded-xl h-11 mt-4"
          onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Batch</h1>
          <p className="text-sm text-gray-500">
            {batch.code} &middot; {batch.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <BatchFormLayout title="Batch Details" description="Update the batch information below">
          <div className="space-y-6">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="status"
                      className="w-full h-11 rounded-xl border-gray-200 bg-white"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {BATCH_STATUS_OPTIONS.filter((o) => o.value !== 'ALL').map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Batch Code *</Label>
                <Input id="code" {...register('code')} />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register('description')} />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Course & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="courseId"
                        className="w-full h-11 rounded-xl border-gray-200 bg-white"
                      >
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select a course</SelectItem>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.courseId && (
                  <p className="text-sm text-red-500">{errors.courseId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchId">Branch *</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="branchId"
                        className="w-full h-11 rounded-xl border-gray-200 bg-white"
                      >
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select a branch</SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchId && (
                  <p className="text-sm text-red-500">{errors.branchId.message}</p>
                )}
              </div>
            </div>

            {/* Academic Year & Delivery Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYearId">Academic Year *</Label>
                <Controller
                  name="academicYearId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
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
                <Label htmlFor="deliveryTypeId">Delivery Type *</Label>
                <Controller
                  name="deliveryTypeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="deliveryTypeId"
                        className="w-full h-11 rounded-xl border-gray-200 bg-white"
                      >
                        <SelectValue placeholder="Select delivery type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select delivery type</SelectItem>
                        {deliveryTypes.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id}>
                            {dt.name} ({dt.attendanceMode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
              onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isUpdating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </BatchFormLayout>
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
