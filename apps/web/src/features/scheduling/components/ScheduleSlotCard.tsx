'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Wifi,
  User,
  RefreshCw,
  Ban,
  History,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import { ScheduleDetail } from '../types/schedule.types';
import type { SessionAction } from './SessionOverrideDrawer';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';

// Rich subject color palettes
const SUBJECT_COLORS: Record<
  string,
  { bg: string; border: string; text: string; badgeBg: string; badgeText: string; accent: string }
> = {
  Physics: {
    bg: 'bg-blue-50/80',
    border: 'border-blue-200 hover:border-blue-300',
    text: 'text-[#0B2447]',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-[#0052CC]',
    accent: 'bg-[#0052CC]',
  },
  Chemistry: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200 hover:border-emerald-300',
    text: 'text-[#0B2447]',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accent: 'bg-emerald-600',
  },
  Biology: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200 hover:border-amber-300',
    text: 'text-[#0B2447]',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    accent: 'bg-amber-600',
  },
  Maths: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-200 hover:border-rose-300',
    text: 'text-[#0B2447]',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    accent: 'bg-rose-600',
  },
};

const DEFAULT_COLOR = {
  bg: 'bg-blue-50/50',
  border: 'border-slate-200 hover:border-blue-300',
  text: 'text-[#0B2447]',
  badgeBg: 'bg-slate-200/80',
  badgeText: 'text-slate-700',
  accent: 'bg-[#0052CC]',
};

function getSubjectColor(subjectName?: string) {
  if (!subjectName) return DEFAULT_COLOR;
  const key = Object.keys(SUBJECT_COLORS).find((k) =>
    subjectName.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? SUBJECT_COLORS[key] : DEFAULT_COLOR;
}

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function getNextOccurrenceDate(dayOfWeek: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = DAY_INDEX[dayOfWeek] ?? today.getDay();
  const todayDay = today.getDay();
  const diff = (targetDay - todayDay + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

function formatOccurrenceDate(dayOfWeek: string): string {
  const date = getNextOccurrenceDate(dayOfWeek);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = date.getTime() === today.getTime();
  const formatted = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return isToday ? `Today, ${formatted}` : formatted;
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
    { action: 'reschedule', label: 'Edit / Reschedule', icon: RefreshCw },
    { action: 'change_tutor', label: 'Change Tutor', icon: User },
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

  let sessionType = 'BATCH';
  let studentName: string | undefined = undefined;
  if (schedule.notes) {
    try {
      const meta = JSON.parse(schedule.notes);
      if (meta?.sessionType) sessionType = meta.sessionType;
      if (meta?.studentName) studentName = meta.studentName;
    } catch {}
  }

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-2xl border p-4 cursor-pointer select-none
        transition-all duration-200 hover:shadow-md hover:border-blue-300
        ${colors.bg} ${colors.border} space-y-3 bg-white
      `}
    >
      {/* Top Bar: Subject Badge + Edit / Actions */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${colors.badgeBg} ${colors.badgeText}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colors.accent}`} />
            {subjectName ?? 'Subject'}
          </span>

          {(sessionType === 'ONE_TO_ONE' || studentName) && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0052CC] text-white flex items-center gap-1 shadow-2xs">
              1:1 Class {studentName ? `(${studentName})` : ''}
            </span>
          )}
        </div>

        {/* Edit & Options Action Buttons */}
        <div className="flex items-center gap-1.5">
          {Boolean(onAction) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('reschedule', schedule);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-[#0052CC] text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Edit / Reschedule Class"
            >
              <RefreshCw className="w-3 h-3 text-[#0052CC]" />
              <span>Edit</span>
            </button>
          )}

          {/* Options Trigger */}
          {Boolean(onAction || onHistory) && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-2xs"
                title="Class Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-1 space-y-0.5">
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
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                          item.danger
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 flex-shrink-0 ${item.danger ? 'text-rose-500' : 'text-[#0052CC]'}`}
                        />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch & Tutor Info */}
      <div className="space-y-1">
        <h4 className="text-sm font-extrabold text-[#0B2447] tracking-tight leading-snug">
          {batchName ?? 'Batch Schedule'}
        </h4>
        <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Tutor:{' '}
            <strong className="text-[#0B2447] font-extrabold">{tutorName ?? 'Unassigned'}</strong>
          </span>
        </p>
      </div>

      {/* Time & Delivery Mode Chips */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-[#0B2447] font-extrabold">
          <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>
            {schedule.startTime}–{schedule.endTime}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-slate-600 font-semibold">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-emerald-600" />
          ) : (
            <MapPin className="w-3 h-3 text-[#0052CC]" />
          )}
          <span className="capitalize text-[11px] font-bold">
            {schedule.deliveryMode.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Upcoming Date & 1-Click Calendar Add Footer */}
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatOccurrenceDate(schedule.dayOfWeek)}
        </span>

        <a
          href={generateGoogleCalendarUrl({
            title: `${subjectName || 'NEET Class'} - ${batchName || 'Scheduled Session'}`,
            description: `Scheduled NEET Class for ${batchName || 'Batch'} with Tutor ${tutorName || 'Faculty'}.`,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dateStr: schedule.dayOfWeek,
            joiningLink: schedule.meetingLink || undefined,
          })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 text-[#0052CC] font-extrabold text-[10.5px] border border-blue-200 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
          title="Add this class to Google Calendar with 15-min reminder alert"
        >
          <Calendar className="w-3 h-3 text-[#0052CC] shrink-0" />
          <span>Add to Calendar</span>
        </a>
      </div>
    </div>
  );
}
