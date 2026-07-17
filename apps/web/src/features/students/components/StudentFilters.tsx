'use client';

import { Filter, X, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudentStatus } from '../types/student';
import { STUDENT_STATUS_LABELS } from '../types/student';

interface StudentFiltersProps {
  status: StudentStatus | 'ALL';
  onStatusChange: (status: StudentStatus | 'ALL') => void;
  course: string;
  onCourseChange: (course: string) => void;
  batch: string;
  onBatchChange: (batch: string) => void;
  courses: { id: string; name: string }[];
  batches: { id: string; name: string }[];
  className?: string;
}

export function StudentFilters({
  status,
  onStatusChange,
  course,
  onCourseChange,
  batch,
  onBatchChange,
  courses,
  batches,
  className,
}: StudentFiltersProps) {
  const hasActiveFilters = status !== 'ALL' || course || batch;

  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      {/* Status Filter */}
      <div className="relative">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger
            className={cn('w-full sm:w-[180px]', hasActiveFilters && 'border-purple-500')}
          >
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {Object.entries(STUDENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key as StudentStatus}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Filter */}
      {courses.length > 0 && (
        <div className="relative">
          <Select value={course} onValueChange={onCourseChange}>
            <SelectTrigger
              className={cn('w-full sm:w-[180px]', hasActiveFilters && 'border-purple-500')}
            >
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
        </div>
      )}

      {/* Batch Filter */}
      {batches.length > 0 && (
        <div className="relative">
          <Select value={batch} onValueChange={onBatchChange}>
            <SelectTrigger
              className={cn('w-full sm:w-[180px]', hasActiveFilters && 'border-purple-500')}
            >
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onStatusChange('ALL');
            onCourseChange('');
            onBatchChange('');
          }}
          className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
