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

  return (
    <Card
      className="w-full transition-all duration-200"
      onMouseEnter={() => onPrefetch?.(batch.id)}
      onFocus={() => onPrefetch?.(batch.id)}
      tabIndex={0}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{batch.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{batch.code}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <BatchStatusBadge status={batch.status} />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus?.(batch.id, batch.isActive);
                }}
                className={cn(
                  'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-none',
                  batch.isActive ? 'bg-emerald-500' : 'bg-gray-300',
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
                  'text-[9px] font-bold uppercase tracking-wider',
                  batch.isActive ? 'text-emerald-600' : 'text-gray-500',
                )}
              >
                {batch.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="truncate">{batch.courseName}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{batch.branchName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {batch.enrolledCount}/{batch.maxStudents} students
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(batch.startDate)}</span>
          </div>
          <span className="text-gray-300 dark:text-gray-600">-</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(batch.endDate)}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              onClick={() => onView?.(batch.id)}
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              onClick={() => onEdit?.(batch)}
            >
              Edit
            </Button>
          </div>

          {(VALID_TRANSITIONS[batch.status]?.length ?? 0) > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView?.(batch.id)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(batch)}>Edit Batch</DropdownMenuItem>
                <DropdownMenuSeparator />
                {VALID_TRANSITIONS[batch.status]?.map((targetStatus) => (
                  <DropdownMenuItem
                    key={targetStatus}
                    onClick={() => onStatusChange?.(batch, targetStatus)}
                    className={batch.status === targetStatus ? 'text-green-600' : ''}
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
