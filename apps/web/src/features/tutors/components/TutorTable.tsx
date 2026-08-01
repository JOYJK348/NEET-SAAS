'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Eye,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  Users,
  XCircle,
  Award,
} from 'lucide-react';

function getInitials(tutor: any): string {
  const first = tutor.firstName?.[0] || '';
  const last = tutor.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'T';
}

function getDisplayName(tutor: any): string {
  return `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Unknown Faculty';
}

interface TutorTableProps {
  tutors: any[];
  subjectMap: Map<string, string>;
  branchMap?: Map<string, string>;
  onView: (tutor: any) => void;
  onEdit?: (tutor: any) => void;
  onDelete?: (tutor: any) => Promise<void> | void;
  onStatusChange: (id: string, status: string) => void;
  isLoading?: boolean;
}

export function TutorTable({
  tutors,
  subjectMap,
  branchMap,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}: TutorTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleDeleteClick = (tutor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(tutor.id);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(null);
  };

  const handleDeleteConfirm = async (tutor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setDeletingId(tutor.id);
    setPendingDeleteId(null);
    try {
      await onDelete(tutor);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async (tutor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = tutor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdatingStatusId(tutor.id);
    try {
      await onStatusChange(tutor.id, newStatus);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-2">
        <div className="w-6 h-6 rounded-full bg-violet-600 animate-ping mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Loading faculty directory table...</p>
      </div>
    );
  }

  if (tutors.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[580px] rounded-2xl border border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm relative scrollbar-thin">
      <table className="w-full min-w-[950px] border-collapse" role="table">
        <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-gray-800/95 backdrop-blur-md">
          <tr className="border-b border-[#E5E7EB] dark:border-gray-800 shadow-2xs">
            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faculty Info
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Subjects Handled
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Branches / Centers
            </th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              Batches
            </th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium">
          {tutors.map((tutor, index) => {
            const isActive = tutor.status === 'ACTIVE';
            const isUpdating = updatingStatusId === tutor.id;
            const isPendingDelete = pendingDeleteId === tutor.id;
            const isDeleting = deletingId === tutor.id;

            return (
              <tr
                key={tutor.id ? `${tutor.id}-${index}` : `tutor-row-${index}`}
                onClick={() => onView(tutor)}
                className="hover:bg-violet-50/30 dark:hover:bg-gray-800/30 transition-all duration-150 cursor-pointer"
              >
                {/* Faculty Info */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 border border-violet-200/60">
                      {getInitials(tutor)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {getDisplayName(tutor)}
                        </p>
                        {tutor.employeeCode && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-mono font-bold text-[10px] border border-violet-100 shrink-0">
                            {tutor.employeeCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{tutor.email}</span>
                      </p>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-3.5">
                  <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {tutor.phone || 'N/A'}
                  </span>
                </td>

                {/* Subjects */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {tutor.subjects && tutor.subjects.length > 0 ? (
                      tutor.subjects.map((sub: any, sIdx: number) => {
                        const sName =
                          subjectMap.get(sub.subjectId || sub.id) || sub.name || 'Subject';
                        return (
                          <span
                            key={
                              sub.id || sub.subjectId
                                ? `${sub.id || sub.subjectId}-${sIdx}`
                                : `sub-${sIdx}`
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[11px]"
                          >
                            <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{sName}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">No subjects</span>
                    )}
                  </div>
                </td>

                {/* Branches */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {tutor.branches && tutor.branches.length > 0 ? (
                      tutor.branches.map((br: any, bIdx: number) => {
                        const bName = branchMap?.get(br.branchId || br.id) || br.name || 'Branch';
                        return (
                          <span
                            key={
                              br.id || br.branchId
                                ? `${br.id || br.branchId}-${bIdx}`
                                : `br-${bIdx}`
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]"
                          >
                            <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                            <span>{bName}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">All Branches</span>
                    )}
                  </div>
                </td>

                {/* Batches Count */}
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs">
                    <Users className="w-3 h-3 text-slate-500" />
                    {tutor.batchCount || tutor.batches?.length || 0}
                  </span>
                </td>

                {/* Status Toggle */}
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleStatusToggle(tutor, e)}
                      disabled={isUpdating}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        isActive ? 'bg-emerald-500' : 'bg-slate-300',
                        isUpdating && 'opacity-60 cursor-wait',
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
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200',
                      )}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!isPendingDelete && !isDeleting && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(tutor);
                        }}
                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}

                    {onDelete && !isPendingDelete && !isDeleting && (
                      <button
                        onClick={(e) => handleDeleteClick(tutor, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete tutor"
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
                          onClick={(e) => handleDeleteConfirm(tutor, e)}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
