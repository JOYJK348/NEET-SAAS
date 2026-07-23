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
import { Loader2, AlertTriangle } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Change Batch</DialogTitle>
          <DialogDescription>
            Select the new batch where this student enrollment should be transferred.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2 max-h-[200px] overflow-y-auto">
          {batches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:border-purple-300 transition-colors',
                selectedBatchId === batch.id
                  ? 'border-purple-500 bg-purple-50/50'
                  : 'border-gray-200',
              )}
            >
              <div className="text-sm font-medium text-gray-900">{batch.name}</div>
              <div
                className={cn(
                  'h-4 w-4 rounded-full border flex items-center justify-center',
                  selectedBatchId === batch.id
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300',
                )}
              >
                {selectedBatchId === batch.id && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timetable Conflict Warning */}
        {checking && (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

        <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 pt-3">
          <Button
            variant="outline"
            className="rounded-xl h-11"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating || checking}
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'rounded-xl h-11 text-white transition-all',
              hasConflict ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-700',
            )}
            disabled={
              isUpdating || checking || !selectedBatchId || selectedBatchId === currentBatchId
            }
            onClick={() => onConfirm(selectedBatchId)}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : hasConflict ? (
              'Update Anyway'
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
