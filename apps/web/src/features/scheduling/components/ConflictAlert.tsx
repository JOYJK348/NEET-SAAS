'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  BookOpen,
  DoorOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ConflictResult, WEEKDAY_FULL_LABELS } from '../types/schedule.types';

const CONFLICT_CONFIG = {
  TUTOR: {
    icon: Users,
    label: 'Tutor Conflict',
    color: 'red',
    bg: 'bg-red-50/50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
  BATCH: {
    icon: BookOpen,
    label: 'Batch Conflict',
    color: 'red',
    bg: 'bg-red-50/50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
  ROOM: {
    icon: DoorOpen,
    label: 'Room Conflict',
    color: 'red',
    bg: 'bg-red-50/50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
  STUDENT: {
    icon: GraduationCap,
    label: 'Student Conflict',
    color: 'amber',
    bg: 'bg-amber-50/30',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
} as const;

interface ConflictAlertProps {
  result: ConflictResult;
  newStartTime?: string;
  newEndTime?: string;
  newDayOfWeek?: string;
}

export function ConflictAlert({
  result,
  newStartTime,
  newEndTime,
  newDayOfWeek,
}: ConflictAlertProps) {
  const [showAllStudents, setShowAllStudents] = useState<Record<string, boolean>>({});

  if (!result.hasConflict) return null;

  const hasHardConflict = result.conflicts.some((c) => c.type !== 'STUDENT');
  const onlySoftConflict = !hasHardConflict && result.conflicts.some((c) => c.type === 'STUDENT');

  const toggleStudents = (id: string) => {
    setShowAllStudents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-sm transition-colors
      ${onlySoftConflict ? 'border-amber-300 bg-amber-50/10' : 'border-red-300 bg-red-50/30'}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b
        ${onlySoftConflict ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${onlySoftConflict ? 'bg-amber-100' : 'bg-red-100'}`}
        >
          <AlertTriangle
            className={`w-4 h-4 ${onlySoftConflict ? 'text-amber-600' : 'text-red-600'}`}
          />
        </div>
        <div>
          <p
            className={`text-sm font-bold ${onlySoftConflict ? 'text-amber-800' : 'text-red-800'}`}
          >
            {onlySoftConflict ? 'Scheduling Warning' : 'Scheduling Conflict Detected'}
          </p>
          <p className={`text-xs ${onlySoftConflict ? 'text-amber-700/80' : 'text-red-600/80'}`}>
            {result.conflicts.length} overlap{result.conflicts.length > 1 ? 's' : ''} found
            {onlySoftConflict ? ' — Bypass is allowed' : ' — Cannot save this schedule'}
          </p>
        </div>
      </div>

      {/* Conflicts */}
      <div className={`divide-y ${onlySoftConflict ? 'divide-amber-150' : 'divide-red-100'}`}>
        {result.conflicts.map((conflict, idx) => {
          const config = CONFLICT_CONFIG[conflict.type as keyof typeof CONFLICT_CONFIG];
          const Icon = config.icon;
          const existing = conflict.existingSchedule;

          const isStudent = conflict.type === 'STUDENT';
          const studentNames = conflict.studentNames || [];
          const totalStudents = studentNames.length;
          const sampleNames = studentNames.slice(0, 3);
          const hasMoreStudents = totalStudents > 3;
          const showAll = showAllStudents[existing.id] ?? false;

          return (
            <div key={idx} className={`p-4 ${config.bg}`}>
              {/* Conflict type badge */}
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </span>
              </div>

              {/* Message */}
              <p className={`text-xs font-semibold leading-relaxed ${config.text} mb-3`}>
                {conflict.message}
              </p>

              {/* Conflicting Students List Box (for STUDENT conflicts) */}
              {isStudent && totalStudents > 0 && (
                <div className="mb-3.5 p-3 rounded-lg bg-white border border-amber-200/80 shadow-xs">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                    Conflicting Students ({totalStudents})
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1 font-medium list-disc list-inside">
                    {(showAll ? studentNames : sampleNames).map((name, sIdx) => (
                      <li key={sIdx}>{name}</li>
                    ))}
                  </ul>
                  {hasMoreStudents && (
                    <button
                      type="button"
                      onClick={() => toggleStudents(existing.id)}
                      className="flex items-center gap-1 mt-2 text-xs text-amber-700 font-bold hover:text-amber-800 transition-colors"
                    >
                      {showAll ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          View All {totalStudents} Students
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Comparison card */}
              <div className="grid grid-cols-2 gap-3">
                {/* Existing schedule */}
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Existing Schedule
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold">
                        {
                          WEEKDAY_FULL_LABELS[
                            existing.dayOfWeek as keyof typeof WEEKDAY_FULL_LABELS
                          ]
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3" />
                      <span>
                        {existing.startTime} – {existing.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 capitalize">
                      <span className="w-3" />
                      <span>{existing.deliveryMode.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Your new schedule */}
                <div
                  className={`rounded-lg p-3 border
                  ${onlySoftConflict ? 'bg-amber-50/10 border-amber-200' : 'bg-red-50/30 border-red-200'}`}
                >
                  <p
                    className={`text-[10px] font-bold mb-2 uppercase tracking-wider
                    ${onlySoftConflict ? 'text-amber-600' : 'text-red-500'}`}
                  >
                    Your Schedule
                  </p>
                  <div className="space-y-1">
                    {newDayOfWeek && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-800">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold">
                          {WEEKDAY_FULL_LABELS[newDayOfWeek as keyof typeof WEEKDAY_FULL_LABELS]}
                        </span>
                      </div>
                    )}
                    {newStartTime && newEndTime && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="w-3" />
                        <span>
                          {newStartTime} – {newEndTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className={`px-4 py-2.5 border-t
        ${onlySoftConflict ? 'bg-amber-50/30 border-amber-100' : 'bg-red-50/50 border-red-100'}`}
      >
        <p
          className={`text-[11px] font-semibold text-center
          ${onlySoftConflict ? 'text-amber-700' : 'text-red-700'}`}
        >
          {onlySoftConflict
            ? '⚠️ You can bypass this warning and click "Create Anyway" to save.'
            : '❌ Please choose a different time, tutor, or room to resolve the conflict'}
        </p>
      </div>
    </div>
  );
}
