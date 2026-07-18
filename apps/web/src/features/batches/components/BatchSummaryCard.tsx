'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { BatchStatusBadge } from './BatchStatusBadge';
import { CalendarDays, BookOpen, MapPin, GraduationCap, Users } from 'lucide-react';
import {
  formatBatchDate,
  calculateUtilizationRate,
  getUtilizationColor,
} from '@/features/batches/utils/batch-utils';
import type { Batch } from '@/features/batches/types/batch';

interface BatchSummaryCardProps {
  batch: Batch;
  className?: string;
}

export function BatchSummaryCard({ batch, className }: BatchSummaryCardProps) {
  const utilizationRate = calculateUtilizationRate(batch.enrolledCount, batch.maxStudents);

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
            <p className="text-sm text-gray-500">Code: {batch.code}</p>
          </div>
          <BatchStatusBadge status={batch.status} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Course</p>
              <p className="text-sm font-medium text-gray-900">{batch.courseName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Branch</p>
              <p className="text-sm font-medium text-gray-900">{batch.branchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Academic Year</p>
              <p className="text-sm font-medium text-gray-900">{batch.academicYearName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Capacity</p>
              <p className={cn('text-sm font-medium', getUtilizationColor(utilizationRate))}>
                {batch.enrolledCount}/{batch.maxStudents} ({utilizationRate}%)
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span>{formatBatchDate(batch.startDate)}</span>
          </div>
          <span className="text-gray-300">—</span>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span>{formatBatchDate(batch.endDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
