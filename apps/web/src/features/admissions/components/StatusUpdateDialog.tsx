'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight } from 'lucide-react';
import { AdmissionStatusBadge } from './AdmissionStatusBadge';
import type { AdmissionStatus } from '@/features/admissions/types/admission';
import { ADMISSION_STATUS_LABELS, VALID_TRANSITIONS } from '@/features/admissions/types/admission';

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: AdmissionStatus;
  admissionNumber: string;
  onConfirm: (newStatus: AdmissionStatus, notes?: string) => void;
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
  const [selectedStatus, setSelectedStatus] = useState<AdmissionStatus | null>(null);
  const [notes, setNotes] = useState('');
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus, notes || undefined);
      setSelectedStatus(null);
      setNotes('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedStatus(null);
      setNotes('');
    }
    onOpenChange(newOpen);
  };

  if (allowedTransitions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Update Admission Status</DialogTitle>
          <DialogDescription>
            Change status for <span className="font-medium text-gray-900">{admissionNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 py-3">
            <AdmissionStatusBadge status={currentStatus} />
            <ArrowRight className="h-5 w-5 text-gray-400" />
            {selectedStatus ? (
              <AdmissionStatusBadge status={selectedStatus} />
            ) : (
              <span className="text-sm text-gray-400">Select new status</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {allowedTransitions.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                className={cn(
                  'rounded-xl h-11 px-5',
                  selectedStatus === status && 'bg-purple-600 hover:bg-purple-700 text-white',
                )}
                onClick={() => setSelectedStatus(status)}
              >
                {ADMISSION_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a reason or note for this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-11 flex-1"
            onClick={() => handleOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl h-11 flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!selectedStatus || isUpdating}
            onClick={handleConfirm}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
