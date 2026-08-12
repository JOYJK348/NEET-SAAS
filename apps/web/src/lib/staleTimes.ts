/**
 * Centralized Category-Based staleTime Configuration (in milliseconds)
 * 
 * Rules:
 * - MASTERS: 30 min (Static reference data like Courses, Subjects, Branches)
 * - BATCHES: 10 min (Active batch schedules, academic mappings)
 * - STUDENTS: 5 min (Enrolled student rosters & status)
 * - RECORDINGS: 2 min (Lecture recordings & split topic titles)
 * - TIMETABLE: 1 min (Weekly schedules)
 * - ATTENDANCE: 30 sec (Dynamic real-time presence marking & sync)
 * - LIVE_CLASSES: 15 sec (High dynamic real-time studio status)
 * - PERMISSIONS: 0 sec (SECURITY GUARD: Always revalidate auth/roles)
 */
export const STALE_TIMES = {
  MASTERS: 30 * 60 * 1000,      // 30 minutes
  BATCHES: 10 * 60 * 1000,      // 10 minutes
  STUDENTS: 5 * 60 * 1000,      // 5 minutes
  RECORDINGS: 2 * 60 * 1000,    // 2 minutes
  TIMETABLE: 1 * 60 * 1000,     // 1 minute
  ATTENDANCE: 30 * 1000,        // 30 seconds
  LIVE_CLASSES: 15 * 1000,      // 15 seconds
  DEFAULT: 5 * 60 * 1000,       // 5 minutes
  PERMISSIONS: 0,               // ALWAYS REVALIDATE (Security Guard)
} as const;
