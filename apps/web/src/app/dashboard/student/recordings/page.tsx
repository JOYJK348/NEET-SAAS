'use client';

import { useCallback, useEffect, useState } from 'react';
import { Library, Loader2, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import type { Recording, RecordingListResponse } from '@/components/recordings/types';
import { HierarchicalRecordingsBrowse } from '@/components/recordings/HierarchicalRecordingsBrowse';

const MAX_FETCH_PAGES = 10;

export default function StudentRecordingsPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <BrowseContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function BrowseContent() {
  const [items, setItems] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all: Recording[] = [];
      let page = 1;
      let pages = 1;
      do {
        const data = await api.get<RecordingListResponse>('/recordings', {
          params: { page, limit: 100 },
        });
        all.push(...data.items);
        pages = data.pages;
        page += 1;
      } while (page <= pages && page <= MAX_FETCH_PAGES);
      setItems(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recordings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Signature Violet Hero Header Banner */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
            <Library className="w-3.5 h-3.5" /> Recorded Classes Library
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            All Class Recordings
          </h1>
          <p className="text-violet-100 max-w-xl text-xs sm:text-sm leading-relaxed">
            Browse your enrolled course, batch & subject recordings step-by-step.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white bg-white/15 border border-white/20 px-4 py-2 rounded-full font-mono font-bold">
            {loading ? '…' : `${items.length} recording${items.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="p-4 rounded-full bg-rose-100 text-rose-600 border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Failed to load recordings</h3>
          <p className="text-sm text-slate-500 max-w-md">{error}</p>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-2xs"
          >
            Retry
          </button>
        </div>
      ) : (
        <HierarchicalRecordingsBrowse
          recordings={items}
          watchHrefBase="/dashboard/student/recordings"
        />
      )}
    </div>
  );
}
