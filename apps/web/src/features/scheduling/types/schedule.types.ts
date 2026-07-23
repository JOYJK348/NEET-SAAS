export type WeekdayType =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type AttendanceModeType = 'CLASSROOM' | 'ONLINE' | 'HYBRID';
export type ScheduleStatusEnum = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';
export type RoomTypeEnum = 'CLASSROOM' | 'LAB' | 'AUDITORIUM' | 'SEMINAR_HALL' | 'ONLINE';

export interface Room {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  code: string;
  capacity: number;
  roomType: RoomTypeEnum;
  isActive: boolean;
}

export interface ScheduleDetail {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  batchId: string;
  subjectId: string;
  staffProfileId: string;
  dayOfWeek: WeekdayType;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  effectiveFrom: string;
  effectiveUntil: string;
  deliveryMode: AttendanceModeType;
  roomId: string | null;
  meetingProvider: string | null;
  meetingLink: string | null;
  meetingCode: string | null;
  meetingPassword: string | null;
  status: ScheduleStatusEnum;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  room: {
    id: string;
    name: string;
    code: string;
    capacity: number;
    roomType: RoomTypeEnum;
  } | null;
}

export interface ConflictItem {
  type: 'TUTOR' | 'BATCH' | 'ROOM' | 'STUDENT';
  message: string;
  isSoftConflict?: boolean;
  studentNames?: string[];
  existingSchedule: {
    id: string;
    dayOfWeek: WeekdayType;
    startTime: string;
    endTime: string;
    batchId: string;
    subjectId: string;
    staffProfileId: string;
    roomId: string | null;
    deliveryMode: AttendanceModeType;
    batchName?: string;
  };
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictItem[];
}

export type WeeklyViewData = Record<WeekdayType, ScheduleDetail[]>;

export interface CreateSchedulePayload {
  branchId: string;
  academicYearId: string;
  batchId: string;
  subjectId: string;
  staffProfileId: string;
  dayOfWeek: WeekdayType;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string;
  deliveryMode: AttendanceModeType;
  roomId?: string;
  meetingProvider?: string;
  meetingLink?: string;
  meetingCode?: string;
  meetingPassword?: string;
  notes?: string;
  bypassStudentConflict?: boolean;
}

export interface CheckConflictsPayload extends CreateSchedulePayload {
  excludeScheduleId?: string;
}

export interface QueryScheduleParams {
  branchId?: string;
  academicYearId?: string;
  batchId?: string;
  subjectId?: string;
  staffProfileId?: string;
  dayOfWeek?: WeekdayType;
  deliveryMode?: AttendanceModeType;
  status?: ScheduleStatusEnum;
  onDate?: string;
}

export interface QueryRoomParams {
  branchId?: string;
  roomType?: RoomTypeEnum;
  isActive?: boolean;
  search?: string;
}

export const WEEKDAYS: WeekdayType[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const WEEKDAY_LABELS: Record<WeekdayType, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export const WEEKDAY_FULL_LABELS: Record<WeekdayType, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

/** Time slots shown in the weekly grid (every 30 minutes from 06:00–22:00) */
export const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

export const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'indigo',
  Chemistry: 'emerald',
  Biology: 'amber',
  Maths: 'rose',
  English: 'violet',
  default: 'slate',
};
