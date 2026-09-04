export interface ClassSessionLike {
  id?: string;
  sessionStatus?: string;
  liveStatus?: string;
  status?: string;
  date?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  canJoin?: boolean;
}

export interface ClassStatusResult {
  canJoin: boolean;
  isEnded: boolean;
  isUpcoming: boolean;
  isCancelled: boolean;
  isLive: boolean;
  buttonLabel: string;
  statusBadgeText: string;
}

export function getClassStatus(
  session: ClassSessionLike,
  options?: { isTutor?: boolean },
): ClassStatusResult {
  const statusStr = (
    session.sessionStatus ||
    session.liveStatus ||
    session.status ||
    ''
  ).toUpperCase();
  const isCancelled = statusStr === 'CANCELLED';

  if (isCancelled) {
    return {
      canJoin: false,
      isEnded: false,
      isUpcoming: false,
      isCancelled: true,
      isLive: false,
      buttonLabel: 'Class Cancelled',
      statusBadgeText: 'CANCELLED',
    };
  }

  // Explicitly completed/ended status
  if (['COMPLETED', 'ENDED', 'LOCKED', 'EXPIRED'].includes(statusStr)) {
    return {
      canJoin: false,
      isEnded: true,
      isUpcoming: false,
      isCancelled: false,
      isLive: false,
      buttonLabel: 'Class Ended ⏱',
      statusBadgeText: 'COMPLETED',
    };
  }

  const now = new Date();

  // Parse scheduledEnd / endsAt
  let endMs: number | null = null;
  let startMs: number | null = null;

  if (session.scheduledEnd) {
    const t = new Date(session.scheduledEnd).getTime();
    if (!isNaN(t)) endMs = t;
  }
  if (session.scheduledStart) {
    const t = new Date(session.scheduledStart).getTime();
    if (!isNaN(t)) startMs = t;
  }

  const sessionDateStr = session.date
    ? session.date.includes('T')
      ? session.date.split('T')[0]
      : session.date
    : null;

  if (!endMs && session.endsAt) {
    if (session.endsAt.includes('T')) {
      const t = new Date(session.endsAt).getTime();
      if (!isNaN(t)) endMs = t;
    } else if (session.endsAt.includes(':')) {
      const [h, m] = session.endsAt.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const d = sessionDateStr ? new Date(sessionDateStr) : new Date();
        d.setHours(h, m, 0, 0);
        endMs = d.getTime();
      }
    }
  }

  if (!startMs && session.startsAt) {
    if (session.startsAt.includes('T')) {
      const t = new Date(session.startsAt).getTime();
      if (!isNaN(t)) startMs = t;
    } else if (session.startsAt.includes(':')) {
      const [h, m] = session.startsAt.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const d = sessionDateStr ? new Date(sessionDateStr) : new Date();
        d.setHours(h, m, 0, 0);
        startMs = d.getTime();
      }
    }
  }

  // 15 minutes grace period after scheduledEnd / endsAt (strictly for already-in-class users)
  const graceMs = 15 * 60 * 1000;
  const isScheduledEndPassed = endMs ? now.getTime() >= endMs : false;
  const isGraceExpired = endMs ? now.getTime() >= endMs + graceMs : false;

  // After 15-minute grace period has passed -> class is fully ended for everyone
  if (isGraceExpired) {
    return {
      canJoin: false,
      isEnded: true,
      isUpcoming: false,
      isCancelled: false,
      isLive: false,
      buttonLabel: 'Class Ended ⏱',
      statusBadgeText: 'COMPLETED',
    };
  }

  const isLive = ['LIVE_NOW', 'LIVE', 'STARTED', 'IN_PROGRESS'].includes(statusStr);

  // Scheduled end time reached -> NO NEW JOINS ALLOWED!
  if (isScheduledEndPassed) {
    return {
      canJoin: false,
      isEnded: false,
      isUpcoming: false,
      isCancelled: false,
      isLive: isLive,
      buttonLabel: 'Class Ended ⏱',
      statusBadgeText: isLive ? 'GRACE PERIOD' : 'ENDED',
    };
  }

  // Check if session date is in the past (e.g. yesterday or earlier)
  if (sessionDateStr) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (sessionDateStr < todayStr && !isLive) {
      return {
        canJoin: false,
        isEnded: true,
        isUpcoming: false,
        isCancelled: false,
        isLive: false,
        buttonLabel: 'Class Ended ⏱',
        statusBadgeText: 'COMPLETED',
      };
    }
  }

  // Check if starting in future (before scheduledStart and not live)
  const startWindowMs = startMs ? startMs : null;
  const isUpcoming = !isLive && startWindowMs !== null && now.getTime() < startWindowMs;

  if (isUpcoming) {
    const startTimeDisplay = session.startsAt
      ? session.startsAt
      : startMs
        ? new Date(startMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
    return {
      canJoin: false,
      isEnded: false,
      isUpcoming: true,
      isCancelled: false,
      isLive: false,
      buttonLabel: `Upcoming (${startTimeDisplay}) ⏳`,
      statusBadgeText: 'SCHEDULED',
    };
  }

  // Active window before scheduledEnd
  const canJoin =
    isLive || session.canJoin === true || !startWindowMs || now.getTime() >= startWindowMs;

  const actionVerb = options?.isTutor
    ? isLive
      ? 'Join Live Class 🎥'
      : 'Start Live Class 🚀'
    : 'Join Class 🚀';

  return {
    canJoin,
    isEnded: false,
    isUpcoming: false,
    isCancelled: false,
    isLive: isLive,
    buttonLabel: canJoin ? actionVerb : 'Class Ended ⏱',
    statusBadgeText: isLive ? 'LIVE NOW' : 'SCHEDULED',
  };
}
