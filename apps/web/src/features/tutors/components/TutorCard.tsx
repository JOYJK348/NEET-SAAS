'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Mail, Phone, BookOpen, MapPin, Users, Eye, Trash2, Check, X } from 'lucide-react';

function getInitials(tutor: any): string {
  const first = tutor.firstName?.[0] || '';
  const last = tutor.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'T';
}

function getDisplayName(tutor: any): string {
  return `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Unknown Faculty';
}

interface TutorCardProps {
  tutor: any;
  subjectMap: Map<string, string>;
  branchMap?: Map<string, string>;
  onView: (tutor: any) => void;
  onEdit?: (tutor: any) => void;
  onDelete?: (tutor: any) => Promise<void> | void;
  onStatusChange: (id: string, status: string) => void;
}

export function TutorCard({
  tutor,
  subjectMap,
  branchMap,
  onView,
  onDelete,
  onStatusChange,
}: TutorCardProps) {
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isActive = tutor.status === 'ACTIVE';

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(tutor.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setIsDeleting(true);
    setIsPendingDelete(false);
    try {
      await onDelete(tutor);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onView(tutor)}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs hover:border-violet-300 transition-all duration-200 space-y-3 cursor-pointer"
    >
      {/* Top Header: Avatar, Name, Employee Code Badge & Status Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 font-extrabold text-sm flex items-center justify-center border border-violet-200/60 shrink-0">
            {getInitials(tutor)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 truncate">{getDisplayName(tutor)}</h3>
              {tutor.employeeCode && (
                <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 font-mono font-bold text-[10px] border border-violet-100 shrink-0">
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

        {/* Status Switch */}
        <button
          type="button"
          onClick={handleStatusToggle}
          disabled={isUpdatingStatus}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            isActive ? 'bg-emerald-500' : 'bg-slate-300',
            isUpdatingStatus && 'opacity-60 cursor-wait',
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

      {/* Contact & Batches Pill Row */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 font-semibold text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{tutor.phone || 'No phone'}</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
          <Users className="w-3 h-3 text-slate-500" />
          {tutor.batchCount || tutor.batches?.length || 0} Batches
        </span>
      </div>

      {/* Subjects & Branches Badges */}
      <div className="space-y-1.5 pt-1">
        {/* Subjects */}
        <div className="flex flex-wrap gap-1">
          {tutor.subjects && tutor.subjects.length > 0 ? (
            tutor.subjects.map((sub: any) => {
              const sName = subjectMap.get(sub.subjectId || sub.id) || sub.name || 'Subject';
              return (
                <span
                  key={sub.id || sub.subjectId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px]"
                >
                  <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                  <span>{sName}</span>
                </span>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 italic">No subjects assigned</span>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200',
          )}
        >
          {isActive ? 'Active Faculty' : 'Inactive'}
        </span>

        <div className="flex items-center gap-2">
          {!isPendingDelete && !isDeleting && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(tutor);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs hover:bg-violet-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-violet-600" />
              <span>View</span>
            </button>
          )}

          {onDelete && !isPendingDelete && !isDeleting && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPendingDelete(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete tutor"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {isDeleting && (
            <span className="text-xs font-bold text-rose-500 animate-pulse">Deleting...</span>
          )}

          {isPendingDelete && (
            <div className="flex items-center gap-1 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-rose-600">Delete?</span>
              <button
                onClick={handleDeleteConfirm}
                className="p-1.5 text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPendingDelete(false);
                }}
                className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
