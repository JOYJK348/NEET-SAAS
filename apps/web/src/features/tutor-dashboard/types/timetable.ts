// ─── Strictly mirrors backend TutorTimetableResponseDto ────────────────────
// Source of truth: apps/api/src/modules/tutor-dashboard/dto/tutor-dashboard-response.dto.ts

interface SubjectDto {
  id: string;
  name: string;
  code: string;
}

interface BatchDto {
  id: string;
  name: string;
  code: string;
}

interface BranchDto {
  id: string;
  name: string;
}

interface RoomDto {
  id: string;
  name: string;
  code: string;
}

interface ScheduleDto {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: RoomDto | null;
}

export interface TimetableSessionDto {
  id: string;
  startsAt: string; // HH:mm
  endsAt: string; // HH:mm
  subject?: SubjectDto | null;
  batch?: BatchDto | null;
  branch?: BranchDto | null;
  room?: RoomDto | null;
  sessionStatus: string; // SCHEDULED, COMPLETED, CANCELLED, DRAFT
  sessionSource?: string | null;
  overrideType?: string | null;
  cancelledReason?: string | null;
  schedule?: ScheduleDto | null;
  deliveryMode?: string | null;
  liveStatus?: string | null;
  canJoin?: boolean;
}

export interface TimetableDayDto {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. "Monday"
  sessions: TimetableSessionDto[];
}

export interface TutorTimetableResponseDto {
  fromDate: string;
  toDate: string;
  timetable: TimetableDayDto[];
}
