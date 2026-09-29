export interface GoogleCalendarUrlOptions {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // "08:00", "8:00 AM", "21:06", "9:06 PM"
  endTime: string;   // "10:00", "10:00 AM", "22:04", "10:04 PM"
  dateStr?: string;  // YYYY-MM-DD or dayOfWeek (e.g. "MONDAY")
  dayOfWeek?: string;
  isRecurring?: boolean;
  untilDate?: string;
  joiningLink?: string;
  attendeeEmails?: string[];
}

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const DAY_CODES: Record<string, string> = {
  SUNDAY: 'SU',
  MONDAY: 'MO',
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
};

function getNextOccurrenceDate(dayOfWeekOrDate?: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!dayOfWeekOrDate) return today;

  if (dayOfWeekOrDate.includes('-')) {
    const [y, m, d] = dayOfWeekOrDate.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }

  const targetDay = DAY_INDEX[dayOfWeekOrDate.toUpperCase()] ?? today.getDay();
  const todayDay = today.getDay();
  const diff = (targetDay - todayDay + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

function parseTimeToHoursMinutes(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 8, minutes: 0 };

  const clean = timeStr.trim();
  const isPM = clean.toUpperCase().includes('PM');
  const isAM = clean.toUpperCase().includes('AM');

  const numbersOnly = clean.replace(/[^\d:]/g, '');
  const parts = numbersOnly.split(':').map(Number);

  let hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function formatLocalCalendarString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

export function generateGoogleCalendarUrl(options: GoogleCalendarUrlOptions): string {
  const baseDayOrDate = options.dateStr || options.dayOfWeek;
  const baseDate = getNextOccurrenceDate(baseDayOrDate);

  const startParsed = parseTimeToHoursMinutes(options.startTime);
  const endParsed = parseTimeToHoursMinutes(options.endTime);

  const start = new Date(baseDate);
  start.setHours(startParsed.hours, startParsed.minutes, 0, 0);

  const end = new Date(baseDate);
  end.setHours(endParsed.hours, endParsed.minutes, 0, 0);

  const startStr = formatLocalCalendarString(start);
  const endStr = formatLocalCalendarString(end);

  const detailsParts = [
    options.description || 'NEET Academy Scheduled Class Session',
    options.joiningLink ? `\n🎥 Live Class Join Link: ${options.joiningLink}` : '',
    '\n📚 NEET Academy Timetable & Calendar Auto-Reminder System',
  ].filter(Boolean);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    details: detailsParts.join('\n'),
    location: options.location || options.joiningLink || 'Academy Live Studio / Classroom',
    dates: `${startStr}/${endStr}`,
    ctz: 'Asia/Kolkata',
  });

  // Weekly recurrence
  if (options.isRecurring) {
    const rawDay = (options.dayOfWeek || options.dateStr || '').toUpperCase();
    const code = DAY_CODES[rawDay] || 'MO';
    let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${code}`;
    if (options.untilDate) {
      const cleanDate = options.untilDate.split('T')[0].replace(/-/g, '');
      if (cleanDate && cleanDate.length === 8) {
        rrule += `;UNTIL=${cleanDate}T235959Z`;
      }
    }
    params.set('recur', rrule);
  }

  // Add guest / attendee emails (tutor + students)
  if (options.attendeeEmails && options.attendeeEmails.length > 0) {
    const validEmails = options.attendeeEmails
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));
    if (validEmails.length > 0) {
      params.set('add', validEmails.join(','));
    }
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
