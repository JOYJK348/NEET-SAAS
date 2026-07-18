'use client';

import { useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = useCallback(
    async (data: BatchFormData) => {
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

            {/* Course & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <select
                  id="courseId"
                  className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  {...register('courseId')}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="text-sm text-red-500">{errors.courseId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchId">Branch *</Label>
                <select
                  id="branchId"
                  className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  {...register('branchId')}
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="text-sm text-red-500">{errors.branchId.message}</p>
                )}
              </div>
            </div>

            {/* Academic Year & Delivery Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYearId">Academic Year *</Label>
                <select
                  id="academicYearId"
                  className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  {...register('academicYearId')}
                >
                  <option value="">Select academic year</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
                {errors.academicYearId && (
                  <p className="text-sm text-red-500">{errors.academicYearId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTypeId">Delivery Type *</Label>
                <select
                  id="deliveryTypeId"
                  className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  {...register('deliveryTypeId')}
                >
                  <option value="">Select delivery type</option>
                  {deliveryTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name} ({dt.attendanceMode})
                    </option>
                  ))}
                </select>
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
