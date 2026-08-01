'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  CalendarCheck,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
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
  onView: (year: AcademicYear) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string) => void;
  onStatusToggle?: (year: AcademicYear, newStatus: boolean) => Promise<void> | void;
}

export function AcademicYearTable({
  years,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onDelete,
  onSetCurrent,
  onStatusToggle,
}: AcademicYearTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const columns: Column<AcademicYear>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, year) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 font-mono font-bold text-xs border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40">
          {year.code}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'name',
      header: 'Academic Year Name & Info',
      sortable: true,
      render: (_, year) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 flex items-center justify-center font-bold shrink-0 border border-violet-200/50">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-slate-900 truncate">{year.name}</p>
              {year.isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  ★ Current Active
                </span>
              )}
            </div>
            {year.description && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{year.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Duration Calendar',
      render: (_, year) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <span>
            {year.startDate ? format(new Date(year.startDate), 'MMM d, yyyy') : ''} &mdash;{' '}
            {year.endDate ? format(new Date(year.endDate), 'MMM d, yyyy') : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (_, year) => {
        const isActive = year.isActive;
        const isToggling = togglingId === year.id;

        return (
          <div className="flex items-center gap-2.5">
            {/* Interactive iOS Style Toggle Switch */}
            <button
              type="button"
              disabled={isToggling}
              onClick={async (e) => {
                e.stopPropagation();
                if (onStatusToggle) {
                  setTogglingId(year.id);
                  try {
                    await onStatusToggle(year, !isActive);
                  } finally {
                    setTogglingId(null);
                  }
                }
              }}
              title={isActive ? 'Click to deactivate' : 'Click to activate'}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                isActive ? 'bg-emerald-500' : 'bg-slate-300',
                isToggling && 'opacity-60 cursor-wait',
              )}
            >
              <span className="sr-only">Toggle status</span>
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold text-slate-600',
                  isActive ? 'translate-x-5' : 'translate-x-0',
                )}
              >
                {isToggling ? (
                  <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                ) : null}
              </span>
            </button>

            {/* Status Pill Badge */}
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
      key: 'actions',
      header: 'Actions',
      render: (_, year) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onView(year)}
            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
            title={`View ${year.name} details`}
          >
            <Eye className="h-4 w-4" />
          </button>
          {!year.isCurrent && (
            <button
              onClick={() => onSetCurrent(year.id)}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
              title="Set as Current Active Session"
            >
              <CalendarCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(year.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title={`Delete ${year.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-28 text-right',
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

  return (
    <div>
      {/* Mobile Card View - Shown on mobile screens (<640px) */}
      <div className="block sm:hidden space-y-3.5">
        {years.map((year) => {
          const isActive = year.isActive;
          const isToggling = togglingId === year.id;

          return (
            <div
              key={year.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 transition-all hover:border-violet-300"
            >
              {/* Mobile Card Header: Code & Status Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 font-mono font-bold text-xs border border-violet-100">
                  {year.code}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (onStatusToggle) {
                        setTogglingId(year.id);
                        try {
                          await onStatusToggle(year, !isActive);
                        } finally {
                          setTogglingId(null);
                        }
                      }
                    }}
                    title={isActive ? 'Deactivate' : 'Activate'}
                    className={cn(
                      'relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      isActive ? 'bg-emerald-500' : 'bg-slate-300',
                      isToggling && 'opacity-60 cursor-wait',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out',
                        isActive ? 'translate-x-4.5' : 'translate-x-0',
                      )}
                    />
                  </button>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200',
                    )}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Year Name & Description */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 flex items-center justify-center font-bold shrink-0 border border-violet-200/50 mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
                      {year.name}
                    </h4>
                    {year.isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        ★ Current Active
                      </span>
                    )}
                  </div>
                  {year.description && (
                    <p className="text-xs text-slate-400 mt-0.5 break-words">{year.description}</p>
                  )}
                  <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1">
                    🗓 {year.startDate ? format(new Date(year.startDate), 'MMM d, yyyy') : ''}{' '}
                    &mdash; {year.endDate ? format(new Date(year.endDate), 'MMM d, yyyy') : ''}
                  </p>
                </div>
              </div>

              {/* Mobile Actions Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 gap-2">
                <button
                  onClick={() => onView(year)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs border border-violet-100 hover:bg-violet-100 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-violet-600" /> View & Edit Details
                </button>

                {!year.isCurrent && (
                  <button
                    onClick={() => onSetCurrent(year.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1 shrink-0"
                    title="Set as Current"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-amber-600" /> Set Current
                  </button>
                )}

                <button
                  onClick={() => onDelete(year.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-100 hover:bg-rose-100 transition flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View - Shown on medium & large screens (>=640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table className="w-full min-w-[850px] border-collapse" role="table">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-gray-800 bg-slate-50/80 dark:bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
                    col.sortable &&
                      'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none',
                    col.className,
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1.5',
                      col.className?.includes('text-right') && 'justify-end',
                    )}
                  >
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium">
            {years.map((year) => (
              <tr
                key={year.id}
                className="hover:bg-violet-50/30 dark:hover:bg-gray-800/30 transition-all duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-4 text-sm text-slate-700 dark:text-slate-200',
                      col.className,
                    )}
                  >
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
    </div>
  );
}
