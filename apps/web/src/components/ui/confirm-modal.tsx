'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CalendarCheck, Loader2, X } from 'lucide-react';
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
      badgeBg: 'bg-rose-50 text-rose-600 border-rose-200/80 ring-4 ring-rose-500/10',
      btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg shadow-rose-500/25',
      defaultBtnText: 'Delete Permanently',
    },
    warning: {
      icon: AlertTriangle,
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-200/80 ring-4 ring-amber-500/10',
      btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25',
      defaultBtnText: 'Proceed',
    },
    primary: {
      icon: CalendarCheck,
      badgeBg: 'bg-violet-50 text-violet-600 border-violet-200/80 ring-4 ring-violet-500/10',
      btnBg: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25',
      defaultBtnText: 'Confirm Action',
    },
  }[variant];

  const IconComponent = iconConfig.icon;
  const btnText = confirmText || iconConfig.defaultBtnText;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && onClose()}>
      <DialogContent className="max-w-md w-full rounded-3xl p-5 sm:p-6 bg-white border border-slate-100 shadow-2xl space-y-4">
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-slate-200/90 rounded-full mx-auto -mt-1 sm:hidden" />

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shrink-0 shadow-xs transition-transform duration-200',
              iconConfig.badgeBg,
            )}
          >
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {title}
            </DialogTitle>
            {itemName && (
              <div className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 font-mono font-extrabold text-xs text-slate-800 truncate max-w-full">
                {itemName}
              </div>
            )}
          </div>
        </div>

        {/* Description Body */}
        <DialogDescription asChild>
          <div className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/60">
            {description}
          </div>
        </DialogDescription>

        {/* Action Buttons Footer - Stacked on Mobile for Effortless Thumb Target */}
        <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-2.5 pt-1">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isBusy}
            className={cn(
              'w-full sm:w-auto flex-1 rounded-2xl text-xs sm:text-xs font-black h-11 sm:h-11 transition-all active:scale-95 cursor-pointer',
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

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto flex-1 rounded-2xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-98 h-11 sm:h-11"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
