'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';

export interface CalendarModalScheduleInfo {
  isEdit?: boolean;
  batchName: string;
  subjectName: string;
  tutorName: string;
  tutorEmail?: string;
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  deliveryMode?: string;
  meetingLink?: string;
  roomName?: string;
  students: Array<{
    id: string;
    name: string;
    email?: string;
    admissionNo?: string;
  }>;
}

export interface ScheduleCalendarSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTimetable: () => void;
  scheduleInfo: CalendarModalScheduleInfo;
}

export function ScheduleCalendarSuccessModal({
  isOpen,
  onClose,
  onNavigateToTimetable,
  scheduleInfo,
}: ScheduleCalendarSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const attendeeEmails: string[] = [];
  if (scheduleInfo.tutorEmail && scheduleInfo.tutorEmail.includes('@')) {
    attendeeEmails.push(scheduleInfo.tutorEmail.trim());
  }
  scheduleInfo.students.forEach((s) => {
    if (s.email && s.email.includes('@') && !attendeeEmails.includes(s.email.trim())) {
      attendeeEmails.push(s.email.trim());
    }
  });

  const description = [
    `📚 Course / Batch: ${scheduleInfo.batchName}`,
    `📖 Subject: ${scheduleInfo.subjectName}`,
    `👨‍🏫 Faculty: ${scheduleInfo.tutorName}`,
    `⏰ Timings: ${scheduleInfo.startTime} - ${scheduleInfo.endTime} (${scheduleInfo.dayOfWeek || 'Scheduled'})`,
    scheduleInfo.meetingLink ? `🔗 Live Class Link: ${scheduleInfo.meetingLink}` : '',
    scheduleInfo.roomName ? `🏛️ Classroom / Location: ${scheduleInfo.roomName}` : '',
    `\n👥 Enrolled Students (${scheduleInfo.students.length}):`,
    ...scheduleInfo.students.map((s, idx) => `  ${idx + 1}. ${s.name} (${s.admissionNo || 'Student'})`),
  ]
    .filter(Boolean)
    .join('\n');

  const gCalUrl = generateGoogleCalendarUrl({
    title: `[NEET Class] ${scheduleInfo.subjectName} - ${scheduleInfo.batchName}`,
    description,
    location: scheduleInfo.meetingLink || scheduleInfo.roomName || 'Academy Live Studio / Classroom',
    startTime: scheduleInfo.startTime,
    endTime: scheduleInfo.endTime,
    dateStr: scheduleInfo.startDate,
    dayOfWeek: scheduleInfo.dayOfWeek,
    isRecurring: scheduleInfo.isRecurring,
    untilDate: scheduleInfo.endDate,
    joiningLink: scheduleInfo.meetingLink,
    attendeeEmails,
  });

  const studentsWithEmail = scheduleInfo.students.filter((s) => s.email && s.email.includes('@'));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(gCalUrl);
    setCopied(true);
    toast.success('Google Calendar event link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleCalendar = () => {
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 border border-white/25 w-fit text-[11px] font-black uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>{scheduleInfo.isEdit ? 'Schedule Updated' : 'Schedule Saved'}</span>
          </div>

          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>{scheduleInfo.subjectName}</span>
            <span className="text-white/60">•</span>
            <span className="text-blue-100 font-semibold text-base">{scheduleInfo.batchName}</span>
          </h2>

          <p className="text-xs text-blue-100/90 mt-1 font-medium">
            Class scheduled on{' '}
            <span className="font-bold text-white uppercase">{scheduleInfo.dayOfWeek}</span> ({scheduleInfo.startTime} – {scheduleInfo.endTime})
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-xs">
          {/* Calendar Highlight Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-blue-50/50 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Free 1-Click Google Calendar & Auto-Reminder Sync</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Clicking the button below opens <strong>Google Calendar</strong> with this class pre-filled. When you click <strong>Save</strong>, Google Calendar automatically sends invitations and sets <strong>15-minute / 30-minute reminder notifications</strong> for all assigned students and faculty!
            </p>
          </div>

          {/* Schedule Snapshot Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0052CC]" /> Slot & Day
              </span>
              <p className="text-xs font-bold text-slate-800">
                {scheduleInfo.dayOfWeek} • {scheduleInfo.startTime} – {scheduleInfo.endTime}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" /> Assigned Faculty
              </span>
              <p className="text-xs font-bold text-slate-800 truncate" title={scheduleInfo.tutorName}>
                {scheduleInfo.tutorName}
              </p>
            </div>
          </div>

          {/* Attendees Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Assigned Attendees ({scheduleInfo.students.length + 1})</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                {studentsWithEmail.length} students with email
              </span>
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-600 py-0.5">
                <span className="font-semibold text-slate-800">👨‍🏫 {scheduleInfo.tutorName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{scheduleInfo.tutorEmail || 'Faculty'}</span>
              </div>
              {scheduleInfo.students.map((st, idx) => (
                <div key={st.id || idx} className="flex items-center justify-between text-slate-600 py-0.5 border-t border-slate-200/50">
                  <span className="truncate pr-2">🎓 {st.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {st.email ? st.email.split('@')[0] + '@...' : `#${st.admissionNo || 'STU'}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleOpenGoogleCalendar}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Notify All via Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto py-3 px-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Copy Google Calendar Event Link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToTimetable();
            }}
            className="w-full sm:w-auto py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
