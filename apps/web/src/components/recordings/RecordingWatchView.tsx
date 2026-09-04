'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { RecordingDetailResponse } from './types';
import { RecordingVideoPlayer } from './RecordingVideoPlayer';
import { RecordingStatusBadge } from './RecordingStatusBadge';
import { formatDuration, statusKindOf } from './utils';

interface RecordingWatchViewProps {
  recordingId: string;
  /** Where the "Back to Recordings" button navigates (role-specific list). */
  backHref: string;
}

/**
 * Shared watch page body for Recorded Classes. Used by the Tenant Admin, Tutor
 * and Student watch routes — role scoping is enforced upstream by the page's
 * ProtectedRoute + the API's own role checks on GET /recordings/:id.
 */
export function RecordingWatchView({ recordingId, backHref }: RecordingWatchViewProps) {
  const router = useRouter();

  const [recording, setRecording] = useState<RecordingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!recordingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RecordingDetailResponse>(`/recordings/${recordingId}`);
      setRecording(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recording');
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const { liveClass } = recording ?? {};
  const kind = recording ? statusKindOf(recording.status, recording.statusLabel) : null;

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-[#0052CC] hover:border-blue-300 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" /> Back to Recordings
        </button>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline font-bold">
          ID: {recordingId ? recordingId.slice(0, 8) : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
        </div>
      ) : error || !recording ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="p-4 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-[#0B2447]">Recording not available</h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            {error ?? 'This recording could not be found or you do not have access to it.'}
          </p>
          <button
            onClick={() => router.push(backHref)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Recordings
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Title + meta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <RecordingStatusBadge status={recording.status} statusLabel={recording.statusLabel} />
              <span className="inline-flex items-center gap-1.5 text-xs text-[#0052CC] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                {formatDuration(recording.durationSeconds)}
              </span>
              {recording.resolution && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-mono font-bold">
                  {recording.resolution}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] tracking-tight">
              {liveClass?.title ?? 'Untitled Class'}
            </h1>
            {liveClass?.subtitle && (
              <p className="text-slate-500 text-xs font-medium">{liveClass.subtitle}</p>
            )}
          </div>

          {/* Player or state panel */}
          {kind === 'Ready' &&
          (recording.playbackUrl || recording.rawEgressUrl || recording.liveClassId) ? (
            <RecordingVideoPlayer
              src={
                recording.playbackUrl ||
                recording.rawEgressUrl ||
                `/v1/live-classes/${recording.liveClassId || recording.id}/video`
              }
              title={liveClass?.title}
              resolution={recording.resolution}
              fileSizeBytes={recording.fileSizeBytes}
            />
          ) : kind === 'Ready' && !recording.playbackUrl ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
              <div className="p-4 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-[#0B2447]">Recording file not found</h3>
              <p className="text-xs text-slate-500 max-w-md font-medium">
                The recording is marked as ready, but the video file could not be located on the
                server. The tutor may need to re-record this session.
              </p>
              <button
                onClick={fetchDetail}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold transition-colors shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" /> Refresh status
              </button>
            </div>
          ) : kind === 'Processing' ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
              <div className="p-4 rounded-full bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-[#0B2447]">
                Recording is being processed
              </h3>
              <p className="text-xs text-slate-500 max-w-md font-medium">
                The video is still being finalized from the live session. Check back in a few
                minutes — it will be ready to watch automatically.
              </p>
              <button
                onClick={fetchDetail}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold transition-colors shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" /> Refresh status
              </button>
            </div>
          ) : kind === 'Failed' ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
              <div className="p-4 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-[#0B2447]">This recording failed</h3>
              <p className="text-xs text-slate-500 max-w-md font-medium">
                The recording pipeline did not complete for this session. Contact the institute
                administrator if you expected this class to be recorded.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-2xs">
              <div className="p-4 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-[#0B2447]">No playback available</h3>
              <p className="text-xs text-slate-500 max-w-md font-medium">
                A playback link could not be generated for this recording. Please try again later.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
