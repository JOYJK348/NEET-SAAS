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
  onPrefetch?: (id: string) => void;
}

export function BatchTable({
  batches,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onPrefetch,
}: BatchTableProps) {
  const columns: Column<BatchListItem>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, batch) => (
        <span className="font-medium text-gray-900 dark:text-white">{batch.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, batch) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{batch.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{batch.academicYearName}</p>
        </div>
      ),
    },
    {
      key: 'courseName',
      header: 'Course',
      sortable: true,
      render: (_, batch) => (
        <span className="text-gray-600 dark:text-gray-300">{batch.courseName}</span>
      ),
    },
    {
      key: 'branchName',
      header: 'Branch',
      sortable: true,
      render: (_, batch) => (
        <span className="text-gray-600 dark:text-gray-300">{batch.branchName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, batch) => <BatchStatusBadge status={batch.status} />,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      sortable: true,
      render: (_, batch) => (
        <span className="text-gray-600 dark:text-gray-300">
          {batch.enrolledCount}/{batch.maxStudents}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (_, batch) => (
        <span className="text-gray-600 dark:text-gray-300">
          {format(new Date(batch.startDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (_, batch) => (
        <span className="text-gray-600 dark:text-gray-300">
          {format(new Date(batch.endDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, batch) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(batch.id)}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`View ${batch.name}`}
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
              className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              aria-label={`Edit ${batch.name}`}
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
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary" />
    );
  };

  if (batches.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  col.sortable &&
                    'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none',
                  col.className,
                )}
                onClick={() => handleSort(String(col.key))}
                style={{ width: col.className?.includes('w-') ? undefined : undefined }}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={String(col.key)} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {batches.map((batch) => (
            <tr
              key={batch.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onMouseEnter={() => onPrefetch?.(batch.id)}
              onFocus={() => onPrefetch?.(batch.id)}
              tabIndex={0}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={cn('px-4 py-4', col.className)}>
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
