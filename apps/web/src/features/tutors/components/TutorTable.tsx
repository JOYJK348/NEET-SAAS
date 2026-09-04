'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Eye,
  Trash2,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  Users,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [tutorToDelete, setTutorToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleDeleteClick = (tutor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTutorToDelete(tutor);
  };

  const handleDeleteConfirm = async () => {
    if (!tutorToDelete || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(tutorToDelete);
      setTutorToDelete(null);
    } finally {
      setIsDeleting(false);
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
        <div className="w-6 h-6 rounded-full bg-[#0052CC] animate-ping mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Loading faculty directory table...</p>
      </div>
    );
  }

  if (tutors.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs relative">
        <table className="w-full border-collapse table-auto" role="table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Faculty Info
              </th>
              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Subjects Handled
              </th>
              <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Branches / Centers
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Batches
              </th>
              <th className="px-4 py-3 text-center text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tutors.map((tutor, index) => {
              const isActive = tutor.status === 'ACTIVE';
              const isUpdating = updatingStatusId === tutor.id;

              return (
                <tr
                  key={tutor.id ? `${tutor.id}-${index}` : `tutor-row-${index}`}
                  onClick={() => onView(tutor)}
                  className="hover:bg-blue-50/30 transition-all duration-150 cursor-pointer"
                >
                  {/* Faculty Info with Email & Phone */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-extrabold text-xs shrink-0 border border-blue-200">
                        {getInitials(tutor)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-sm text-[#0B2447] truncate">
                            {getDisplayName(tutor)}
                          </p>
                          {tutor.employeeCode && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] font-mono font-extrabold text-[10px] border border-blue-200 shrink-0">
                              {tutor.employeeCode}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col text-xs text-slate-500 mt-0.5 space-y-0.5">
                          <p className="truncate flex items-center gap-1 font-medium">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{tutor.email}</span>
                          </p>
                          {tutor.phone && (
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{tutor.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Subjects */}
                  <td className="px-4 py-3">
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
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-extrabold text-[11px]"
                            >
                              <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                              <span>{sName}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">
                          No subjects
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Branches */}
                  <td className="px-4 py-3">
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
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] border border-blue-200 font-extrabold text-[11px]"
                            >
                              <MapPin className="w-3 h-3 text-[#0052CC] shrink-0" />
                              <span>{bName}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">
                          All Branches
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Batches Count */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200">
                      <Users className="w-3 h-3 text-slate-500" />
                      {tutor.batchCount || tutor.batches?.length || 0}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleStatusToggle(tutor, e)}
                        disabled={isUpdating}
                        className={cn(
                          'relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-100',
                          isActive ? 'bg-emerald-500' : 'bg-slate-300',
                          isUpdating && 'opacity-60 cursor-wait',
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
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(tutor);
                        }}
                        className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {onDelete && (
                        <button
                          onClick={(e) => handleDeleteClick(tutor, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
                          title="Delete tutor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Responsive Delete Confirmation Dialog Modal */}
      <Dialog open={!!tutorToDelete} onOpenChange={(open) => !open && setTutorToDelete(null)}>
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
                Delete Faculty Record
              </DialogTitle>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <DialogDescription className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to delete{' '}
              <span className="font-extrabold text-[#0B2447]">
                {tutorToDelete ? getDisplayName(tutorToDelete) : 'this faculty member'}
              </span>
              ? This action cannot be undone and will remove their assigned batches, course mapping,
              and profile.
            </DialogDescription>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed text-[11px]">
                Warning: Permanent deletion cannot be reverted. Make sure you intend to remove this
                faculty record.
              </span>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-slate-100 mt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs px-4"
                onClick={() => setTutorToDelete(null)}
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
                  'Delete Faculty'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
