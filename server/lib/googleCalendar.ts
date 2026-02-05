// Google Calendar Integration - Connected via Replit Connector
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!hostname || !xReplitToken) {
      return false;
    }

    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    
    const data = await response.json();
    const connection = data.items?.[0];
    
    return !!(connection?.settings?.access_token || connection?.settings?.oauth?.credentials?.access_token);
  } catch (error) {
    console.error('Error checking Google Calendar connection:', error);
    return false;
  }
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

export async function listEvents(timeMin?: Date, timeMax?: Date, maxResults = 50): Promise<CalendarEvent[]> {
  const calendar = await getGoogleCalendarClient();
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (timeMin || new Date()).toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []).map(event => ({
    id: event.id || undefined,
    title: event.summary || 'Sem título',
    description: event.description || undefined,
    startTime: new Date(event.start?.dateTime || event.start?.date || ''),
    endTime: new Date(event.end?.dateTime || event.end?.date || ''),
    location: event.location || undefined,
    attendees: event.attendees?.map(a => a.email || '').filter(Boolean),
  }));
}

export async function createEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const calendar = await getGoogleCalendarClient();
  
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      attendees: event.attendees?.map(email => ({ email })),
    },
  });

  return {
    id: response.data.id || undefined,
    title: response.data.summary || event.title,
    description: response.data.description || undefined,
    startTime: new Date(response.data.start?.dateTime || response.data.start?.date || event.startTime),
    endTime: new Date(response.data.end?.dateTime || response.data.end?.date || event.endTime),
    location: response.data.location || undefined,
  };
}

export async function updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const calendar = await getGoogleCalendarClient();
  
  const updateData: any = {};
  if (event.title) updateData.summary = event.title;
  if (event.description !== undefined) updateData.description = event.description;
  if (event.location !== undefined) updateData.location = event.location;
  if (event.startTime) {
    updateData.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: 'Europe/Lisbon',
    };
  }
  if (event.endTime) {
    updateData.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: 'Europe/Lisbon',
    };
  }

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: updateData,
  });

  return {
    id: response.data.id || undefined,
    title: response.data.summary || '',
    description: response.data.description || undefined,
    startTime: new Date(response.data.start?.dateTime || response.data.start?.date || ''),
    endTime: new Date(response.data.end?.dateTime || response.data.end?.date || ''),
    location: response.data.location || undefined,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = await getGoogleCalendarClient();
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

export async function getFreeBusy(timeMin: Date, timeMax: Date): Promise<{ start: Date; end: Date }[]> {
  const calendar = await getGoogleCalendarClient();
  
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }],
    },
  });

  const busy = response.data.calendars?.primary?.busy || [];
  return busy.map(slot => ({
    start: new Date(slot.start || ''),
    end: new Date(slot.end || ''),
  }));
}
