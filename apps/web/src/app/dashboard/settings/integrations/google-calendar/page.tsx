'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle2,
  Bell,
  Video,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  Smartphone,
  Globe,
} from 'lucide-react';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';

export default function GoogleCalendarSettingsPage() {
  const sampleClassStart = new Date();
  sampleClassStart.setHours(sampleClassStart.getHours() + 1, 0, 0, 0);

  const sampleClassEnd = new Date(sampleClassStart);
  sampleClassEnd.setHours(sampleClassEnd.getHours() + 2);

  const sampleStartStr = `${String(sampleClassStart.getHours()).padStart(2, '0')}:00`;
  const sampleEndStr = `${String(sampleClassEnd.getHours()).padStart(2, '0')}:00`;

  const sampleUrl = generateGoogleCalendarUrl({
    title: 'Physics - NEET Crash Course (Demo Session)',
    description: 'Sample Live Class Session for NEET Aspirants.',
    startTime: sampleStartStr,
    endTime: sampleEndStr,
    joiningLink: 'https://meet.jit.si/neet-physics-demo',
  });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span className="text-xs font-bold text-violet-200 uppercase tracking-wider">
                Native Calendar Integration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Google Calendar 1-Click Sync 📅
            </h1>
            <p className="text-xs sm:text-sm text-violet-100 max-w-2xl font-medium">
              Seamlessly add enrolled batch classes, 1:1 sessions, and live lectures to Google Calendar in 1 click — complete with 15-minute popup notification alerts!
            </p>
          </div>

          <a
            href={sampleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl bg-white text-violet-700 hover:bg-violet-50 font-extrabold text-xs shadow-md shadow-violet-900/20 gap-2 transition-all cursor-pointer flex items-center shrink-0"
          >
            <Calendar className="w-4 h-4 text-violet-600" />
            <span>Test 1-Click Calendar Sync 🚀</span>
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 rounded-3xl border-slate-200/90 bg-white shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Zero Setup & 100% Free</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No complex API keys, no Google account linking, and zero cloud billing required. Works instantly for all students and tutors.
            </p>
          </Card>

          <Card className="p-5 rounded-3xl border-slate-200/90 bg-white shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">15-Min Popup Reminders</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Google Calendar automatically fires a native push notification alert 15 minutes before your class start time on phone & desktop.
            </p>
          </Card>

          <Card className="p-5 rounded-3xl border-slate-200/90 bg-white shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">1-Click Live Join Link</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              The calendar event description automatically includes the 1-Click Jitsi Live Video Classroom joining link and class notes.
            </p>
          </Card>
        </div>

        {/* Interactive Preview Card */}
        <Card className="p-6 rounded-3xl border-slate-200/90 bg-white shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">How 1-Click Sync Works</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Every timetable card across Student Dashboard, Tutor Portal, and Master Schedule includes an instant calendar add button.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <Smartphone className="w-4 h-4 text-violet-600" />
                <span>On Mobile (Android & iPhone)</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tapping <strong>&quot;Add to Calendar 📅&quot;</strong> opens the built-in Google Calendar app on your phone with class timing and reminder pre-filled. Tap <strong>Save</strong> and you&apos;re set!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>On Desktop (Windows & Mac)</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Opens Google Calendar in a new tab with class title, Jitsi classroom link, and 15-minute popup alert pre-populated.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-violet-50/60 p-4 rounded-2xl border border-violet-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                📅
              </div>
              <div>
                <p className="text-xs font-black text-violet-950">Test Calendar Link Right Now</p>
                <p className="text-[11px] text-violet-700 font-semibold">
                  Click the button to preview adding a sample NEET Physics class to your Google Calendar.
                </p>
              </div>
            </div>

            <a
              href={sampleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto text-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              Add Sample Event 📅
            </a>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
