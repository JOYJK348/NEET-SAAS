'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
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
  FolderOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { Branch } from '../../types';

interface BranchTableProps {
  branches: Branch[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  onStatusToggle?: (branch: Branch, newStatus: 'ACTIVE' | 'INACTIVE') => Promise<void> | void;
}

export function BranchTable({
  branches,
  onView,
  onEdit,
  onDelete,
  onStatusToggle,
}: BranchTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  return (
    <div className="w-full space-y-4 font-sans">
      {branches.map((branch) => {
        const isActive = branch.status === 'ACTIVE';
        const isToggling = togglingId === branch.id;
        const typeStr = branch.branchType ? branch.branchType.toUpperCase() : '';
        const isMain = typeStr.includes('MAIN');
        const isOnline = typeStr.includes('ONLINE') || typeStr.includes('VIRTUAL');

        return (
          <div
            key={branch.id}
            className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all hover:shadow-md hover:border-blue-300"
          >
            {/* ISML LMS Style Card Accordion Header */}
            <div className="p-4 sm:p-5 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2.5 rounded-xl bg-[#0052CC] text-white shadow-2xs shrink-0">
                  <Building2 className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                      {branch.code}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#0B2447] truncate">
                      {branch.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    <span>{branch.displayName || branch.name}</span>
                    {((branch as any).city || (branch as any).state) && (
                      <span className="text-slate-400">
                        {' '}
                        • {[(branch as any).city, (branch as any).state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Badges & Status Switch */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-between sm:justify-end">
                {/* Branch Type Badge */}
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5',
                    isMain
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : isOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200',
                  )}
                >
                  {isMain ? (
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  ) : isOnline ? (
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  )}
                  {branch.branchType ? branch.branchType.replace(/_/g, ' ') : 'Campus'}
                </span>

                {/* Interactive Status Switch & Pill */}
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
                    title={isActive ? 'Deactivate branch' : 'Activate branch'}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
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
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1',
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
              </div>
            </div>

            {/* Inner Details Card Grid */}
            <div className="p-4 sm:p-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Contact Info Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Contact Details
                  </span>
                  <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                    <span className="truncate">{branch.email || 'No email registered'}</span>
                  </p>
                  <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{branch.phone || 'No phone number'}</span>
                  </p>
                </div>

                {/* Location Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Location & Address
                  </span>
                  <p className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>
                      {[(branch as any).city, (branch as any).state].filter(Boolean).join(', ') ||
                        'Location N/A'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {(branch as any).address || 'Standard Institutional Campus Premises'}
                  </p>
                </div>

                {/* Campus Management Actions Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Branch Actions
                    </span>
                    <p className="text-xs font-bold text-[#0B2447]">Campus Control Node</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onView(branch)}
                      className="px-3 py-1.5 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Open Campus
                    </button>
                    <button
                      onClick={() => onDelete(branch)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
