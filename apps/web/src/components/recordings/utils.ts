/**
 * Formatting + status helpers for the Recorded Classes UI.
 */

export type RecordingStatusKind = 'Ready' | 'Processing' | 'Failed';

/** Collapse raw enum / friendly label into the three UI states shown to users. */
export function statusKindOf(
  status?: string | null,
  statusLabel?: string | null,
): RecordingStatusKind {
  const raw = (status || '').toUpperCase();
  const label = (statusLabel || '').toLowerCase();
  if (raw === 'READY' || raw === 'COMPLETED' || label === 'ready') return 'Ready';
  if (raw === 'FAILED' || label === 'failed') return 'Failed';
  return 'Processing';
}

export function formatDuration(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) return '—';
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${i === 0 || v >= 10 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

export function formatRecordedAt(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatStartAndEndTime(recording?: any): { dateStr: string; timeRangeStr: string } {
  if (!recording) return { dateStr: '—', timeRangeStr: '—' };
  const startIso =
    recording.liveClass?.actualStart ||
    recording.processingStartedAt ||
    recording.createdAt;
  const endIso =
    recording.liveClass?.actualEnd ||
    recording.processingCompletedAt;

  if (!startIso) return { dateStr: '—', timeRangeStr: '—' };
  const startDate = new Date(startIso);
  if (isNaN(startDate.getTime())) return { dateStr: '—', timeRangeStr: '—' };

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const startTimeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (!endIso) {
    return { dateStr, timeRangeStr: startTimeStr };
  }

  const endDate = new Date(endIso);
  if (isNaN(endDate.getTime())) {
    return { dateStr, timeRangeStr: startTimeStr };
  }

  const endTimeStr = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { dateStr, timeRangeStr: `${startTimeStr} – ${endTimeStr}` };
}
