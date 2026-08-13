'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CalendarCheck, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: React.ReactNode;
  itemName?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  variant = 'danger',
  confirmText,
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmActionModalProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = isLoading || submitting;

  const iconConfig = {
    danger: {
      icon: Trash2,
      badgeBg: 'bg-rose-100 text-rose-600 border-rose-200',
      btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-200',
      defaultBtnText: 'Delete Permanently',
    },
    warning: {
      icon: AlertTriangle,
      badgeBg: 'bg-amber-100 text-amber-600 border-amber-200',
      btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-200',
      defaultBtnText: 'Proceed',
    },
    primary: {
      icon: CalendarCheck,
      badgeBg: 'bg-violet-100 text-violet-600 border-violet-200',
      btnBg: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-200',
      defaultBtnText: 'Confirm Action',
    },
  }[variant];

  const IconComponent = iconConfig.icon;
  const btnText = confirmText || iconConfig.defaultBtnText;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl space-y-4">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 shadow-xs',
              iconConfig.badgeBg,
            )}
          >
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <DialogTitle className="text-lg font-black text-slate-900 leading-snug">
              {title}
            </DialogTitle>
            {itemName && (
              <div className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-xs text-slate-800 truncate max-w-full">
                {itemName}
              </div>
            )}
          </div>
        </div>

        {/* Description Body */}
        <DialogDescription className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
          {description}
        </DialogDescription>

        {/* Action Buttons Footer */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 h-11"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isBusy}
            className={cn(
              'w-full sm:w-auto flex-1 rounded-xl text-xs font-black h-11 transition-all active:scale-98 cursor-pointer',
              iconConfig.btnBg,
            )}
          >
            {isBusy ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span>{btnText}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
