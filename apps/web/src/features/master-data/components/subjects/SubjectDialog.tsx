'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
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
import { BookOpen } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl p-0 overflow-hidden border-slate-200 shadow-xl">
        {/* ISML LMS Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 border-b border-blue-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5 text-[#0052CC]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-extrabold text-[#0052CC] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block mb-0.5">
              SUBJECT CONFIGURATION
            </span>
            <DialogTitle className="text-base font-extrabold text-[#0B2447] leading-snug">
              {subject ? 'Edit Master Subject' : 'Create Master Subject'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium mt-0.5">
              {subject
                ? 'Update master curriculum subject configurations.'
                : 'Add a new core subject to the database.'}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="code"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Subject Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. PHY"
                {...register('code')}
                disabled={!!subject}
                className="h-10 rounded-xl bg-slate-50 text-xs font-mono font-extrabold text-[#0052CC] border-slate-200"
              />
              {errors.code && (
                <p className="text-xs text-rose-600 font-bold">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Full Subject Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Physics"
                {...register('name')}
                className="h-10 rounded-xl bg-slate-50 text-xs font-medium border-slate-200 focus:border-[#0052CC]"
              />
              {errors.name && (
                <p className="text-xs text-rose-600 font-bold">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="shortName"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Short Name
              </Label>
              <Input
                id="shortName"
                placeholder="e.g. PHY"
                {...register('shortName')}
                className="h-10 rounded-xl bg-slate-50 text-xs font-medium border-slate-200 focus:border-[#0052CC]"
              />
              {errors.shortName && (
                <p className="text-xs text-rose-600 font-bold">{errors.shortName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="displayName"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Display Name
              </Label>
              <Input
                id="displayName"
                placeholder="e.g. Physics Core"
                {...register('displayName')}
                className="h-10 rounded-xl bg-slate-50 text-xs font-medium border-slate-200 focus:border-[#0052CC]"
              />
              {errors.displayName && (
                <p className="text-xs text-rose-600 font-bold">{errors.displayName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
            >
              Description
            </Label>
            <Input
              id="description"
              placeholder="e.g. Fundamental physics concepts"
              {...register('description')}
              className="h-10 rounded-xl bg-slate-50 text-xs font-medium border-slate-200 focus:border-[#0052CC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="displayOrder"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Display Order
              </Label>
              <Input
                id="displayOrder"
                type="number"
                {...register('displayOrder')}
                className="h-10 rounded-xl bg-slate-50 text-xs font-medium border-slate-200 focus:border-[#0052CC]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Active Status
              </Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(val) => setValue('isActive', val === 'true')}
              >
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 text-xs font-bold text-[#0B2447] border-slate-200">
                  <SelectValue placeholder="Active?" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 font-bold text-xs border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-10 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
