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
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { AdmissionStatus } from '@/features/admissions/types/admission';

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: AdmissionStatus;
  admissionNumber: string;
  onConfirm: (newStatus: AdmissionStatus) => void;
  isUpdating?: boolean;
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  admissionNumber,
  onConfirm,
  isUpdating = false,
}: StatusUpdateDialogProps) {
  // Toggle: ACTIVE → INACTIVE, INACTIVE → ACTIVE
  const newStatus: AdmissionStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const isDeactivating = currentStatus === 'ACTIVE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isDeactivating ? 'Deactivate' : 'Activate'} Admission</DialogTitle>
          <DialogDescription>
            {isDeactivating
              ? `Deactivate admission ${admissionNumber}? The student will be removed from batch.`
              : `Re-activate admission ${admissionNumber}? Student can be re-enrolled.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-6">
          {isDeactivating ? (
            <ToggleLeft className="h-8 w-8 text-red-500" />
          ) : (
            <ToggleRight className="h-8 w-8 text-green-500" />
          )}
          <span
            className={cn(
              'text-lg font-semibold',
              isDeactivating ? 'text-red-600' : 'text-green-600',
            )}
          >
            {isDeactivating ? 'Set Cancelled' : 'Set Active'}
          </span>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-11 flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'rounded-xl h-11 flex-1 text-white',
              isDeactivating ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700',
            )}
            disabled={isUpdating}
            onClick={() => onConfirm(newStatus)}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : isDeactivating ? (
              'Cancel Admission'
            ) : (
              'Activate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
