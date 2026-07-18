'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { AdmissionStatusBadge } from './AdmissionStatusBadge';
import { AdmissionActionBar } from './AdmissionActionBar';
import { formatDate } from '@/features/admissions/utils/admission-utils';
import type { AdmissionListItem } from '@/features/admissions/types/admission';

export type SortField =
  'studentName' | 'courseName' | 'branchName' | 'admissionDate' | 'admissionStatus';
export type SortOrder = 'asc' | 'desc';

interface AdmissionTableProps {
  admissions: AdmissionListItem[];
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  onView?: (id: string) => void;
  onStatusChange?: (id: string) => void;
  onPrefetch?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

const columns: { key: SortField; label: string; sortable: boolean; hideOnMobile?: boolean }[] = [
  { key: 'studentName', label: 'Student', sortable: true },
  { key: 'courseName', label: 'Course', sortable: true, hideOnMobile: true },
  { key: 'branchName', label: 'Branch', sortable: true, hideOnMobile: true },
  { key: 'admissionStatus', label: 'Status', sortable: true },
  { key: 'admissionDate', label: 'Date', sortable: true, hideOnMobile: true },
];

function SortIcon({
  column,
  sortBy,
  sortOrder,
}: {
  column: SortField;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}) {
  if (sortBy !== column) return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
  return sortOrder === 'asc' ? (
    <ChevronUp className="h-4 w-4 text-purple-600" />
  ) : (
    <ChevronDown className="h-4 w-4 text-purple-600" />
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 bg-gray-200 rounded"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdmissionTable({
  admissions,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onStatusChange,
  onPrefetch,
  isLoading,
  className,
}: AdmissionTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                  col.hideOnMobile && 'hidden lg:table-cell',
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <SortIcon column={col.key} sortBy={sortBy} sortOrder={sortOrder} />
                  )}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            admissions.map((admission) => (
              <tr
                key={admission.id}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => onView?.(admission.id)}
                onMouseEnter={() => onPrefetch?.(admission.id)}
                onFocus={() => onPrefetch?.(admission.id)}
                tabIndex={0}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{admission.studentName}</p>
                    <p className="text-xs text-gray-500">{admission.admissionNumber}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">
                  {admission.courseName}
                </td>
                <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">
                  {admission.branchName}
                </td>
                <td className="px-4 py-3">
                  <AdmissionStatusBadge status={admission.admissionStatus} />
                </td>
                <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">
                  {formatDate(admission.admissionDate)}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdmissionActionBar
                    onView={() => onView?.(admission.id)}
                    onStatusChange={() => onStatusChange?.(admission.id)}
                    size="icon"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
