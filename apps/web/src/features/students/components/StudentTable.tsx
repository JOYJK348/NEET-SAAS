'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Check,
  X,
  Eye,
  Phone,
  Mail,
  GraduationCap,
  Users,
  Calendar,
  XCircle,
} from 'lucide-react';
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
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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

  const handleStatusToggle = async (student: any) => {
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
      key: 'student',
      header: 'Student Info',
      sortable: true,
      render: (_, student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 border border-violet-200/60">
            {getInitials(student)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-slate-900 truncate">{getDisplayName(student)}</p>
              {student.studentId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-mono font-bold text-[10px] border border-violet-100 shrink-0">
                  {student.studentId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{student.email}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (_, student) => (
        <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          {student.phone || 'N/A'}
        </span>
      ),
    },
    {
      key: 'course',
      header: 'Course Track',
      sortable: true,
      render: (_, student) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs max-w-[180px] truncate">
          <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span className="truncate">{student.courseName || 'Unassigned'}</span>
        </span>
      ),
    },
    {
      key: 'batch',
      header: 'Assigned Batch',
      sortable: true,
      render: (_, student) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs max-w-[180px] truncate">
          <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="truncate">{student.batchName || 'Unassigned'}</span>
        </span>
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
              title={isActive ? 'Click to deactivate' : 'Click to activate'}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500',
                isActive ? 'bg-emerald-500' : 'bg-slate-300',
                isUpdating && 'opacity-60 cursor-wait',
              )}
            >
              <span className="sr-only">Toggle status</span>
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold text-slate-600',
                  isActive ? 'translate-x-5' : 'translate-x-0',
                )}
              >
                {isUpdating ? (
                  <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                ) : null}
              </span>
            </button>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200',
              )}
            >
              {isActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Inactive
                </>
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: 'enrollmentDate',
      header: 'Enrolled On',
      sortable: true,
      render: (_, student) => (
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {student.admissionDate
            ? format(new Date(student.admissionDate), 'MMM d, yyyy')
            : format(new Date(student.createdAt || Date.now()), 'MMM d, yyyy')}
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
          <div className="flex items-center gap-1 justify-end">
            {!isPendingDelete && !isDeleting && (
              <button
                onClick={() => onView(student)}
                className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                title={`View ${getDisplayName(student)} details`}
              >
                <Eye className="h-4 w-4" />
              </button>
            )}

            {onDelete && !isPendingDelete && !isDeleting && (
              <button
                onClick={() => handleDeleteClick(student)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title={`Delete ${getDisplayName(student)}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {isDeleting && (
              <span className="text-xs text-rose-500 font-bold px-2 animate-pulse">
                Deleting...
              </span>
            )}

            {isPendingDelete && (
              <div className="flex items-center gap-1 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-rose-600">Delete?</span>
                <button
                  onClick={() => handleDeleteConfirm(student)}
                  className="p-1.5 text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                  title="Confirm Delete"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      },
      className: 'w-28 text-right',
    },
  ];

  const handleSort = (key: string) => {
    if (columns.find((c) => c.key === key)?.sortable) {
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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-2">
        <div className="w-6 h-6 rounded-full bg-violet-600 animate-ping mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Loading student directory table...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[580px] rounded-2xl border border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm relative scrollbar-thin">
      <table className="w-full min-w-[950px] border-collapse" role="table">
        <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-gray-800/95 backdrop-blur-md">
          <tr className="border-b border-[#E5E7EB] dark:border-gray-800 shadow-2xs">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
                  col.sortable &&
                    'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none',
                  col.className,
                )}
                onClick={() => handleSort(String(col.key))}
              >
                <div
                  className={cn(
                    'flex items-center gap-1.5',
                    col.className?.includes('text-right') && 'justify-end',
                  )}
                >
                  {col.header}
                  {col.sortable && <SortIcon columnKey={String(col.key)} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium">
          {students.map((student) => (
            <tr
              key={student.id}
              className="hover:bg-violet-50/30 dark:hover:bg-gray-800/30 transition-all duration-150"
              onMouseEnter={() => onPrefetch?.(student.id)}
              onFocus={() => onPrefetch?.(student.id)}
              tabIndex={0}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-4 text-sm text-slate-700 dark:text-slate-200',
                    col.className,
                  )}
                >
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
