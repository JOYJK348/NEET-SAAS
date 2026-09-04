'use client';

import { Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BatchStatus, BATCH_STATUS_LABELS } from '@/features/batches/types/batch';

interface BatchFiltersProps {
  status: BatchStatus | 'ALL';
  onStatusChange: (status: BatchStatus | 'ALL') => void;
  course: string;
  onCourseChange: (course: string) => void;
  branch: string;
  onBranchChange: (branch: string) => void;
  courses: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  deliveryTypes?: { id: string; name: string; attendanceMode: string }[];
  onClearFilters: () => void;
  className?: string;
}

export function BatchFilters({
  status,
  onStatusChange,
  course,
  onCourseChange,
  branch,
  onBranchChange,
  courses,
  branches,
  onClearFilters,
  className,
}: BatchFiltersProps) {
  const hasActiveFilters = status !== 'ALL' || course || branch;

  return (
    <div className={cn('flex flex-col sm:flex-row gap-3 text-xs', className)}>
      <div className="relative">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger
            className={cn(
              'w-full sm:w-[180px] rounded-xl border-slate-200 text-xs font-semibold text-[#0B2447]',
              hasActiveFilters && 'border-[#0052CC]',
            )}
          >
            <Filter className="h-4 w-4 mr-2 text-[#0052CC]" aria-hidden="true" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ALL" className="text-xs font-medium">
              All Status
            </SelectItem>
            {Object.entries(BATCH_STATUS_LABELS)
              .filter(([key]) => key === 'PLANNED' || key === 'ACTIVE')
              .map(([key, label]) => (
                <SelectItem key={key} value={key as BatchStatus} className="text-xs font-medium">
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {courses.length > 0 && (
        <div className="relative">
          <Select value={course} onValueChange={onCourseChange}>
            <SelectTrigger
              className={cn(
                'w-full sm:w-[180px] rounded-xl border-slate-200 text-xs font-semibold text-[#0B2447]',
                hasActiveFilters && 'border-[#0052CC]',
              )}
            >
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="" className="text-xs font-medium">
                All Courses
              </SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {branches.length > 0 && (
        <div className="relative">
          <Select value={branch} onValueChange={onBranchChange}>
            <SelectTrigger
              className={cn(
                'w-full sm:w-[180px] rounded-xl border-slate-200 text-xs font-semibold text-[#0B2447]',
                hasActiveFilters && 'border-[#0052CC]',
              )}
            >
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="" className="text-xs font-medium">
                All Branches
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="gap-1.5 text-[#0052CC] border-blue-200 hover:bg-blue-50 rounded-xl font-bold text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
