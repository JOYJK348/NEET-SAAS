'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit2,
  Trash2,
  Eye,
  Building2,
  MapPin,
  Mail,
  Phone,
  Radio,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Branch } from '../../types';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface BranchTableProps {
  branches: Branch[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
  onStatusToggle?: (branch: Branch, newStatus: 'ACTIVE' | 'INACTIVE') => Promise<void> | void;
}

export function BranchTable({
  branches,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onStatusToggle,
}: BranchTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const columns: Column<Branch>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, branch) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 font-mono font-bold text-xs border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40">
          {branch.code}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'name',
      header: 'Branch Name & Details',
      sortable: true,
      render: (_, branch) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/50 dark:to-indigo-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold shrink-0 border border-violet-200/50 dark:border-violet-800/40">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {branch.name}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">
              {branch.displayName || branch.name}
              {((branch as any).city || (branch as any).state) && (
                <span className="ml-1 text-slate-400">
                  • {[(branch as any).city, (branch as any).state].filter(Boolean).join(', ')}
                </span>
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'branchType',
      header: 'Type',
      sortable: true,
      render: (_, branch) => {
        const typeStr = branch.branchType.toUpperCase();
        const isMain = typeStr.includes('MAIN');
        const isOnline = typeStr.includes('ONLINE') || typeStr.includes('VIRTUAL');

        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
              isMain
                ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/40'
                : isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40',
            )}
          >
            {isMain ? (
              <Building2 className="w-3.5 h-3.5 text-sky-500" />
            ) : isOnline ? (
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-purple-500" />
            )}
            {branch.branchType.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (_, branch) => (
        <div className="space-y-0.5 text-xs">
          {branch.email ? (
            <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{branch.email}</span>
            </p>
          ) : null}
          {branch.phone ? (
            <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{branch.phone}</span>
            </p>
          ) : null}
          {!branch.email && !branch.phone && (
            <span className="text-slate-400 italic">No contact info</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, branch) => {
        const isActive = branch.status === 'ACTIVE';
        const isToggling = togglingId === branch.id;

        return (
          <div className="flex items-center gap-2.5">
            {/* Interactive iOS Style Toggle Switch */}
            <button
              type="button"
              disabled={isToggling}
              onClick={async (e) => {
                e.stopPropagation();
                if (onStatusToggle) {
                  setTogglingId(branch.id);
                  try {
                    await onStatusToggle(branch, isActive ? 'INACTIVE' : 'ACTIVE');
                  } finally {
                    setTogglingId(null);
                  }
                }
              }}
              title={isActive ? 'Click to deactivate branch' : 'Click to activate branch'}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
                isToggling && 'opacity-60 cursor-wait',
              )}
            >
              <span className="sr-only">Toggle branch status</span>
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
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40',
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
      render: (_, branch) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onView(branch)}
            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-xl transition-all"
            title={`View ${branch.name} details`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(branch.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
            title={`Delete ${branch.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-24 text-right',
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
        {branches.map((branch) => {
          const isActive = branch.status === 'ACTIVE';
          const isToggling = togglingId === branch.id;
          const typeStr = branch.branchType.toUpperCase();
          const isMain = typeStr.includes('MAIN');
          const isOnline = typeStr.includes('ONLINE') || typeStr.includes('VIRTUAL');

          return (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 transition-all hover:border-violet-300"
            >
              {/* Mobile Card Header: Code & Interactive Status Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 font-mono font-bold text-xs border border-violet-100">
                  {branch.code}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (onStatusToggle) {
                        setTogglingId(branch.id);
                        try {
                          await onStatusToggle(branch, isActive ? 'INACTIVE' : 'ACTIVE');
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

              {/* Branch Name & Details */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 flex items-center justify-center font-bold shrink-0 border border-violet-200/50 mt-0.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
                    {branch.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 break-words">
                    {branch.displayName || branch.name}
                  </p>
                  {((branch as any).city || (branch as any).state) && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      📍 {[(branch as any).city, (branch as any).state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Type Badge & Contact Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border',
                    isMain
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : isOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200',
                  )}
                >
                  {isMain ? (
                    <Building2 className="w-3 h-3 text-sky-500" />
                  ) : isOnline ? (
                    <Radio className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <MapPin className="w-3 h-3 text-purple-500" />
                  )}
                  {branch.branchType.replace(/_/g, ' ')}
                </span>

                <div className="text-[11px] text-slate-600 space-y-0.5 text-right">
                  {branch.email && (
                    <p className="flex items-center gap-1 justify-end font-medium">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{branch.email}</span>
                    </p>
                  )}
                  {branch.phone && (
                    <p className="flex items-center gap-1 justify-end text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile Action Buttons Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 gap-2">
                <button
                  onClick={() => onView(branch)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs border border-violet-100 hover:bg-violet-100 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-violet-600" /> View & Edit Details
                </button>

                <button
                  onClick={() => onDelete(branch.id)}
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
            {branches.map((branch) => (
              <tr
                key={branch.id}
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
                      ? col.render(branch[col.key as keyof Branch], branch)
                      : String(branch[col.key as keyof Branch] || '')}
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
