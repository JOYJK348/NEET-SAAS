import { api } from '@/lib/api';
import {
  Room,
  ScheduleDetail,
  WeeklyViewData,
  ConflictResult,
  CreateSchedulePayload,
  CheckConflictsPayload,
  QueryScheduleParams,
  QueryRoomParams,
} from '../types/schedule.types';

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const getRooms = async (params?: QueryRoomParams): Promise<Room[]> => {
  const filtered = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    : {};
  return api.get<Room[]>('/scheduling/rooms', { params: filtered });
};

export const createRoom = async (data: Partial<Room>): Promise<Room> => {
  return api.post<Room>('/scheduling/rooms', data);
};

export const updateRoom = async (id: string, data: Partial<Room>): Promise<Room> => {
  return api.patch<Room>(`/scheduling/rooms/${id}`, data);
};

export const deleteRoom = async (id: string): Promise<void> => {
  return api.delete<void>(`/scheduling/rooms/${id}`);
};

// ─── Schedules ────────────────────────────────────────────────────────────────

export const getSchedules = async (params?: QueryScheduleParams): Promise<ScheduleDetail[]> => {
  const filtered = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    : {};
  return api.get<ScheduleDetail[]>('/scheduling/schedules', { params: filtered });
};

export const getWeeklyView = async (params?: QueryScheduleParams): Promise<WeeklyViewData> => {
  const filtered = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    : {};
  return api.get<WeeklyViewData>('/scheduling/schedules/weekly-view', {
    params: filtered,
  });
};

export const getSchedule = async (id: string): Promise<ScheduleDetail> => {
  return api.get<ScheduleDetail>(`/scheduling/schedules/${id}`);
};

export const checkConflicts = async (payload: CheckConflictsPayload): Promise<ConflictResult> => {
  return api.post<ConflictResult>('/scheduling/schedules/check-conflicts', payload);
};

export const createSchedule = async (payload: CreateSchedulePayload): Promise<ScheduleDetail> => {
  return api.post<ScheduleDetail>('/scheduling/schedules', payload);
};

export const updateSchedule = async (
  id: string,
  payload: Partial<CreateSchedulePayload>,
): Promise<ScheduleDetail> => {
  return api.patch<ScheduleDetail>(`/scheduling/schedules/${id}`, payload);
};

export const deleteSchedule = async (id: string): Promise<void> => {
  return api.delete<void>(`/scheduling/schedules/${id}`);
};

export const checkEnrollmentConflict = async (
  studentProfileId: string,
  newBatchId: string,
  excludeAdmissionId?: string,
): Promise<ConflictResult> => {
  return api.get<ConflictResult>('/scheduling/schedules/check-enrollment-conflict', {
    params: { studentProfileId, newBatchId, excludeAdmissionId },
  });
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type OverrideScope = 'ONLY_THIS' | 'THIS_AND_FUTURE' | 'ENTIRE_SERIES';

export interface OverrideSessionPayload {
  scope: OverrideScope;
  staffProfileId?: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  roomId?: string;
  cancel?: boolean;
  reason?: string;
}

export interface CreateExtraSessionPayload {
  batchId: string;
  subjectId: string;
  staffProfileId: string;
  branchId: string;
  academicYearId: string;
  attendanceDate: string;
  startsAt: string;
  endsAt: string;
  deliveryMode: string;
  roomId?: string;
  meetingLink?: string;
  remarks?: string;
}

export const getSession = async (id: string): Promise<any> =>
  api.get<any>(`/scheduling/sessions/${id}`);

export const overrideSession = async (id: string, payload: OverrideSessionPayload): Promise<any> =>
  api.patch<any>(`/scheduling/sessions/${id}/override`, payload);

export const createExtraSession = async (payload: CreateExtraSessionPayload): Promise<any> =>
  api.post<any>('/scheduling/sessions/extra', payload);

export const getSessionHistory = async (id: string): Promise<any[]> =>
  api.get<any[]>(`/scheduling/sessions/${id}/history`);
