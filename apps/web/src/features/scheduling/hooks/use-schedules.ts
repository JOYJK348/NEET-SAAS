'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 2 * 60 * 1000,
  });
}

export function useWeeklyView(params?: QueryScheduleParams) {
  return useQuery({
    queryKey: scheduleKeys.weeklyView(params),
    queryFn: () => getWeeklyView(params),
    staleTime: 2 * 60 * 1000,
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

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createSchedule(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSchedulePayload> }) =>
      updateSchedule(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
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
