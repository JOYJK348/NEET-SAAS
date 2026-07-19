import { format as dateFnsFormat } from 'date-fns';

export const DEFAULT_DISPLAY_TIMEZONE = 'Asia/Kolkata';

/**
 * Dynamically resolves the user's or browser's display timezone.
 * Defaults to Asia/Kolkata as a standard fallback.
 */
export function getDisplayTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_DISPLAY_TIMEZONE;
  } catch {
    return DEFAULT_DISPLAY_TIMEZONE;
  }
}

/**
 * Formats a UTC timestamp into a dynamic user display timezone.
 * Designed for instant fields such as createdAt, updatedAt, timeline events, etc.
 *
 * @param dateInput The date to format (string, Date, or timestamp)
 * @param formatStr The output pattern to use (defaults to 'MMM d, yyyy h:mm a')
 * @param timeZone Custom target timezone (defaults to dynamic getDisplayTimezone())
 */
export function formatDateTime(
  dateInput: Date | string | null | undefined,
  formatStr: string = 'MMM d, yyyy h:mm a',
  timeZone: string = getDisplayTimezone(),
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  try {
    // Convert to target timezone string representation in USA locale format
    // to build a date instance matching the target timezone offset
    const zonedDateStr = date.toLocaleString('en-US', { timeZone });
    return dateFnsFormat(new Date(zonedDateStr), formatStr);
  } catch {
    // Fallback to formatting the raw date locally
    return dateFnsFormat(date, formatStr);
  }
}

/**
 * Formats a calendar date-only field (e.g. Academic Year startDate/endDate, admissionDate)
 * without shifting days due to timezone offset conversions.
 *
 * @param dateInput The date to format (string, Date)
 * @param formatStr The output pattern to use (defaults to 'MMM d, yyyy')
 */
export function formatDateOnly(
  dateInput: Date | string | null | undefined,
  formatStr: string = 'MMM d, yyyy',
): string {
  if (!dateInput) return '';

  // If it's a date-only string like "2026-06-01", parse it matching local timezone components
  // to avoid shifting dates when converting from UTC
  if (typeof dateInput === 'string') {
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const localDate = new Date(year, month, day);
      return dateFnsFormat(localDate, formatStr);
    }
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return dateFnsFormat(date, formatStr);
}
