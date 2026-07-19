'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import type { AcademicYear } from '../../types';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface AcademicYearTableProps {
  years: AcademicYear[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onEdit: (year: AcademicYear) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string) => void;
}

export function AcademicYearTable({
  years,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onSetCurrent,
}: AcademicYearTableProps) {
  const columns: Column<AcademicYear>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, year) => (
        <span className="font-medium text-gray-900 dark:text-white">{year.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, year) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{year.name}</p>
          {year.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{year.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Duration',
      render: (_, year) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {format(new Date(year.startDate), 'MMM d, yyyy')} &mdash;{' '}
          {format(new Date(year.endDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'isCurrent',
      header: 'Current Year',
      sortable: true,
      render: (_, year) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            year.isCurrent
              ? 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-500/20'
              : 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
          )}
        >
          {year.isCurrent ? 'Current' : 'No'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active Status',
      sortable: true,
      render: (_, year) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            year.isActive
              ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-500/20'
              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20',
          )}
        >
          {year.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, year) => (
        <div className="flex items-center gap-2">
          {!year.isCurrent && (
            <button
              onClick={() => onSetCurrent(year.id)}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors"
              title="Set as Current Academic Year"
            >
              <CalendarCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(year)}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`Edit ${year.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(year.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            aria-label={`Delete ${year.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-32',
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

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <table className="w-full min-w-[800px]" role="table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  col.sortable &&
                    'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none',
                  col.className,
                )}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={col.key} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {years.map((year) => (
            <tr
              key={year.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-4 text-sm', col.className)}>
                  {col.render
                    ? col.render(year[col.key as keyof AcademicYear], year)
                    : String(year[col.key as keyof AcademicYear] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
