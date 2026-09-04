'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2, Eye } from 'lucide-react';
import type { Course } from '../../types';
import Link from 'next/link';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface CourseTableProps {
  courses: Course[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export function CourseTable({
  courses,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: CourseTableProps) {
  const columns: Column<Course>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, course) => (
        <span className="font-mono font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs">
          {course.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Course Program',
      sortable: true,
      render: (_, course) => (
        <div>
          <p className="font-extrabold text-[#0B2447] text-sm">{course.name}</p>
          <p className="text-xs text-slate-500 font-medium">{course.displayName}</p>
        </div>
      ),
    },
    {
      key: 'durationMonths',
      header: 'Duration',
      sortable: true,
      render: (_, course) => (
        <span className="text-slate-600 font-bold text-xs">{course.durationMonths} Months</span>
      ),
    },
    {
      key: 'courseType',
      header: 'Type',
      sortable: true,
      render: (_, course) => (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0052CC] border border-blue-200">
          {course.courseType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (_, course) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
            course.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200',
          )}
        >
          {course.isActive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </>
          ) : (
            'Inactive'
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, course) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/tenant-admin/courses/${course.id}`}
            className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
            title="View Curriculum Details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onEdit(course)}
            className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
            aria-label={`Edit ${course.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(course.id)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
            aria-label={`Delete ${course.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-32 text-right',
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

  return (
    <div className="w-full">
      {/* Mobile First Card View (Visible on Mobile/Tablet screens < md) */}
      <div className="block md:hidden space-y-3 p-3.5 bg-slate-50/50">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span className="font-mono font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px] inline-block">
                  {course.code}
                </span>
                <h4 className="font-extrabold text-[#0B2447] text-sm leading-snug truncate">
                  {course.name}
                </h4>
                {course.displayName && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">
                    {course.displayName}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0',
                  course.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200',
                )}
              >
                {course.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-700">{course.durationMonths} Months</span>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0052CC] border border-blue-200">
                {course.courseType}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <Link
                href={`/tenant-admin/courses/${course.id}`}
                className="flex-1 py-2 px-3 text-center rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052CC] font-extrabold text-xs border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                View Syllabus
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(course)}
                  className="p-2 text-slate-600 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-slate-200"
                  aria-label={`Edit ${course.name}`}
                  title="Edit course"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(course.id)}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200"
                  aria-label={`Delete ${course.name}`}
                  title="Delete course"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (Visible on Desktop screens >= md) */}
      <div className="hidden md:block overflow-hidden">
        <table className="w-full border-collapse table-auto text-xs" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 font-extrabold text-slate-600 uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-extrabold text-xs text-slate-600 uppercase tracking-wider',
                    col.sortable &&
                      'cursor-pointer hover:text-[#0052CC] transition-colors select-none',
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
          <tbody className="divide-y divide-slate-100 font-medium">
            {courses.map((course) => (
              <tr
                key={course.id}
                className="hover:bg-blue-50/30 transition-all duration-150 cursor-pointer"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 text-xs', col.className)}>
                    {col.render
                      ? col.render(course[col.key as keyof Course], course)
                      : String(course[col.key as keyof Course] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
