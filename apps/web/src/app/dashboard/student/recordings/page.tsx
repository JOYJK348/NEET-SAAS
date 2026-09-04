'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Video } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import type { Recording, RecordingListResponse } from '@/components/recordings/types';
import { HierarchicalRecordingsBrowse } from '@/components/recordings/HierarchicalRecordingsBrowse';

async function fetchAllRecordings(): Promise<Recording[]> {
  const firstPageRes = await api.get<any>('/recordings', {
    params: { page: 1, limit: 100 },
  });

  const rawItems: Recording[] = Array.isArray(firstPageRes)
    ? firstPageRes
    : Array.isArray(firstPageRes?.items)
      ? firstPageRes.items
      : Array.isArray(firstPageRes?.data)
        ? firstPageRes.data
        : [];

  const totalPages = Math.min(firstPageRes?.pages || 1, 10);
  const allItems: Recording[] = [...rawItems];

  if (totalPages > 1) {
    const remainingPromises = [];
    for (let p = 2; p <= totalPages; p++) {
      remainingPromises.push(
        api.get<any>('/recordings', {
          params: { page: p, limit: 100 },
        }),
      );
    }
    const results = await Promise.all(remainingPromises);
    results.forEach((res) => {
      const pageItems = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
            ? res.data
            : [];
      allItems.push(...pageItems);
    });
  }

  return allItems;
}

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
  const {
    data: items = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-recordings-all'],
    queryFn: fetchAllRecordings,
    staleTime: 5 * 60 * 1000, // 5 min cache for 0ms instant navigation
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

  return (
    <div className="w-full pb-20 space-y-5 font-sans text-[#0F172A]">
      {/* ── Top Header Card (ISML LMS Light Blue Style) ────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
              Class Recordings Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              {isLoading ? '...' : `${items.length} Videos`}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Browse your enrolled course, batch & subject recordings step-by-step with HD video
            replay.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] text-xs font-extrabold hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#0052CC] ${isRefetching ? 'animate-spin' : ''}`}
          />
          <span>{isRefetching ? 'Refreshing...' : 'Refresh Recordings'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
          <span className="text-slate-500 text-xs font-bold">Loading video recordings...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="p-3 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-extrabold text-[#0B2447]">Failed to load recordings</h3>
          <p className="text-xs text-slate-500 max-w-md">
            {error instanceof Error ? error.message : 'Error fetching recordings'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-black transition-colors shadow-2xs cursor-pointer"
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
