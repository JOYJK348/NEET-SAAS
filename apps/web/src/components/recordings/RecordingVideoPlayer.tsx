'use client';

import { useEffect, useRef, useState } from 'react';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from './utils';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const FALLBACK_VIDEO_STREAM =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface RecordingVideoPlayerProps {
  src: string;
  title?: string;
  resolution?: string | null;
  fileSizeBytes?: number | null;
}

function getApiOrigin(): string {
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    try {
      return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
    } catch {}
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^[\d.]+$/.test(host);

    if (isLocal) {
      return `http://${host === 'localhost' ? '127.0.0.1' : host}:3000`;
    }
  }

  return 'https://neet-saas.onrender.com';
}

function resolveFullVideoUrl(url?: string): string {
  if (!url || url === '/lecture.mp4' || url.endsWith('/lecture.mp4')) {
    return FALLBACK_VIDEO_STREAM;
  }

  // 1. If already a full HTTPS URL (e.g. Supabase signed URL or Google Cloud stream), return directly
  if (url.startsWith('https://')) return url;

  const apiOrigin = getApiOrigin();

  let finalUrl = url;
  if (finalUrl.includes('localhost:3000') || finalUrl.includes('127.0.0.1:3000')) {
    finalUrl = finalUrl.replace(/^https?:\/\/[^/]+/, '');
  }

  if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) return finalUrl;

  const cleanPath = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;

  // If path starts with /api/v1 or /v1, attach directly to apiOrigin
  if (cleanPath.startsWith('/api/v1/') || cleanPath.startsWith('/v1/')) {
    return `${apiOrigin}${cleanPath}`;
  }

  return `${apiOrigin}/v1${cleanPath}`;
}

export function RecordingVideoPlayer({
  src,
  title,
  resolution,
  fileSizeBytes,
}: RecordingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() => resolveFullVideoUrl(src));

  useEffect(() => {
    setCurrentSrc(resolveFullVideoUrl(src));
    setHasError(false);
  }, [src]);

  const changeSpeed = (value: number) => {
    setSpeed(value);
    if (videoRef.current) {
      videoRef.current.playbackRate = value;
    }
  };

  const handleVideoError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(FALLBACK_VIDEO_STREAM);
    }
  };

  if (!currentSrc) return null;

  return (
    <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shadow-violet-950/30">
      <video
        key={currentSrc}
        ref={videoRef}
        src={currentSrc}
        controls
        playsInline
        preload="auto"
        onError={handleVideoError}
        className="w-full aspect-video bg-black cursor-pointer"
        aria-label={title}
      >
        Your browser does not support playing this video.
      </video>

      {/* Playback speed + file info bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Gauge className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="font-mono">
            {[resolution, fileSizeBytes != null ? formatFileSize(fileSizeBytes) : null]
              .filter(Boolean)
              .join(' · ') || '1080p HD'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Playback speed</span>
          <div className="inline-flex items-center rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden">
            {SPEEDS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => changeSpeed(s)}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  speed === s
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                  i > 0 && 'border-l border-slate-800',
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
