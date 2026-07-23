'use client';

import { useState } from 'react';
import { X, User, Clock, Ban, AlertTriangle, ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overrideSession, OverrideScope } from '../services/schedule-service';
import { ScopeSelectorDialog } from './ScopeSelectorDialog';
import { ScheduleDetail } from '../types/schedule.types';
import { toast } from 'sonner';

// ─── Action types ─────────────────────────────────────────────────────────────

export type SessionAction = 'change_tutor' | 'reschedule' | 'cancel';

interface SessionOverrideDrawerProps {
  open: boolean;
  action: SessionAction | null;
  schedule: ScheduleDetail | null;
  tutors: { id: string; firstName: string; lastName: string; employeeCode: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SessionOverrideDrawer({
  open,
  action,
  schedule,
  tutors,
  onClose,
  onSuccess,
}: SessionOverrideDrawerProps) {
  const queryClient = useQueryClient();

  // Form state
  const [reason, setReason] = useState('');
  const [newTutorId, setNewTutorId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // Scope dialog state
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<OverrideScope>('ONLY_THIS');

  const mutation = useMutation({
    mutationFn: ({ id, scope }: { id: string; scope: OverrideScope }) => {
      const payload: any = { scope, reason: reason || undefined };

      if (action === 'change_tutor') {
        payload.staffProfileId = newTutorId;
      } else if (action === 'reschedule') {
        if (newDate) payload.newDate = newDate;
        if (newStartTime) payload.newStartTime = newStartTime;
        if (newEndTime) payload.newEndTime = newEndTime;
      } else if (action === 'cancel') {
        payload.cancel = true;
      }

      return overrideSession(id, payload);
    },
    onSuccess: () => {
      const labels: Record<SessionAction, string> = {
        change_tutor: 'Tutor updated',
        reschedule: 'Class rescheduled',
        cancel: 'Class cancelled',
      };
      toast.success(`${labels[action!]}. Notifications queued for students.`);
      queryClient.invalidateQueries({ queryKey: ['weekly-view'] });
      setScopeDialogOpen(false);
      handleClose();
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Something went wrong.';
      toast.error(msg);
      setScopeDialogOpen(false);
    },
  });

  const handleClose = () => {
    setReason('');
    setNewTutorId('');
    setNewDate('');
    setNewStartTime('');
    setNewEndTime('');
    setSelectedScope('ONLY_THIS');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    if (action === 'change_tutor' && !newTutorId) {
      toast.error('Please select a replacement tutor.');
      return;
    }
    // Open scope selector (skip for non-recurring schedules — goes directly)
    setScopeDialogOpen(true);
  };

  const handleScopeConfirm = (scope: OverrideScope) => {
    if (!schedule) return;
    mutation.mutate({ id: schedule.id, scope });
  };

  if (!open || !schedule || !action) return null;

  const actionConfig: Record<
    SessionAction,
    { title: string; description: string; icon: React.ComponentType<any>; color: string }
  > = {
    change_tutor: {
      title: 'Change Tutor',
      description: 'Assign a substitute or replacement tutor for this class.',
      icon: User,
      color: 'text-blue-600',
    },
    reschedule: {
      title: 'Reschedule Class',
      description: 'Move this class to a different date or time.',
      icon: Clock,
      color: 'text-amber-600',
    },
    cancel: {
      title: 'Cancel Class',
      description: 'Mark this class as cancelled. Students will be notified.',
      icon: Ban,
      color: 'text-red-600',
    },
  };

  const cfg = actionConfig[action];
  const Icon = cfg.icon;

  return (
    <>
      {/* Drawer backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={handleClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center`}
            >
              <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{cfg.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors mt-0.5 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session context chip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">
            Session
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {schedule.dayOfWeek}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {schedule.startTime} – {schedule.endTime}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
              {schedule.id.slice(0, 8)}…
            </span>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Change Tutor field */}
          {action === 'change_tutor' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Replacement Tutor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={newTutorId}
                  onChange={(e) => setNewTutorId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition appearance-none"
                >
                  <option value="">Select tutor…</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                      {t.employeeCode ? ` (${t.employeeCode})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Reschedule fields */}
          {action === 'reschedule' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New End Time
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cancel warning */}
          {action === 'cancel' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">
                This will mark the class as cancelled. Students enrolled in this batch will receive
                a notification.
              </p>
            </div>
          )}

          {/* Reason field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                action === 'cancel'
                  ? 'e.g. Tutor on leave, Public holiday…'
                  : action === 'change_tutor'
                    ? 'e.g. Tutor on leave, Emergency substitution…'
                    : 'e.g. Venue unavailable, Batch request…'
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
              action === 'cancel'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            Continue →
          </button>
        </div>
      </div>

      {/* Scope dialog — appears above the drawer */}
      <ScopeSelectorDialog
        open={scopeDialogOpen}
        onClose={() => setScopeDialogOpen(false)}
        onConfirm={handleScopeConfirm}
        selectedScope={selectedScope}
        onScopeChange={setSelectedScope}
        loading={mutation.isPending}
        actionLabel={
          action === 'cancel'
            ? 'Cancel Class'
            : action === 'change_tutor'
              ? 'Change Tutor'
              : 'Reschedule'
        }
      />
    </>
  );
}
