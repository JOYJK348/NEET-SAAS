'use client';

import { useQuery } from '@tanstack/react-query';
import { X, Clock, User, MapPin, Ban, Plus, RefreshCw } from 'lucide-react';
import { getSessionHistory } from '../services/schedule-service';
import { ScheduleDetail } from '../types/schedule.types';

interface SessionHistoryDrawerProps {
  open: boolean;
  schedule: ScheduleDetail | null;
  onClose: () => void;
}

// Action → label + color
const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dotColor: string; icon: React.ComponentType<any> }
> = {
  CREATED: {
    label: 'Created',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    dotColor: 'bg-slate-400',
    icon: Clock,
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dotColor: 'bg-amber-400',
    icon: RefreshCw,
  },
  TUTOR_CHANGED: {
    label: 'Tutor Changed',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    dotColor: 'bg-blue-500',
    icon: User,
  },
  ROOM_CHANGED: {
    label: 'Room Changed',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    dotColor: 'bg-violet-500',
    icon: MapPin,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    dotColor: 'bg-red-500',
    icon: Ban,
  },
  STATUS_CHANGED: {
    label: 'Status Changed',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    dotColor: 'bg-slate-400',
    icon: Clock,
  },
  EXTRA_CLASS_CREATED: {
    label: 'Extra Class Added',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dotColor: 'bg-emerald-500',
    icon: Plus,
  },
};

function formatDateTime(raw: string) {
  const d = new Date(raw);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function DataRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[11px] text-slate-400 font-semibold w-20 flex-shrink-0">{label}</span>
      <span className="text-[11px] text-slate-700 font-medium break-all">{value}</span>
    </div>
  );
}

export function SessionHistoryDrawer({ open, schedule, onClose }: SessionHistoryDrawerProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['session-history', schedule?.id],
    queryFn: () => getSessionHistory(schedule!.id),
    enabled: open && !!schedule,
  });

  if (!open || !schedule) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Change History</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {schedule.dayOfWeek} · {schedule.startTime}–{schedule.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <svg className="w-6 h-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No history yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Changes to this session will appear here.
              </p>
            </div>
          )}

          {!isLoading && logs.length > 0 && (
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[15px] top-6 bottom-6 w-px bg-slate-100" />

              <div className="space-y-6">
                {logs.map((log: any, idx: number) => {
                  const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG['CREATED'];
                  const Icon = cfg.icon;

                  return (
                    <div key={log.id ?? idx} className="flex gap-4 relative">
                      {/* Dot */}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 ring-4 ring-white`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                          {log.scope && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                              {log.scope.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(log.changedAt)}
                        </p>

                        {log.reason && (
                          <p className="text-xs text-slate-600 mt-1.5 italic">"{log.reason}"</p>
                        )}

                        {/* Data diff */}
                        {(log.originalData || log.newData) && (
                          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                            {log.originalData?.staffProfileId &&
                              log.newData?.staffProfileId &&
                              log.originalData.staffProfileId !== log.newData.staffProfileId && (
                                <>
                                  <DataRow label="Was" value={log.originalData.staffProfileId} />
                                  <DataRow label="Now" value={log.newData.staffProfileId} />
                                </>
                              )}
                            {log.originalData?.startsAt && log.newData?.startsAt && (
                              <>
                                <DataRow
                                  label="Was"
                                  value={formatDateTime(log.originalData.startsAt)}
                                />
                                <DataRow label="Now" value={formatDateTime(log.newData.startsAt)} />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
