'use client';

import { Search, X } from 'lucide-react';

export interface RecordingFiltersState {
  search: string;
  /** 'ALL' | 'Ready' | 'Processing' | 'Failed' */
  status: string;
  /** 'ALL' | subjectId */
  subjectId: string;
  /** 'ALL' | batchId */
  batchId: string;
}

export const EMPTY_RECORDING_FILTERS: RecordingFiltersState = {
  search: '',
  status: 'ALL',
  subjectId: 'ALL',
  batchId: 'ALL',
};

interface RecordingsFiltersProps {
  filters: RecordingFiltersState;
  onChange: (patch: Partial<RecordingFiltersState>) => void;
  onClear: () => void;
  subjects: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'Ready', label: 'Ready' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Failed', label: 'Failed' },
];

const selectClass =
  'w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors appearance-none cursor-pointer';

export function RecordingsFilters({
  filters,
  onChange,
  onClear,
  subjects,
  batches,
}: RecordingsFiltersProps) {
  const hasFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.subjectId !== 'ALL' ||
    filters.batchId !== 'ALL';

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by class title…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-bold focus:bg-white focus:outline-none focus:border-[#0052CC] transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filters.subjectId}
            onChange={(e) => onChange({ subjectId: e.target.value })}
            className={selectClass}
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filters.batchId}
            onChange={(e) => onChange({ batchId: e.target.value })}
            className={selectClass}
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={onClear}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
