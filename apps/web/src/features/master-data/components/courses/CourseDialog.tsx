'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { courseSchema } from '../../validation/schemas';
import type { Course, CreateCourseInput } from '../../types';

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSubmit: (data: CreateCourseInput) => Promise<void>;
  isSubmitting: boolean;
}

export function CourseDialog({
  open,
  onOpenChange,
  course,
  onSubmit,
  isSubmitting,
}: CourseDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCourseInput>({
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
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (course) {
      reset({
        code: course.code,
        name: course.name,
        displayName: course.displayName,
        description: course.description || '',
        courseType: course.courseType,
        durationMonths: course.durationMonths,
        displayOrder: course.displayOrder,
        isActive: course.isActive,
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
      });
    }
  }, [course, reset, open]);

  const onFormSubmit = async (data: CreateCourseInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Create Course'}</DialogTitle>
          <DialogDescription>
            {course ? 'Update course specifications.' : 'Add a new educational syllabus course.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                placeholder="e.g. NEET-PREMIUM"
                {...register('code')}
                disabled={!!course}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Course Name</Label>
              <Input
                id="name"
                placeholder="e.g. NEET Premium Complete Year"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" placeholder="e.g. NEET Premium" {...register('displayName')} />
            {errors.displayName && (
              <p className="text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Standard 1-year NEET coaching program"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationMonths">Duration (Months)</Label>
              <Input id="durationMonths" type="number" {...register('durationMonths')} />
              {errors.durationMonths && (
                <p className="text-xs text-red-500">{errors.durationMonths.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" type="number" {...register('displayOrder')} />
            </div>

            <div className="space-y-2">
              <Label>Active Status</Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(val) => setValue('isActive', val === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Active?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
