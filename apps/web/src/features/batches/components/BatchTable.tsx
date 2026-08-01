'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { BatchStatusBadge } from './BatchStatusBadge';
import { format } from 'date-fns';
import type { BatchListItem } from '@/features/batches/types/batch';

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface BatchTableProps {
  batches: BatchListItem[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onView: (id: string) => void;
  onEdit?: (batch: BatchListItem) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  onPrefetch?: (id: string) => void;
}

export function BatchTable({
  batches,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onToggleStatus,
  onPrefetch,
}: BatchTableProps) {
  const columns: Column<BatchListItem>[] = [
    {
      key: 'code',
      header: 'Batch Code',
      sortable: true,
      render: (_, batch) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100/80 shadow-2xs">
          {batch.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Batch Name & Academic Year',
      sortable: true,
      render: (_, batch) => (
        <div>
          <p
            className="font-extrabold text-slate-900 text-sm hover:text-violet-600 cursor-pointer transition-colors"
            onClick={() => onView(batch.id)}
          >
            {batch.name}
          </p>
          <p className="text-xs text-slate-500 font-medium">{batch.academicYearName}</p>
        </div>
      ),
    },
    {
      key: 'courseName',
      header: 'Course',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (_, batch) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
          {batch.courseName}
        </span>
      ),
    },
    {
      key: 'branchName',
      header: 'Branch',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (_, batch) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
          {batch.branchName}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, batch) => (
        <div className="flex items-center gap-3">
          <BatchStatusBadge status={batch.status} />
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
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
                'text-[10px] font-extrabold uppercase tracking-wider',
                batch.isActive ? 'text-emerald-600' : 'text-slate-500',
              )}
            >
              {batch.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Enrolled Capacity',
      sortable: true,
      render: (_, batch) => {
        const percent = Math.min(
          100,
          Math.round((batch.enrolledCount / (batch.maxStudents || 1)) * 100),
        );
        return (
          <div className="w-32 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>
                {batch.enrolledCount} / {batch.maxStudents}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-violet-600',
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'startDate',
      header: 'Duration',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (_, batch) => (
        <div className="text-xs text-slate-600 font-medium">
          <p className="font-semibold text-slate-800">
            {format(new Date(batch.startDate), 'MMM d, yyyy')}
          </p>
          <p className="text-[11px] text-slate-400">
            to {format(new Date(batch.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, batch) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(batch.id)}
            className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
            aria-label={`View ${batch.name}`}
            title="View Details"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(batch)}
              className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
              aria-label={`Edit ${batch.name}`}
              title="Edit Batch"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
        </div>
      ),
      className: 'w-24',
    },
  ];

  const handleSort = (key: string) => {
    if (onSort && columns.find((c) => c.key === key)?.sortable) {
      onSort(key);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortBy !== columnKey) {
      return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-violet-600" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-violet-600" />
    );
  };

  if (batches.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse" role="table">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                  col.sortable &&
                    'cursor-pointer hover:text-slate-800 select-none transition-colors',
                  col.className,
                )}
                onClick={() => handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={String(col.key)} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {batches.map((batch) => (
            <tr
              key={batch.id}
              className="hover:bg-slate-50/80 transition-colors"
              onMouseEnter={() => onPrefetch?.(batch.id)}
              onFocus={() => onPrefetch?.(batch.id)}
              tabIndex={0}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={cn('px-4 py-3.5 align-middle', col.className)}>
                  {col.render ? col.render(batch[col.key as keyof BatchListItem], batch) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
