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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs text-[#0F172A] font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-200">
              <Sparkles className="h-5 w-5 text-[#0052CC]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0B2447]">Publish Course</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Review readiness before publishing{' '}
                <span className="font-extrabold text-[#0B2447]">{courseName}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest">
            Course Readiness
          </p>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium',
                  item.passed
                    ? 'bg-emerald-50/70 border border-emerald-100'
                    : item.blocking
                      ? 'bg-rose-50/70 border border-rose-100'
                      : 'bg-amber-50/70 border border-amber-100',
                )}
              >
                {item.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : item.blocking ? (
                  <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <span
                    className={cn(
                      'font-bold',
                      item.passed
                        ? 'text-emerald-900'
                        : item.blocking
                          ? 'text-rose-900'
                          : 'text-amber-900',
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-extrabold text-amber-800 mb-1 uppercase tracking-wider">
                {warnings.length} warning{warnings.length > 1 ? 's' : ''}
              </p>
              {warnings.map((w, i) => (
                <p key={i} className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  {w.label}
                </p>
              ))}
              <p className="text-[10px] text-amber-600 font-bold mt-1">
                You can still publish with these warnings.
              </p>
            </div>
          )}

          {blockingIssues.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-extrabold text-rose-800 mb-1 uppercase tracking-wider">
                {blockingIssues.length} blocking issue{blockingIssues.length > 1 ? 's' : ''}
              </p>
              {blockingIssues.map((b, i) => (
                <p key={i} className="text-[10px] text-rose-700 font-medium leading-relaxed">
                  {b.label}
                </p>
              ))}
              <p className="text-[10px] text-rose-600 font-bold mt-1">
                Fix these issues before publishing.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onCancel}
            disabled={isPublishing}
            className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onPublish}
            disabled={!canPublish || isPublishing}
            className={cn(
              'flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-extrabold transition-all shadow-2xs',
              canPublish
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
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
