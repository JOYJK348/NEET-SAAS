'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/staleTimes';
import {
  getSchedules,
  getWeeklyView,
  getSchedule,
  checkConflicts,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  checkEnrollmentConflict,
} from '../services/schedule-service';
import {
  QueryScheduleParams,
  QueryRoomParams,
  CreateSchedulePayload,
  CheckConflictsPayload,
} from '../types/schedule.types';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const scheduleKeys = {
  all: ['schedules'] as const,
  list: (params?: QueryScheduleParams) => ['schedules', 'list', params] as const,
  weeklyView: (params?: QueryScheduleParams) => ['schedules', 'weekly-view', params] as const,
  detail: (id: string) => ['schedules', 'detail', id] as const,
};

export const roomKeys = {
  all: ['rooms'] as const,
  list: (params?: QueryRoomParams) => ['rooms', 'list', params] as const,
};

// ─── Rooms hooks ──────────────────────────────────────────────────────────────

export function useRooms(params?: QueryRoomParams) {
  return useQuery({
    queryKey: roomKeys.list(params),
    queryFn: () => getRooms(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createRoom>[0]) => createRoom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateRoom>[1] }) =>
      updateRoom(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

// ─── Schedule hooks ───────────────────────────────────────────────────────────

export function useSchedules(params?: QueryScheduleParams) {
  return useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: () => getSchedules(params),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });
}

export function useWeeklyView(params?: QueryScheduleParams) {
  return useQuery({
    queryKey: scheduleKeys.weeklyView(params),
    queryFn: () => getWeeklyView(params),
    staleTime: STALE_TIMES.TIMETABLE,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  });
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => getSchedule(id),
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook for conflict checking.
 * Returns { mutate, data, isPending, isError } — data contains ConflictResult.
 */
export function useCheckConflicts() {
  return useMutation({
    mutationFn: (payload: CheckConflictsPayload) => checkConflicts(payload),
  });
}

export function invalidateAllScheduleQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: scheduleKeys.all });
  qc.invalidateQueries({ queryKey: ['tutor-overview'] });
  qc.invalidateQueries({ queryKey: ['student-overview'] });
  qc.invalidateQueries({ queryKey: ['tutor-timetable'] });
  qc.invalidateQueries({ queryKey: ['student-timetable'] });
  qc.invalidateQueries({ queryKey: ['student-dashboard'] });
  qc.invalidateQueries({ queryKey: ['live-classes'] });
  qc.invalidateQueries({ queryKey: ['timetable'] });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('schedule-updated'));
    try {
      const bc = new BroadcastChannel('neet-platform-schedule-sync');
      bc.postMessage({ type: 'SCHEDULE_UPDATED', timestamp: Date.now() });
      bc.close();
    } catch {}
  }
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createSchedule(payload),
    onSuccess: () => {
      invalidateAllScheduleQueries(qc);
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSchedulePayload> }) =>
      updateSchedule(id, payload),
    onSuccess: () => {
      invalidateAllScheduleQueries(qc);
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      invalidateAllScheduleQueries(qc);
    },
  });
}

export function useCheckEnrollmentConflict() {
  return useMutation({
    mutationFn: ({
      studentProfileId,
      newBatchId,
      excludeAdmissionId,
    }: {
      studentProfileId: string;
      newBatchId: string;
      excludeAdmissionId?: string;
    }) => checkEnrollmentConflict(studentProfileId, newBatchId, excludeAdmissionId),
  });
}
