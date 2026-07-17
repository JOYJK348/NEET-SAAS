'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Archive, Loader2 } from 'lucide-react';

interface StudentArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onConfirm: () => Promise<void>;
  isArchiving?: boolean;
}

export function StudentArchiveDialog({
  open,
  onOpenChange,
  studentName,
  onConfirm,
  isArchiving = false,
}: StudentArchiveDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isArchiving || internalLoading;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Archive Student</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to archive{' '}
            <span className="font-semibold text-foreground">{studentName}</span>? This will change
            their status to &quot;Dropped Out&quot; and they will be moved to the archived list.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            This action can be undone by changing the student&apos;s status back to active.
          </span>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {loading ? 'Archiving...' : 'Archive Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
