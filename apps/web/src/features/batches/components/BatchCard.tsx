'use client';

import type { BatchStatus } from '@/features/batches/types/batch';
import { BatchStatusBadge } from './BatchStatusBadge';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Calendar, MapPin, Users, GraduationCap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BatchListItem } from '@/features/batches/types/batch';
import { VALID_TRANSITIONS, BATCH_STATUS_LABELS } from '@/features/batches/types/batch';

interface BatchCardProps {
  batch: BatchListItem;
  onView?: (id: string) => void;
  onEdit?: (batch: BatchListItem) => void;
  onStatusChange?: (batch: BatchListItem, status: BatchStatus) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  onPrefetch?: (id: string) => void;
}

export function BatchCard({
  batch,
  onView,
  onEdit,
  onStatusChange,
  onToggleStatus,
  onPrefetch,
}: BatchCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const percent = Math.min(100, Math.round((batch.enrolledCount / (batch.maxStudents || 1)) * 100));

  return (
    <Card
      className="w-full rounded-2xl border-[#E5E7EB] bg-white shadow-xs hover:shadow-md hover:border-violet-300 transition-all duration-200 overflow-hidden"
      onMouseEnter={() => onPrefetch?.(batch.id)}
      onFocus={() => onPrefetch?.(batch.id)}
      tabIndex={0}
    >
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-violet-50 text-violet-700 border border-violet-100">
              {batch.code}
            </span>
            <h3
              className="font-extrabold text-slate-900 text-base leading-snug truncate hover:text-violet-600 cursor-pointer"
              onClick={() => onView?.(batch.id)}
            >
              {batch.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate">{batch.academicYearName}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <BatchStatusBadge status={batch.status} />
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus?.(batch.id, batch.isActive);
                }}
                className={cn(
                  'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-none',
                  batch.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                )}
                title="Toggle active status"
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    batch.isActive ? 'translate-x-3' : 'translate-x-0',
                  )}
                />
              </button>
              <span
                className={cn(
                  'text-[9px] font-extrabold uppercase tracking-wider',
                  batch.isActive ? 'text-emerald-600' : 'text-slate-500',
                )}
              >
                {batch.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <GraduationCap className="h-3.5 w-3.5 text-violet-600 shrink-0" />
            <span className="truncate font-semibold text-slate-700">{batch.courseName}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <MapPin className="h-3.5 w-3.5 text-violet-600 shrink-0" />
            <span className="truncate font-semibold text-slate-700">{batch.branchName}</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Enrolled Students</span>
            </div>
            <span className="font-extrabold text-slate-900">
              {batch.enrolledCount} / {batch.maxStudents} ({percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-violet-600',
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Date Pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {formatDate(batch.startDate)} &ndash; {formatDate(batch.endDate)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 font-bold text-xs h-9"
              onClick={() => onView?.(batch.id)}
            >
              View Batch
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 font-bold text-xs h-9"
              onClick={() => onEdit?.(batch)}
            >
              Edit Batch
            </Button>
          </div>

          {(VALID_TRANSITIONS[batch.status]?.length ?? 0) > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl shadow-lg border-slate-200"
              >
                <DropdownMenuItem
                  onClick={() => onView?.(batch.id)}
                  className="font-semibold text-xs py-2"
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit?.(batch)}
                  className="font-semibold text-xs py-2"
                >
                  Edit Batch
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {VALID_TRANSITIONS[batch.status]?.map((targetStatus) => (
                  <DropdownMenuItem
                    key={targetStatus}
                    onClick={() => onStatusChange?.(batch, targetStatus)}
                    className={cn(
                      'font-semibold text-xs py-2',
                      batch.status === targetStatus ? 'text-violet-600' : '',
                    )}
                  >
                    {targetStatus === 'CANCELLED'
                      ? 'Cancel Batch'
                      : `Mark ${BATCH_STATUS_LABELS[targetStatus]}`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
