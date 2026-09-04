'use client';

import { useRouter } from 'next/navigation';
import {
  PlayCircle,
  Trash2,
  Clock,
  User,
  BookOpen,
  Layers,
  FolderTree,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Recording } from './types';
import { RecordingStatusBadge } from './RecordingStatusBadge';
import { formatDuration, formatFileSize, formatStartAndEndTime, statusKindOf } from './utils';

interface RecordingCardProps {
  recording: Recording;
  onDelete?: (recording: Recording) => void;
  deleting?: boolean;
  /** Role-specific watch route. Defaults to the tenant admin watch page. */
  watchHref?: string;
}

export function RecordingCard({ recording, onDelete, deleting, watchHref }: RecordingCardProps) {
  const router = useRouter();
  const { liveClass, display } = recording;
  const kind = statusKindOf(recording.status, recording.statusLabel);
  const isReady = kind === 'Ready';
  const watchPath = watchHref ?? `/dashboard/recordings/${recording.id}`;
  const { dateStr, timeRangeStr } = formatStartAndEndTime(recording);

  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 p-5 transition-all duration-200 shadow-2xs hover:shadow-md hover:border-blue-300 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Status + duration */}
        <div className="flex items-center justify-between gap-3">
          <RecordingStatusBadge status={recording.status} statusLabel={recording.statusLabel} />
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0052CC] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-mono">
            <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
            {formatDuration(recording.durationSeconds)}
          </span>
        </div>

        {/* Title + subtitle */}
        <div>
          <h3 className="text-base font-extrabold text-[#0B2447] group-hover:text-[#0052CC] transition-colors leading-snug">
            {liveClass?.title ?? 'Untitled Class'}
          </h3>
          {liveClass?.subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{liveClass.subtitle}</p>
          )}
        </div>

        {/* Curriculum course / batch / subject / tutor / date / duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0052CC] shrink-0" />
            <span className="font-extrabold text-[#0B2447]">Course:</span>
            <span className="truncate text-slate-600 font-medium">
              {display?.courseName || 'NEET Crash Course'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0052CC] shrink-0" />
            <span className="font-extrabold text-[#0B2447]">Batch:</span>
            <span className="truncate text-slate-600 font-medium">
              {display?.batchName || 'Batch B'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#0052CC] shrink-0" />
            <span className="font-extrabold text-[#0B2447]">Subject:</span>
            <span className="truncate text-[#0052CC] font-extrabold">
              {display?.subjectName || 'Physics'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-extrabold text-[#0B2447]">Tutor:</span>
            <span className="truncate text-slate-600 font-medium">
              {display?.tutorName || 'Faculty'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
            <Sparkles className="w-4 h-4 text-[#0052CC] shrink-0" />
            <span className="font-extrabold text-[#0B2447] shrink-0">Topic:</span>
            <span className="truncate text-[#0B2447] font-extrabold">
              {display?.topicName || liveClass?.subtitle || "Newton's Laws of Motion"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:col-span-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 truncate">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-extrabold text-[#0B2447] shrink-0">Time:</span>
              <span className="truncate text-slate-600 font-medium">
                {dateStr} •{' '}
                <strong className="text-[#0B2447] font-extrabold">{timeRangeStr}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400 font-mono truncate font-semibold">
          {[recording.resolution, formatFileSize(recording.fileSizeBytes)]
            .filter(Boolean)
            .join(' · ') || '—'}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push(watchPath)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-2xs',
              isReady
                ? 'bg-[#0052CC] hover:bg-blue-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
            )}
          >
            <PlayCircle className="w-4 h-4" />
            {isReady ? 'Watch Recording' : 'Details'}
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(recording)}
              disabled={deleting}
              aria-label={`Delete recording ${liveClass?.title ?? ''}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
