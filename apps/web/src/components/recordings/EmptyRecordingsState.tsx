'use client';

import { FileVideo, RefreshCw } from 'lucide-react';

interface EmptyRecordingsStateProps {
  hasFilters?: boolean;
  onReset?: () => void;
  title?: string;
  message?: string;
}

export function EmptyRecordingsState({
  hasFilters,
  onReset,
  title,
  message,
}: EmptyRecordingsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
      <div className="p-4 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
        <FileVideo className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-extrabold text-slate-900">
        {title ?? 'No recordings found'}
      </h3>
      <p className="text-sm text-slate-500 max-w-md">
        {message ??
          (hasFilters
            ? 'No recordings match the current search or filters. Try adjusting your keywords or clearing filters.'
            : 'Scheduled live classes with "Auto Record" enabled will appear here automatically after the session ends.')}
      </p>
      {hasFilters && onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Clear filters
        </button>
      )}
    </div>
  );
}
