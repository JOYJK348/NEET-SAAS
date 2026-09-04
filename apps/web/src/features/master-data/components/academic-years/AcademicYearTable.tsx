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
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AcademicYear } from '../../types';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full space-y-3.5 font-sans">
      {years.map((year) => {
        const isActive = year.isActive;
        const isToggling = togglingId === year.id;
        const isExpanded = expandedId === year.id;

        return (
          <div
            key={year.id}
            className={cn(
              'bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200',
              year.isCurrent && 'border-amber-300 ring-1 ring-amber-400/20',
            )}
          >
            {/* Card Header Accordion Bar */}
            <div
              onClick={() => toggleExpand(year.id)}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors"
            >
              {/* Left Info Box */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#0052CC]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
                      {year.code}
                    </span>

                    {year.isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        Current Active Session
                      </span>
                    )}

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border',
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
                        'Inactive'
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-[#0B2447] leading-snug truncate">
                    {year.name}
                  </h3>
                </div>
              </div>

              {/* Right Controls & Accordion Trigger */}
              <div
                className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Interactive iOS Toggle Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 hidden md:inline">
                    Status:
                  </span>
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
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0052CC]',
                      isActive ? 'bg-emerald-500' : 'bg-slate-300',
                      isToggling && 'opacity-60 cursor-wait',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out',
                        isActive ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onView(year)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-[#0052CC] hover:bg-blue-100 font-extrabold text-xs border border-blue-200 transition-all shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  {!year.isCurrent && (
                    <button
                      onClick={() => onSetCurrent(year.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Set as Current Active Session"
                    >
                      <CalendarCheck className="w-4 h-4 text-amber-600" />
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(year.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Academic Year"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleExpand(year.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#0052CC]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion Expandable Content Body */}
            {isExpanded && (
              <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Duration Calendar
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Clock className="w-4 h-4 text-[#0052CC] shrink-0" />
                    <span>
                      {year.startDate ? format(new Date(year.startDate), 'MMM d, yyyy') : 'Not set'}{' '}
                      &mdash;{' '}
                      {year.endDate ? format(new Date(year.endDate), 'MMM d, yyyy') : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Session Description / Remarks
                  </span>
                  <p className="text-slate-800 font-bold truncate">
                    {year.description || 'Standard academic session cycle.'}
                  </p>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Session Status
                  </span>
                  <p className="text-slate-800 font-bold">
                    {year.isCurrent
                      ? 'Primary Active Academic Session'
                      : year.isActive
                        ? 'Active Regular Session'
                        : 'Inactive / Archived Session'}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
