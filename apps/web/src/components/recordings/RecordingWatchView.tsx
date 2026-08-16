'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  Layers,
  FolderTree,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { RecordingDetailResponse } from './types';
import { RecordingVideoPlayer } from './RecordingVideoPlayer';
import { RecordingStatusBadge } from './RecordingStatusBadge';
import {
  formatDuration,
  formatDateTime,
  formatStartAndEndTime,
  statusKindOf,
} from './utils';

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

  const { dateStr, timeRangeStr } = formatStartAndEndTime(recording);

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

  const { liveClass, display } = recording ?? {};
  const kind = recording ? statusKindOf(recording.status, recording.statusLabel) : null;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:text-violet-600 hover:border-violet-300 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Recordings
        </button>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          ID: {recordingId ? recordingId.slice(0, 8) : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : error || !recording ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">Recording not available</h3>
          <p className="text-sm text-slate-400 max-w-md">
            {error ?? 'This recording could not be found or you do not have access to it.'}
          </p>
          <button
            onClick={() => router.push(backHref)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Recordings
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Title + meta */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <RecordingStatusBadge
                status={recording.status}
                statusLabel={recording.statusLabel}
              />
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full font-mono">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                {formatDuration(recording.durationSeconds)}
              </span>
              {recording.resolution && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full font-mono">
                  {recording.resolution}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {liveClass?.title ?? 'Untitled Class'}
            </h1>
            {liveClass?.subtitle && (
              <p className="text-slate-400 text-sm">{liveClass.subtitle}</p>
            )}
          </div>

          {/* Player or state panel */}
          {kind === 'Ready' && (recording.playbackUrl || recording.rawEgressUrl || recording.liveClassId) ? (
            <RecordingVideoPlayer
              src={recording.playbackUrl || recording.rawEgressUrl || `/v1/live-classes/${recording.liveClassId || recording.id}/video`}
              title={liveClass?.title}
              resolution={recording.resolution}
              fileSizeBytes={recording.fileSizeBytes}
            />
          ) : kind === 'Ready' && !recording.playbackUrl ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
              <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">
                Recording file not found
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                The recording is marked as ready, but the video file could not be located on the server.
                The tutor may need to re-record this session.
              </p>
              <button
                onClick={fetchDetail}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh status
              </button>
            </div>
          ) : kind === 'Processing' ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
              <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">
                Recording is being processed
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                The video is still being finalized from the live session. Check back in a
                few minutes — it will be ready to watch automatically.
              </p>
              <button
                onClick={fetchDetail}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh status
              </button>
            </div>
          ) : kind === 'Failed' ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
              <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">
                This recording failed
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                The recording pipeline did not complete for this session. Contact the
                institute administrator if you expected this class to be recorded.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-800/80 text-slate-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">No playback available</h3>
              <p className="text-sm text-slate-400 max-w-md">
                A playback link could not be generated for this recording. Please try again
                later.
              </p>
            </div>
          )}


        </div>
      )}
    </div>
  );
}
