'use client';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AdmissionBatch } from '@/features/admissions/types/admission';
import { useCheckEnrollmentConflict } from '@/features/scheduling/hooks/use-schedules';
import { ConflictResult } from '@/features/scheduling/types/schedule.types';

interface BatchUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBatchId?: string;
  batches: AdmissionBatch[];
  onConfirm: (newBatchId: string) => void;
  isUpdating?: boolean;
  studentProfileId?: string;
  excludeAdmissionId?: string;
}

export function BatchUpdateDialog({
  open,
  onOpenChange,
  currentBatchId,
  batches,
  onConfirm,
  isUpdating = false,
  studentProfileId,
  excludeAdmissionId,
}: BatchUpdateDialogProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(currentBatchId || '');
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);

  const { mutate: runCheck, isPending: checking } = useCheckEnrollmentConflict();

  useEffect(() => {
    if (open) {
      setSelectedBatchId(currentBatchId || '');
      setConflictResult(null);
    }
  }, [open, currentBatchId]);

  // Run conflict check whenever the selected batch changes
  useEffect(() => {
    if (open && selectedBatchId && selectedBatchId !== currentBatchId && studentProfileId) {
      runCheck(
        {
          studentProfileId,
          newBatchId: selectedBatchId,
          excludeAdmissionId,
        },
        {
          onSuccess: (result) => {
            setConflictResult(result);
          },
        },
      );
    } else {
      setConflictResult(null);
    }
  }, [selectedBatchId, open, currentBatchId, studentProfileId, excludeAdmissionId, runCheck]);

  const hasConflict = conflictResult?.hasConflict ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white p-0 overflow-hidden border border-slate-200 shadow-xl">
        {/* ISML LMS Style Light Blue Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 border-b border-blue-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5 text-[#0052CC]" />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-mono font-extrabold text-[#0052CC] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                BATCH TRANSFER
              </span>
            </div>
            <DialogTitle className="text-base font-extrabold text-[#0B2447] leading-snug">
              Change Student Batch Allocation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium mt-0.5">
              Select the new batch where this student enrollment should be transferred.
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
            {batches.map((batch) => {
              const isSelected = selectedBatchId === batch.id;
              return (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={cn(
                    'flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all shadow-2xs',
                    isSelected
                      ? 'border-[#0052CC] bg-blue-50/60 ring-1 ring-[#0052CC]/20'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50',
                  )}
                >
                  <div className="space-y-0.5">
                    <span
                      className={cn(
                        'text-xs font-extrabold block',
                        isSelected ? 'text-[#0052CC]' : 'text-[#0B2447]',
                      )}
                    >
                      {batch.name}
                    </span>
                    {batch.id === currentBatchId && (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                        Current Batch
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all shrink-0',
                      isSelected ? 'border-[#0052CC] bg-[#0052CC]' : 'border-slate-300 bg-white',
                    )}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timetable Conflict Warning */}
          {checking && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-slate-500 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0052CC]" />
              <span>Checking timetable compatibility...</span>
            </div>
          )}

          {!checking && hasConflict && conflictResult && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Timetable Conflict Warning
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-700/90 pl-1">
                {conflictResult.conflicts.map((c, i) => (
                  <li key={i} className="leading-relaxed">
                    {c.message}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-600 font-semibold pt-1">
                Saving this change will overlap with the student's existing classes.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3 border-t border-slate-100 mt-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs px-4"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating || checking}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={cn(
                'rounded-xl h-10 text-white font-extrabold text-xs px-5 shadow-2xs transition-all',
                hasConflict ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#0052CC] hover:bg-blue-700',
              )}
              disabled={
                isUpdating || checking || !selectedBatchId || selectedBatchId === currentBatchId
              }
              onClick={() => onConfirm(selectedBatchId)}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Updating...
                </>
              ) : hasConflict ? (
                'Update Anyway'
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
