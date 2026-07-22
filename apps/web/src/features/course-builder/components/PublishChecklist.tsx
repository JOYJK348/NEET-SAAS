'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  label: string;
  passed: boolean;
  blocking: boolean;
}

interface PublishChecklistProps {
  courseName: string;
  items: ChecklistItem[];
  onPublish: () => void;
  onCancel: () => void;
  isPublishing?: boolean;
}

export function PublishChecklist({
  courseName,
  items,
  onPublish,
  onCancel,
  isPublishing,
}: PublishChecklistProps) {
  const blockingIssues = useMemo(() => items.filter((i) => !i.passed && i.blocking), [items]);
  const warnings = useMemo(() => items.filter((i) => !i.passed && !i.blocking), [items]);
  const canPublish = blockingIssues.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-violet-100">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Publish Course</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review readiness before publishing{' '}
                <span className="font-semibold text-gray-700">{courseName}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Course Readiness
          </p>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs',
                  item.passed
                    ? 'bg-emerald-50/50'
                    : item.blocking
                      ? 'bg-red-50/50'
                      : 'bg-amber-50/50',
                )}
              >
                {item.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : item.blocking ? (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <span
                    className={cn(
                      'font-semibold',
                      item.passed
                        ? 'text-emerald-800'
                        : item.blocking
                          ? 'text-red-800'
                          : 'text-amber-800',
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-amber-700 mb-1">
                {warnings.length} warning{warnings.length > 1 ? 's' : ''}
              </p>
              {warnings.map((w, i) => (
                <p key={i} className="text-[10px] text-amber-600 leading-relaxed">
                  {w.label}
                </p>
              ))}
              <p className="text-[10px] text-amber-500 mt-1">
                You can still publish with these warnings.
              </p>
            </div>
          )}

          {blockingIssues.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-red-700 mb-1">
                {blockingIssues.length} blocking issue{blockingIssues.length > 1 ? 's' : ''}
              </p>
              {blockingIssues.map((b, i) => (
                <p key={i} className="text-[10px] text-red-600 leading-relaxed">
                  {b.label}
                </p>
              ))}
              <p className="text-[10px] text-red-500 mt-1">Fix these issues before publishing.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPublishing}
            className="h-9 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onPublish}
            disabled={!canPublish || isPublishing}
            className={cn(
              'flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-bold transition-all shadow-lg',
              canPublish
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {blockingIssues.length > 0 ? 'Blocked' : 'Publish'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
