'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import type { Branch } from '../../types';

interface DeleteBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteBranchModal({
  open,
  onOpenChange,
  branch,
  onConfirm,
  isDeleting = false,
}: DeleteBranchModalProps) {
  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4 font-sans">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <DialogTitle className="text-lg font-extrabold text-[#0B2447]">
            Delete Campus Branch?
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-slate-800 font-bold">&quot;{branch.name}&quot;</strong> (
            {branch.code})? This action will remove the campus record from the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Deleting a branch will unlink associated courses and active student batch assignments.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold text-slate-700 border-slate-300"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-2xs px-4"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Confirm Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
