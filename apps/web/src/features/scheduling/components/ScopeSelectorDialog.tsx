'use client';

import { Calendar, Repeat, RefreshCw, X } from 'lucide-react';
import type { OverrideScope } from '../services/schedule-service';

interface ScopeSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: OverrideScope) => void;
  selectedScope: OverrideScope;
  onScopeChange: (scope: OverrideScope) => void;
  loading?: boolean;
  actionLabel?: string; // e.g. "Cancel Class", "Apply Changes"
}

const SCOPE_OPTIONS: {
  value: OverrideScope;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}[] = [
  {
    value: 'ONLY_THIS',
    label: 'Only this session',
    description: 'Changes apply to this one class only.',
    icon: Calendar,
  },
  {
    value: 'THIS_AND_FUTURE',
    label: 'This and future sessions',
    description:
      'This class and all upcoming classes in the series will be updated. Past classes remain unchanged.',
    icon: Repeat,
  },
  {
    value: 'ENTIRE_SERIES',
    label: 'Entire recurring schedule',
    description:
      'Every session in this recurring series — past and future — will reflect the change.',
    icon: RefreshCw,
  },
];

export function ScopeSelectorDialog({
  open,
  onClose,
  onConfirm,
  selectedScope,
  onScopeChange,
  loading,
  actionLabel = 'Apply Changes',
}: ScopeSelectorDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Apply changes to</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose the scope of this update</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope options */}
        <div className="px-6 py-4 space-y-3">
          {SCOPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedScope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onScopeChange(option.value)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                {/* Radio indicator */}
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`}
                    />
                    <span
                      className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-slate-700'}`}
                    >
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedScope)}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
