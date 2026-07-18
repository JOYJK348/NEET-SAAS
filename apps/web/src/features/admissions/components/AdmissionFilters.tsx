'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdmissionStatus } from '@/features/admissions/types/admission';
import { ADMISSION_STATUS_OPTIONS } from '@/features/admissions/types/admission';

interface AdmissionFiltersProps {
  status: AdmissionStatus | 'ALL';
  onStatusChange: (value: AdmissionStatus | 'ALL') => void;
  course: string;
  onCourseChange: (value: string) => void;
  branch: string;
  onBranchChange: (value: string) => void;
  courses: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  className?: string;
}

export function AdmissionFilters({
  status,
  onStatusChange,
  course,
  onCourseChange,
  branch,
  onBranchChange,
  courses,
  branches,
  className,
}: AdmissionFiltersProps) {
  const hasActiveFilters = status !== 'ALL' || course || branch;

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Select value={status} onValueChange={(v) => onStatusChange(v as AdmissionStatus | 'ALL')}>
        <SelectTrigger className="w-[160px] h-11 rounded-xl border-gray-200 bg-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {ADMISSION_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={course} onValueChange={onCourseChange}>
        <SelectTrigger className="w-[180px] h-11 rounded-xl border-gray-200 bg-white">
          <SelectValue placeholder="All Courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Courses</SelectItem>
          {courses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={branch} onValueChange={onBranchChange}>
        <SelectTrigger className="w-[160px] h-11 rounded-xl border-gray-200 bg-white">
          <SelectValue placeholder="All Branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Branches</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 rounded-xl text-gray-500"
          onClick={() => {
            onStatusChange('ALL');
            onCourseChange('');
            onBranchChange('');
          }}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
