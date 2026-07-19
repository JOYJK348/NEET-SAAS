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
import { subjectSchema } from '../../validation/schemas';
import type { Subject, CreateSubjectInput } from '../../types';

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
  onSubmit: (data: CreateSubjectInput) => Promise<void>;
  isSubmitting: boolean;
}

export function SubjectDialog({
  open,
  onOpenChange,
  subject,
  onSubmit,
  isSubmitting,
}: SubjectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      code: '',
      name: '',
      shortName: '',
      displayName: '',
      description: '',
      subjectType: 'CORE',
      displayOrder: 1,
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (subject) {
      reset({
        code: subject.code,
        name: subject.name,
        shortName: subject.shortName || '',
        displayName: subject.displayName,
        description: subject.description || '',
        subjectType: subject.subjectType,
        displayOrder: subject.displayOrder,
        isActive: subject.isActive,
      });
    } else {
      reset({
        code: '',
        name: '',
        shortName: '',
        displayName: '',
        description: '',
        subjectType: 'CORE',
        displayOrder: 1,
        isActive: true,
      });
    }
  }, [subject, reset, open]);

  const onFormSubmit = async (data: CreateSubjectInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{subject ? 'Edit Subject' : 'Create Subject'}</DialogTitle>
          <DialogDescription>
            {subject
              ? 'Update curriculum subject configurations.'
              : 'Add a new subject to the database.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input id="code" placeholder="e.g. PHY" {...register('code')} disabled={!!subject} />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Subject Name</Label>
              <Input id="name" placeholder="e.g. Physics" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input id="shortName" placeholder="e.g. PHY" {...register('shortName')} />
              {errors.shortName && (
                <p className="text-xs text-red-500">{errors.shortName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g. Physics Core"
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-xs text-red-500">{errors.displayName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Fundamental physics concepts"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
