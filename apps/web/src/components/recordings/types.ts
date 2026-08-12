/**
 * Types matching the Recorded Classes API (`GET /api/v1/recordings`).
 * The web api client already unwraps the `{ success, data }` envelope, so a
 * list call resolves to `RecordingListResponse` directly.
 */

export interface RecordingDisplay {
  courseName: string | null;
  subjectName: string | null;
  chapterName: string | null;
  topicName: string | null;
  batchName: string | null;
  tutorName: string | null;
}

/** Full LiveClasses row attached to each recording (may be null if the class was deleted). */
export interface RecordingLiveClass {
  id: string;
  title: string;
  subtitle?: string | null;
  courseId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  batchId: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface Recording {
  id: string;
  tenantId: string;
  liveClassId: string | null;
  sessionId: string | null;
  status: string;
  statusLabel: string;
  durationSeconds: number | null;
  resolution: string | null;
  fileSizeBytes: number | null;
  rawEgressUrl: string | null;
  storageObjectId: string | null;
  egressId: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  createdAt: string;
  liveClass: RecordingLiveClass | null;
  display: RecordingDisplay | null;
}

export interface RecordingListResponse {
  items: Recording[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RecordingDetailResponse extends Recording {
  playbackUrl: string | null;
}
