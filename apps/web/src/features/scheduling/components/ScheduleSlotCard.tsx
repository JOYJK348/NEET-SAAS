'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, MapPin, Wifi, User, RefreshCw, Ban, History, MoreVertical } from 'lucide-react';
import { ScheduleDetail } from '../types/schedule.types';
import type { SessionAction } from './SessionOverrideDrawer';

// Subject-to-color mapping for light theme
const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Physics: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  Chemistry: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  Biology: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Maths: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  English: {
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
  },
};

const DEFAULT_COLOR = {
  bg: 'bg-slate-50',
  border: 'border-slate-100',
  text: 'text-slate-700',
  dot: 'bg-slate-500',
};

function getSubjectColor(subjectName?: string) {
  if (!subjectName) return DEFAULT_COLOR;
  const key = Object.keys(SUBJECT_COLORS).find((k) =>
    subjectName.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? SUBJECT_COLORS[key] : DEFAULT_COLOR;
}

interface ScheduleSlotCardProps {
  schedule: ScheduleDetail;
  subjectName?: string;
  batchName?: string;
  tutorName?: string;
  onClick?: () => void;
  onAction?: (action: SessionAction, schedule: ScheduleDetail) => void;
  onHistory?: (schedule: ScheduleDetail) => void;
}

export function ScheduleSlotCard({
  schedule,
  subjectName,
  batchName,
  tutorName,
  onClick,
  onAction,
  onHistory,
}: ScheduleSlotCardProps) {
  const colors = getSubjectColor(subjectName);
  const isOnline = schedule.deliveryMode === 'ONLINE';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const menuItems: {
    action: SessionAction | 'history';
    label: string;
    icon: React.ComponentType<any>;
    danger?: boolean;
  }[] = [
    { action: 'change_tutor', label: 'Change Tutor', icon: User },
    { action: 'reschedule', label: 'Reschedule', icon: RefreshCw },
    { action: 'cancel', label: 'Cancel Class', icon: Ban, danger: true },
    { action: 'history', label: 'View History', icon: History },
  ];

  const handleMenuAction = (action: SessionAction | 'history') => {
    setMenuOpen(false);
    if (action === 'history') {
      onHistory?.(schedule);
    } else {
      onAction?.(action, schedule);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-lg border p-3 cursor-pointer select-none
        transition-all duration-200 hover:scale-[1.02] hover:shadow-md
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Color dot */}
      <div className={`absolute top-3 right-7 w-1.5 h-1.5 rounded-full ${colors.dot}`} />

      {/* Context menu trigger — revealed on hover */}
      {(onAction || onHistory) && (
        <div ref={menuRef} className="absolute top-1.5 right-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 text-slate-500"
            title="Session options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.action}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(item.action);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-left transition-colors ${
                      item.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${item.danger ? 'text-red-500' : 'text-slate-400'}`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subject name */}
      <p className={`text-xs font-bold ${colors.text} truncate pr-3`}>{subjectName ?? 'Subject'}</p>

      {/* Batch and Tutor info */}
      <div className="mt-1 space-y-0.5">
        {batchName && (
          <p className="text-[11px] font-semibold text-slate-700 truncate">{batchName}</p>
        )}
        {tutorName && <p className="text-[10px] text-slate-500 truncate">Tutor: {tutorName}</p>}
      </div>

      {/* Time & Delivery Mode */}
      <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-100/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-500">
            {schedule.startTime}–{schedule.endTime}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-slate-400" />
          ) : (
            <MapPin className="w-3 h-3 text-slate-400" />
          )}
          <span className="text-[10px] font-medium text-slate-500 capitalize">
            {schedule.deliveryMode.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Hover highlight overlay */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/[0.015] pointer-events-none" />
    </div>
  );
}
