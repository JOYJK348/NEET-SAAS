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
import { branchSchema } from '../../validation/schemas';
import type { Branch, CreateBranchInput, BranchType } from '../../types';
import { useAcademicYears } from '../../hooks/use-academic-years';

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSubmit: (data: CreateBranchInput) => Promise<void>;
  isSubmitting: boolean;
}

export function BranchDialog({
  open,
  onOpenChange,
  branch,
  onSubmit,
  isSubmitting,
}: BranchDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      code: '',
      slug: '',
      name: '',
      displayName: '',
      email: '',
      phone: '',
      branchType: 'CAMPUS',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      academicYearId: undefined,
    },
  });

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const academicYears = academicYearsData?.data ?? [];

  const branchType = watch('branchType');
  const status = watch('status');
  const academicYearId = watch('academicYearId');

  useEffect(() => {
    if (branch) {
      reset({
        code: branch.code,
        slug: branch.slug,
        name: branch.name,
        displayName: branch.displayName,
        email: branch.email,
        phone: branch.phone,
        branchType: branch.branchType,
        status: branch.status,
        timezone: branch.timezone,
        academicYearId: (branch as any).academicYearId ?? undefined,
      });
    } else {
      reset({
        code: '',
        slug: '',
        name: '',
        displayName: '',
        email: '',
        phone: '',
        branchType: 'CAMPUS',
        status: 'ACTIVE',
        timezone: 'Asia/Kolkata',
        academicYearId: undefined,
      });
    }
  }, [branch, reset, open]);

  const onFormSubmit = async (data: CreateBranchInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{branch ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
          <DialogDescription>
            {branch
              ? 'Modify the details of the existing branch.'
              : 'Add a new branch to the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {/* Academic Year */}
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select
              value={academicYearId ?? ''}
              onValueChange={(val: string) =>
                setValue('academicYearId', val === '__none__' ? undefined : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- None --</SelectItem>
                {academicYears.map((yr: any) => (
                  <SelectItem key={yr.id} value={yr.id}>
                    {yr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Branch Code</Label>
              <Input
                id="code"
                placeholder="e.g. CHN-MAIN"
                {...register('code')}
                disabled={!!branch} // Usually code is read-only on edit
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug Identifier</Label>
              <Input id="slug" placeholder="e.g. chn-main" {...register('slug')} />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Branch Name</Label>
            <Input id="name" placeholder="e.g. Chennai Main Campus" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g. Chennai Campus"
              {...register('displayName')}
            />
            {errors.displayName && (
              <p className="text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Contact</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. info@domain.com"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Contact</Label>
              <Input id="phone" placeholder="e.g. +919876543210" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Branch Type</Label>
              <Select
                value={branchType}
                onValueChange={(val: string) => setValue('branchType', val as BranchType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                  <SelectItem value="CAMPUS">Campus</SelectItem>
                  <SelectItem value="FRANCHISE">Franchise</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(val: string) => setValue('status', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
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
