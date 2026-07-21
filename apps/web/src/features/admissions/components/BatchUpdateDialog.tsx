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
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AdmissionBatch } from '@/features/admissions/types/admission';

interface BatchUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBatchId?: string;
  batches: AdmissionBatch[];
  onConfirm: (newBatchId: string) => void;
  isUpdating?: boolean;
}

export function BatchUpdateDialog({
  open,
  onOpenChange,
  currentBatchId,
  batches,
  onConfirm,
  isUpdating = false,
}: BatchUpdateDialogProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(currentBatchId || '');

  useEffect(() => {
    if (open) {
      setSelectedBatchId(currentBatchId || '');
    }
  }, [open, currentBatchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Change Batch</DialogTitle>
          <DialogDescription>
            Select the new batch where this student enrollment should be transferred.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4 max-h-[250px] overflow-y-auto">
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-xl h-11"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl h-11 text-white bg-purple-600 hover:bg-purple-700"
            disabled={isUpdating || !selectedBatchId || selectedBatchId === currentBatchId}
            onClick={() => onConfirm(selectedBatchId)}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
