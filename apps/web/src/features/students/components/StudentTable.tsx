'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';

function getInitials(student: any): string {
  if (student.fullName) {
    return student.fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  const first = student.firstName?.[0] || '';
  const last = student.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function getDisplayName(student: any): string {
  return (
    student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown'
  );
}

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface StudentTableProps {
  students: any[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  onView: (student: any) => void;
  onEdit: (student: any) => void;
  onStatusChange: (student: any, status: any) => void;
  onPrefetch?: (id: string) => void;
  isLoading?: boolean;
}

export function StudentTable({
  students,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onStatusChange,
  onPrefetch,
  isLoading = false,
}: StudentTableProps) {
  const columns: Column<any>[] = [
    {
      key: 'avatar',
      header: '',
      render: (_, student) => (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{getInitials(student)}</span>
        </div>
      ),
      className: 'w-12',
    },
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      render: (_, student) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{getDisplayName(student)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (_, student) => (
        <span className="text-gray-600 dark:text-gray-300">{student.phone}</span>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      sortable: true,
      render: (_, student) => (
        <span className="text-gray-600 dark:text-gray-300">{student.courseName}</span>
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      sortable: true,
      render: (_, student) => (
        <span className="text-gray-600 dark:text-gray-300">{student.batchName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, student) => <StatusBadge status={student.status} />,
    },
    {
      key: 'enrollmentDate',
      header: 'Enrolled',
      sortable: true,
      render: (_, student) => (
        <span className="text-gray-600 dark:text-gray-300">
          {format(new Date(student.admissionDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, student) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(student)}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`View ${getDisplayName(student)}`}
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
          <button
            onClick={() => onEdit(student)}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`Edit ${getDisplayName(student)}`}
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
        </div>
      ),
      className: 'w-24',
    },
  ];

  const handleSort = (key: string) => {
    if (columns.find((c) => c.key === key)?.sortable) {
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

  if (isLoading) {
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
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (students.length === 0) {
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
          {students.map((student) => (
            <tr
              key={student.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onMouseEnter={() => onPrefetch?.(student.id)}
              onFocus={() => onPrefetch?.(student.id)}
              tabIndex={0}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={cn('px-4 py-4', col.className)}>
                  {col.render ? col.render(student[col.key as string], student) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
