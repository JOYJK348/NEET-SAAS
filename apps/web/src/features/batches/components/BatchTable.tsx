'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, Edit2 } from 'lucide-react';
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
        <span className="font-mono font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs">
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
            className="font-extrabold text-[#0B2447] text-sm hover:text-[#0052CC] cursor-pointer transition-colors"
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-[#0052CC] border border-blue-200">
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {batch.branchName}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, batch) => (
        <div className="flex items-center gap-2.5">
          <BatchStatusBadge status={batch.status} />
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(batch.id, batch.isActive);
              }}
              className={cn(
                'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                batch.isActive ? 'bg-emerald-500' : 'bg-slate-300',
              )}
              title="Toggle active status"
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out',
                  batch.isActive ? 'translate-x-3' : 'translate-x-0',
                )}
              />
            </button>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                batch.isActive ? 'text-emerald-600' : 'text-slate-400',
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
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>
                {batch.enrolledCount} / {batch.maxStudents}
              </span>
              <span className="text-[10px] font-extrabold text-[#0052CC]">{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-[#0052CC]',
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
          <p className="font-extrabold text-[#0B2447]">
            {format(new Date(batch.startDate), 'MMM d, yyyy')}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            to {format(new Date(batch.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, batch) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(batch.id)}
            className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
            aria-label={`View ${batch.name}`}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(batch)}
              className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
              aria-label={`Edit ${batch.name}`}
              title="Edit Batch"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
      className: 'w-24 text-right',
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
      <ChevronUp className="h-3.5 w-3.5 text-[#0052CC]" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-[#0052CC]" />
    );
  };

  if (batches.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full border-collapse table-auto text-xs" role="table">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 font-extrabold text-slate-600 uppercase tracking-wider">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left font-extrabold text-xs text-slate-600 uppercase tracking-wider',
                  col.sortable &&
                    'cursor-pointer hover:text-[#0052CC] transition-colors select-none',
                  col.className,
                )}
                onClick={() => handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={String(col.key)} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {batches.map((batch) => (
            <tr
              key={batch.id}
              className="hover:bg-blue-50/30 transition-all duration-150 cursor-pointer"
              onMouseEnter={() => onPrefetch?.(batch.id)}
              onFocus={() => onPrefetch?.(batch.id)}
              tabIndex={0}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={cn('px-4 py-3.5 text-xs', col.className)}>
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
