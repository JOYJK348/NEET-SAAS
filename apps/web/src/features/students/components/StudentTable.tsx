'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Check, X } from 'lucide-react';
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
  onDelete?: (student: any) => Promise<void> | void;
  onStatusChange: (student: any, status: any) => Promise<void> | void;
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
  onDelete,
  onStatusChange,
  onPrefetch,
  isLoading = false,
}: StudentTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (student: any) => {
    setPendingDeleteId(student.id);
  };

  const handleDeleteCancel = () => {
    setPendingDeleteId(null);
  };

  const handleDeleteConfirm = async (student: any) => {
    if (!onDelete) return;
    setDeletingId(student.id);
    setPendingDeleteId(null);
    try {
      await onDelete(student);
    } finally {
      setDeletingId(null);
    }
  };

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleStatusToggle = async (student: any) => {
    // ACTIVE → SUSPENDED (deactivate); anything else → ACTIVE (activate)
    const newStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdatingStatusId(student.id);
    try {
      await onStatusChange(student, newStatus);
    } finally {
      setUpdatingStatusId(null);
    }
  };
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
      render: (_, student) => {
        const isUpdating = updatingStatusId === student.id;
        const isActive = student.status === 'ACTIVE';

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusToggle(student)}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              >
                {isUpdating ? (
                  <svg
                    className="h-3 w-3 animate-spin text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                ) : isActive ? (
                  <svg
                    className="h-3 w-3 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg
                    className="h-3 w-3 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
            </button>
            <span
              className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'enrollmentDate',
      header: 'Enrolled',
      sortable: true,
      render: (_, student) => (
        <span className="text-gray-600 dark:text-gray-300">
          {format(new Date(student.createdAt || Date.now()), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, student) => {
        const isPendingDelete = pendingDeleteId === student.id;
        const isDeleting = deletingId === student.id;
        return (
          <div className="flex items-center gap-1">
            {/* View */}
            {!isPendingDelete && (
              <button
                onClick={() => onView(student)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                aria-label={`View ${getDisplayName(student)}`}
                title="View student"
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
            )}
            {/* Edit */}
            {!isPendingDelete && (
              <button
                onClick={() => onEdit(student)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                aria-label={`Edit ${getDisplayName(student)}`}
                title="Edit student"
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

            {/* Delete — two-step inline confirm */}
            {onDelete && !isPendingDelete && !isDeleting && (
              <button
                onClick={() => handleDeleteClick(student)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={`Delete ${getDisplayName(student)}`}
                title="Delete student"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {/* Deleting spinner */}
            {isDeleting && (
              <div className="flex items-center gap-1 px-2">
                <svg className="h-4 w-4 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                <span className="text-xs text-red-500">Deleting…</span>
              </div>
            )}
            {/* Inline confirm */}
            {isPendingDelete && (
              <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-150">
                <span className="text-xs font-medium text-red-600 whitespace-nowrap">Delete?</span>
                <button
                  onClick={() => handleDeleteConfirm(student)}
                  className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                  aria-label="Confirm delete"
                  title="Confirm delete"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  aria-label="Cancel delete"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      },
      className: 'w-44',
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
