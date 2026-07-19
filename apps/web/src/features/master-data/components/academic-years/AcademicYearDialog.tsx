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
import { academicYearSchema } from '../../validation/schemas';
import type { AcademicYear, CreateAcademicYearInput } from '../../types';

interface AcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear | null;
  onSubmit: (data: CreateAcademicYearInput) => Promise<void>;
  isSubmitting: boolean;
}

export function AcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  onSubmit,
  isSubmitting,
}: AcademicYearDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAcademicYearInput>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      displayOrder: 1,
      isCurrent: false,
      isActive: true,
    },
  });

  const isCurrent = watch('isCurrent');
  const isActive = watch('isActive');

  useEffect(() => {
    if (academicYear) {
      reset({
        code: academicYear.code,
        name: academicYear.name,
        description: academicYear.description || '',
        startDate: academicYear.startDate
          ? new Date(academicYear.startDate).toISOString().split('T')[0]
          : '',
        endDate: academicYear.endDate
          ? new Date(academicYear.endDate).toISOString().split('T')[0]
          : '',
        displayOrder: academicYear.displayOrder,
        isCurrent: academicYear.isCurrent,
        isActive: academicYear.isActive,
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        displayOrder: 1,
        isCurrent: false,
        isActive: true,
      });
    }
  }, [academicYear, reset, open]);

  const onFormSubmit = async (data: CreateAcademicYearInput) => {
    // Format to ISO Strings
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };
    await onSubmit(formattedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{academicYear ? 'Edit Academic Year' : 'Create Academic Year'}</DialogTitle>
          <DialogDescription>
            {academicYear
              ? 'Modify details of the academic year.'
              : 'Add a new academic year period.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Year Code</Label>
              <Input
                id="code"
                placeholder="e.g. 2026-27"
                {...register('code')}
                disabled={!!academicYear}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="e.g. Academic Year 2026-27" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Standard 12-month calendar academic cycle"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-xs text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" type="number" {...register('displayOrder')} />
            </div>

            <div className="space-y-2 col-span-1">
              <Label>Active Status</Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(val) => setValue('isActive', val === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Active Status" />
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
