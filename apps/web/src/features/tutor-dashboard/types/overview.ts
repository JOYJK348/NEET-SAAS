// ─── Strictly mirrors backend TutorOverviewResponseDto ─────────────────────
// Source of truth: apps/api/src/modules/tutor-dashboard/dto/tutor-dashboard-response.dto.ts
// No frontend-extended fields. No mock data.

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
}

export interface BatchDto {
  id: string;
  name: string;
  code: string;
}

export interface BranchDto {
  id: string;
  name: string;
}

export interface TutorialSessionDto {
  id: string;
  date: string; // ISO date string from backend
  startsAt: string; // HH:mm format
  endsAt: string; // HH:mm format
  subject?: SubjectDto | null;
  batch?: BatchDto | null;
  branch?: BranchDto | null;
  sessionStatus: string; // e.g. SCHEDULED, DRAFT, CANCELLED, COMPLETED
  sessionSource?: string | null;
  overrideType?: string | null;
  cancelledReason?: string | null;
  dayOfWeek: string | null;
  liveStatus?: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED';
  deliveryMode?: string | null;
  meetingLink?: string | null;
  canJoin?: boolean;
}

export interface TutorOverviewStatsDto {
  todaysClasses: number;
  upcomingClasses: number;
  myBatches: number;
  totalStudents: number;
}

export interface TutorOverviewResponseDto {
  stats: TutorOverviewStatsDto;
  todaysSchedule: TutorialSessionDto[];
  upcomingSchedule: TutorialSessionDto[];
  liveNow?: TutorialSessionDto[];
}
