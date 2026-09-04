'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Eye,
  Phone,
  Mail,
  GraduationCap,
  Users,
  Calendar,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleDeleteClick = (student: any) => {
    setStudentToDelete(student);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(studentToDelete);
      setStudentToDelete(null);
    } finally {
      setIsDeleting(false);
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
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-extrabold text-xs shrink-0 border border-blue-200">
            {getInitials(student)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-sm text-[#0B2447] truncate">
                {getDisplayName(student)}
              </p>
              {student.studentId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] font-mono font-extrabold text-[10px] border border-blue-200 shrink-0">
                  {student.studentId}
                </span>
              )}
            </div>
            <div className="flex flex-col text-xs text-slate-500 mt-0.5 space-y-0.5">
              <p className="truncate flex items-center gap-1 font-medium">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </p>
              {student.phone && (
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{student.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course Track',
      sortable: true,
      render: (_, student) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-extrabold text-xs max-w-[170px] truncate">
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0052CC] border border-blue-200 font-extrabold text-xs max-w-[170px] truncate">
          <Users className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
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
                'relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-100',
                isActive ? 'bg-emerald-500' : 'bg-slate-300',
                isUpdating && 'opacity-60 cursor-wait',
              )}
            >
              <span className="sr-only">Toggle status</span>
              <span
                className={cn(
                  'pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold text-slate-600',
                  isActive ? 'translate-x-4.5' : 'translate-x-0',
                )}
              >
                {isUpdating ? (
                  <span className="w-2 h-2 rounded-full bg-[#0052CC] animate-ping" />
                ) : null}
              </span>
            </button>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all',
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
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 font-mono">
          <Calendar className="w-3 h-3 text-[#0052CC]" />
          {student.admissionDate
            ? format(new Date(student.admissionDate), 'MMM d, yyyy')
            : format(new Date(student.createdAt || Date.now()), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, student) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onView(student)}
            className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
            title={`View ${getDisplayName(student)} details`}
          >
            <Eye className="h-4 w-4" />
          </button>

          {onDelete && (
            <button
              onClick={() => handleDeleteClick(student)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
              title={`Delete ${getDisplayName(student)}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
      className: 'w-24 text-right',
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
      <ChevronUp className="h-3.5 w-3.5 text-[#0052CC]" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-[#0052CC]" />
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-2">
        <div className="w-6 h-6 rounded-full bg-[#0052CC] animate-ping mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Loading student directory table...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs relative">
        <table className="w-full border-collapse table-auto" role="table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-extrabold text-slate-600 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-slate-900 select-none',
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
          <tbody className="divide-y divide-slate-100 font-medium">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-blue-50/30 transition-all duration-150"
                onMouseEnter={() => onPrefetch?.(student.id)}
                onFocus={() => onPrefetch?.(student.id)}
                tabIndex={0}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('px-4 py-3 text-sm text-slate-700', col.className)}
                  >
                    {col.render ? col.render(student[col.key as string], student) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Responsive Delete Confirmation Dialog Modal */}
      <Dialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white p-0 overflow-hidden border border-slate-200 shadow-xl">
          {/* Light Rose Header */}
          <div className="bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 text-slate-900 p-5 border-b border-rose-200 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-extrabold text-rose-700 uppercase tracking-wider bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200 inline-block mb-0.5">
                CONFIRM DELETION
              </span>
              <DialogTitle className="text-base font-extrabold text-[#0B2447] leading-snug">
                Delete Student Record
              </DialogTitle>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <DialogDescription className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to delete{' '}
              <span className="font-extrabold text-[#0B2447]">
                {studentToDelete ? getDisplayName(studentToDelete) : 'this student'}
              </span>
              ? This action cannot be undone and will permanently remove their enrollment history
              and student profile.
            </DialogDescription>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed text-[11px]">
                Warning: Permanent deletion cannot be reverted. Make sure you intend to remove this
                record.
              </span>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-slate-100 mt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs px-4"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl h-10 text-white font-extrabold text-xs px-5 bg-rose-600 hover:bg-rose-700 shadow-2xs transition-all"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Student'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
