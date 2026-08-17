import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface CalendarEventPayload {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO String
  endDateTime: string;   // ISO String
  timeZone?: string;
  joiningLink?: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  /**
   * Creates Google Calendar event with 15-minute native popup reminder override
   */
  async createEvent(
    accessToken: string,
    calendarId = 'primary',
    payload: CalendarEventPayload,
  ): Promise<string> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    const descriptionBody = [
      payload.description || '',
      payload.joiningLink ? `\n🎥 Live Class Joining Link: ${payload.joiningLink}` : '',
      '\n📚 NEET Academy Timetable System',
    ]
      .filter(Boolean)
      .join('\n');

    const body = {
      summary: payload.title,
      description: descriptionBody,
      location: payload.location || payload.joiningLink || undefined,
      start: {
        dateTime: payload.startDateTime,
        timeZone: payload.timeZone || 'Asia/Kolkata',
      },
      end: {
        dateTime: payload.endDateTime,
        timeZone: payload.timeZone || 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 15 }],
      },
    };

    try {
      const res = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return res.data.id;
    } catch (err: any) {
      const googleError = err?.response?.data?.error;
      const message = googleError?.message || err?.message || 'Failed to create Google Calendar event';
      this.logger.error(`Google Calendar API Error [403/Forbidden]: ${JSON.stringify(googleError || err?.response?.data)}`);

      if (err?.response?.status === 403) {
        if (message.includes('has not been used in project') || message.includes('API has not been enabled')) {
          throw new BadRequestException(
            'Google Calendar API is disabled in your Google Cloud Console. Please enable Google Calendar API in GCP Console.',
          );
        }
        throw new BadRequestException(
          `Google Calendar Access Permission Error: ${message}. Please Disconnect & Re-connect your Google Account to update permissions.`,
        );
      }
      throw new BadRequestException(message);
    }
  }

  /**
   * Updates an existing Google Calendar event
   */
  async updateEvent(
    accessToken: string,
    calendarId = 'primary',
    eventId: string,
    payload: CalendarEventPayload,
  ): Promise<void> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    const descriptionBody = [
      payload.description || '',
      payload.joiningLink ? `\n🎥 Live Class Joining Link: ${payload.joiningLink}` : '',
      '\n📚 NEET Academy Timetable System',
    ]
      .filter(Boolean)
      .join('\n');

    const body = {
      summary: payload.title,
      description: descriptionBody,
      location: payload.location || payload.joiningLink || undefined,
      start: {
        dateTime: payload.startDateTime,
        timeZone: payload.timeZone || 'Asia/Kolkata',
      },
      end: {
        dateTime: payload.endDateTime,
        timeZone: payload.timeZone || 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 15 }],
      },
    };

    await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Deletes a Google Calendar event
   */
  async deleteEvent(
    accessToken: string,
    calendarId = 'primary',
    eventId: string,
  ): Promise<void> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    try {
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 410) {
        this.logger.warn(`Google Event ${eventId} already deleted or not found`);
        return;
      }
      throw err;
    }
  }
}
