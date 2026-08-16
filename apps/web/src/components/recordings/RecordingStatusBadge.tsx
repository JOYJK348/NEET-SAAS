'use client';

import { cn } from '@/lib/utils';
import { statusKindOf, type RecordingStatusKind } from './utils';

const styles: Record<RecordingStatusKind, { badge: string; dot: string }> = {
  Ready: {
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  Processing: {
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400 animate-pulse',
  },
  Failed: {
    badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

interface RecordingStatusBadgeProps {
  status?: string | null;
  statusLabel?: string | null;
  className?: string;
}

export function RecordingStatusBadge({
  status,
  statusLabel,
  className,
}: RecordingStatusBadgeProps) {
  const kind = statusKindOf(status, statusLabel);
  const style = styles[kind];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
        style.badge,
        className,
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', style.dot)} />
      {kind}
    </span>
  );
}
