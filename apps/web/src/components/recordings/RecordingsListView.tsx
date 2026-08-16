'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { STALE_TIMES } from '@/lib/staleTimes';
import type { Recording, RecordingListResponse } from './types';
import { RecordingCard } from './RecordingCard';
import {
  RecordingsFilters,
  RecordingFiltersState,
  EMPTY_RECORDING_FILTERS,
} from './RecordingsFilters';
import { EmptyRecordingsState } from './EmptyRecordingsState';
import { HierarchicalRecordingsBrowse } from './HierarchicalRecordingsBrowse';
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
import { useBatches } from '@/features/batches/hooks/use-batches';

const PAGE_SIZE = 100;

interface RecordingsListViewProps {
  /** Base of the role-specific watch route, e.g. `/dashboard/tutor/recordings`. */
  watchHrefBase: string;
  /** Tenant admins may delete recordings; tutors/students cannot. */
  allowDelete?: boolean;
}

/**
 * Shared Recorded Classes list (filters + grid + pagination + optional delete).
 * Upgraded with TanStack Query caching for instant 0ms pre-fetched rendering.
 */
export function RecordingsListView({
  watchHrefBase,
  allowDelete = false,
}: RecordingsListViewProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RecordingFiltersState>(EMPTY_RECORDING_FILTERS);
  const [searchDraft, setSearchDraft] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter option data (tenant-scoped — available to admin & tutor roles)
  const { data: subjectsData } = useSubjects({ limit: 100 });
  const { batches, setPerPage } = useBatches();
  const subjects = subjectsData?.data ?? [];

  // Show all batches in the filter dropdown (default is first page only)
  useEffect(() => {
    setPerPage(200);
  }, [setPerPage]);

  // Debounce the search box into the committed filters
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  // TanStack Query for instant pre-fetched recordings & 0ms client cache hit
  const {
    data,
    isLoading: loading,
    isError,
    error: queryError,
    refetch: fetchRecordings,
  } = useQuery<RecordingListResponse>({
    queryKey: ['recordings', 'list', filters, page],
    queryFn: async ({ signal }) => {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'ALL') params.status = filters.status.toLowerCase();
      if (filters.subjectId !== 'ALL') params.subjectId = filters.subjectId;
      if (filters.batchId !== 'ALL') params.batchId = filters.batchId;

      return api.get<RecordingListResponse>('/recordings', { params, signal });
    },
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;
  const error = isError ? (queryError instanceof Error ? queryError.message : 'Failed to load recordings') : null;

  const patchFilters = useCallback((patch: Partial<RecordingFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchDraft('');
    setFilters(EMPTY_RECORDING_FILTERS);
    setPage(1);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recordings/${id}`),
    onSuccess: () => {
      toast.success('Recording deleted');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });

  const handleDelete = useCallback(
    async (recording: Recording) => {
      const title = recording.liveClass?.title ?? 'this recording';
      if (
        !window.confirm(
          `Delete "${title}"?\n\nThe video will be permanently removed from storage.`,
        )
      ) {
        return;
      }
      setDeletingId(recording.id);
      try {
        await deleteMutation.mutateAsync(recording.id);
      } catch {
        // Error toast is surfaced by the global api client
      } finally {
        setDeletingId(null);
      }
    },
    [deleteMutation],
  );

  return (
    <div className="space-y-6">
      <RecordingsFilters
        filters={filters}
        onChange={patchFilters}
        onClear={clearFilters}
        subjects={subjects}
        batches={batches}
      />

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : error && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">Failed to load recordings</h3>
          <p className="text-sm text-slate-400 max-w-md">{error}</p>
          <button
            onClick={() => fetchRecordings()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <HierarchicalRecordingsBrowse
          recordings={items}
          watchHrefBase={watchHrefBase}
          allowDelete={allowDelete}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
              page <= 1
                ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:border-violet-500/50 hover:text-white hover:bg-slate-800/60',
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {page} of {pages} · {total} recording{total === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
              page >= pages
                ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:border-violet-500/50 hover:text-white hover:bg-slate-800/60',
            )}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
