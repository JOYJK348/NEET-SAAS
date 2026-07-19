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
import { batchDeliveryTypeSchema } from '../../validation/schemas';
import type { BatchDeliveryType, CreateBatchDeliveryTypeInput, AttendanceMode } from '../../types';

interface DeliveryTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryType: BatchDeliveryType | null;
  onSubmit: (data: CreateBatchDeliveryTypeInput) => Promise<void>;
  isSubmitting: boolean;
}

export function DeliveryTypeDialog({
  open,
  onOpenChange,
  deliveryType,
  onSubmit,
  isSubmitting,
}: DeliveryTypeDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBatchDeliveryTypeInput>({
    resolver: zodResolver(batchDeliveryTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      attendanceMode: 'CLASSROOM',
      defaultMaxStudents: 40,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      colorCode: '',
      iconName: '',
      displayOrder: 1,
      isDefault: false,
      isActive: true,
    },
  });

  const attendanceMode = watch('attendanceMode');
  const isDefault = watch('isDefault');
  const isActive = watch('isActive');

  useEffect(() => {
    if (deliveryType) {
      reset({
        code: deliveryType.code,
        name: deliveryType.name,
        description: deliveryType.description || '',
        attendanceMode: deliveryType.attendanceMode,
        defaultMaxStudents: deliveryType.defaultMaxStudents,
        defaultStartTime: deliveryType.defaultStartTime,
        defaultEndTime: deliveryType.defaultEndTime,
        colorCode: deliveryType.colorCode || '',
        iconName: deliveryType.iconName || '',
        displayOrder: deliveryType.displayOrder,
        isDefault: deliveryType.isDefault,
        isActive: deliveryType.isActive,
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        attendanceMode: 'CLASSROOM',
        defaultMaxStudents: 40,
        defaultStartTime: '09:00',
        defaultEndTime: '17:00',
        colorCode: '',
        iconName: '',
        displayOrder: 1,
        isDefault: false,
        isActive: true,
      });
    }
  }, [deliveryType, reset, open]);

  const onFormSubmit = async (data: CreateBatchDeliveryTypeInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{deliveryType ? 'Edit Delivery Type' : 'Create Delivery Type'}</DialogTitle>
          <DialogDescription>
            {deliveryType
              ? 'Update configuration for this delivery model.'
              : 'Define a new batch delivery structure.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. CLASSROOM-FULL"
                {...register('code')}
                disabled={!!deliveryType}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Full Classroom" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Full classroom attendance"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Attendance Mode</Label>
              <Select
                value={attendanceMode}
                onValueChange={(val: string) => setValue('attendanceMode', val as AttendanceMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLASSROOM">Classroom</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMaxStudents">Default Max Students</Label>
              <Input id="defaultMaxStudents" type="number" {...register('defaultMaxStudents')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultStartTime">Start Time</Label>
              <Input
                id="defaultStartTime"
                placeholder="e.g. 09:00"
                {...register('defaultStartTime')}
              />
              {errors.defaultStartTime && (
                <p className="text-xs text-red-500">{errors.defaultStartTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultEndTime">End Time</Label>
              <Input id="defaultEndTime" placeholder="e.g. 17:00" {...register('defaultEndTime')} />
              {errors.defaultEndTime && (
                <p className="text-xs text-red-500">{errors.defaultEndTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" type="number" {...register('displayOrder')} />
            </div>

            <div className="space-y-2">
              <Label>Default Status</Label>
              <Select
                value={isDefault ? 'true' : 'false'}
                onValueChange={(val) => setValue('isDefault', val === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Is Default?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Default</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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
