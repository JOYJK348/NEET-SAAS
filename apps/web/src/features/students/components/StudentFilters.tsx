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
  const hasActiveFilters = status !== 'ALL' || !!course || !!batch;

  const currentCourseValue = course || 'ALL_COURSES';
  const currentBatchValue = batch || 'ALL_BATCHES';

  return (
    <div
      className={cn(
        'grid grid-cols-3 sm:flex sm:flex-row items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto',
        className,
      )}
    >
      {/* Status Filter */}
      <div className="w-full sm:w-[160px] min-w-0">
        <Select value={status || 'ALL'} onValueChange={(val) => onStatusChange(val as any)}>
          <SelectTrigger
            className={cn(
              'w-full h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-white border-[#E5E7EB] hover:border-violet-300 text-[11px] sm:text-xs font-semibold transition-all shadow-xs truncate',
              status !== 'ALL' && 'border-violet-500 bg-violet-50/50 text-violet-700 font-bold',
            )}
          >
            <div className="flex items-center gap-1 min-w-0 truncate">
              <Filter className="h-3 w-3 text-slate-400 shrink-0 hidden sm:inline" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white">
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
        <div className="w-full sm:w-[170px] min-w-0">
          <Select
            value={currentCourseValue}
            onValueChange={(val) => onCourseChange(val === 'ALL_COURSES' ? '' : val)}
          >
            <SelectTrigger
              className={cn(
                'w-full h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-white border-[#E5E7EB] hover:border-violet-300 text-[11px] sm:text-xs font-semibold transition-all shadow-xs truncate',
                !!course && 'border-violet-500 bg-violet-50/50 text-violet-700 font-bold',
              )}
            >
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-60 overflow-y-auto">
              <SelectItem value="ALL_COURSES">All Courses</SelectItem>
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
        <div className="w-full sm:w-[170px] min-w-0">
          <Select
            value={currentBatchValue}
            onValueChange={(val) => onBatchChange(val === 'ALL_BATCHES' ? '' : val)}
          >
            <SelectTrigger
              className={cn(
                'w-full h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-white border-[#E5E7EB] hover:border-violet-300 text-[11px] sm:text-xs font-semibold transition-all shadow-xs truncate',
                !!batch && 'border-violet-500 bg-violet-50/50 text-violet-700 font-bold',
              )}
            >
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-60 overflow-y-auto">
              <SelectItem value="ALL_BATCHES">All Batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onStatusChange('ALL');
            onCourseChange('');
            onBatchChange('');
          }}
          className="col-span-3 sm:col-span-1 h-8 sm:h-10 rounded-xl gap-1 px-2 text-[11px] sm:text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-200 shrink-0 w-full sm:w-auto mt-0.5 sm:mt-0"
        >
          <X className="h-3 w-3 text-violet-600" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
