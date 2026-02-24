// Google Calendar Per-User OAuth Integration
import { google } from 'googleapis';
import crypto from 'crypto';
import { storage } from '../storage.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-dev-secret';
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://imoleadaipro.com/api/google-calendar/callback'
  : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/google-calendar/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function isGoogleOAuthConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

function generateSignedState(customerId: string): string {
  const timestamp = Date.now();
  const data = `${customerId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex')
    .substring(0, 16);
  return Buffer.from(`${data}:${signature}`).toString('base64url');
}

export function validateSignedState(state: string): { customerId: string; valid: boolean } {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return { customerId: '', valid: false };
    }
    
    const [customerId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    if (Date.now() - timestamp > STATE_EXPIRY_MS) {
      console.log('[GoogleCalendar] State expired');
      return { customerId, valid: false };
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${customerId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16);
    
    if (signature !== expectedSignature) {
      console.log('[GoogleCalendar] Invalid state signature');
      return { customerId, valid: false };
    }
    
    return { customerId, valid: true };
  } catch (error) {
    console.error('[GoogleCalendar] State validation error:', error);
    return { customerId: '', valid: false };
  }
}

export function getAuthUrl(customerId: string): string {
  const oauth2Client = getOAuth2Client();
  const signedState = generateSignedState(customerId);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: signedState,
  });
}

export async function handleCallback(code: string, customerId: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    const customer = await storage.getCustomer(customerId);
    const existingRefreshToken = customer?.googleRefreshToken;
    
    await storage.updateCustomer(customerId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || existingRefreshToken || undefined,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      googleCalendarConnected: true,
    });

    console.log(`[GoogleCalendar] Customer ${customerId} connected successfully`);
    return true;
  } catch (error) {
    console.error('[GoogleCalendar] OAuth callback error:', error);
    return false;
  }
}

export async function disconnectCalendar(customerId: string): Promise<boolean> {
  try {
    await storage.updateCustomer(customerId, {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendarConnected: false,
    });
    
    console.log(`[GoogleCalendar] Customer ${customerId} disconnected`);
    return true;
  } catch (error) {
    console.error('[GoogleCalendar] Disconnect error:', error);
    return false;
  }
}

async function getValidAccessToken(customerId: string): Promise<string | null> {
  const customer = await storage.getCustomer(customerId);
  
  if (!customer?.googleAccessToken) {
    return null;
  }

  const now = new Date();
  const expiry = customer.googleTokenExpiry ? new Date(customer.googleTokenExpiry) : null;

  if (expiry && expiry > now) {
    return customer.googleAccessToken;
  }

  if (!customer.googleRefreshToken) {
    console.log('[GoogleCalendar] No refresh token available, disconnecting');
    await disconnectCalendar(customerId);
    return null;
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: customer.googleRefreshToken,
    });

    const tokenResponse = await oauth2Client.getAccessToken();
    const newAccessToken = tokenResponse.token;
    
    if (!newAccessToken) {
      throw new Error('Failed to refresh access token');
    }

    const credentials = oauth2Client.credentials;
    const updateData: any = {
      googleAccessToken: newAccessToken,
    };
    
    if (credentials.expiry_date) {
      updateData.googleTokenExpiry = new Date(credentials.expiry_date);
    }
    
    if (credentials.refresh_token && credentials.refresh_token !== customer.googleRefreshToken) {
      updateData.googleRefreshToken = credentials.refresh_token;
    }

    await storage.updateCustomer(customerId, updateData);

    return newAccessToken;
  } catch (error) {
    console.error('[GoogleCalendar] Token refresh error:', error);
    await disconnectCalendar(customerId);
    return null;
  }
}

export async function getCalendarClientForCustomer(customerId: string) {
  const accessToken = await getValidAccessToken(customerId);
  
  if (!accessToken) {
    throw new Error('Google Calendar not connected');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function isCustomerCalendarConnected(customerId: string): Promise<boolean> {
  const customer = await storage.getCustomer(customerId);
  return customer?.googleCalendarConnected === true && !!customer?.googleAccessToken;
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

export async function listEventsForCustomer(
  customerId: string,
  timeMin?: Date,
  timeMax?: Date,
  maxResults = 50
): Promise<CalendarEvent[]> {
  const calendar = await getCalendarClientForCustomer(customerId);
  
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

export async function createEventForCustomer(
  customerId: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  const calendar = await getCalendarClientForCustomer(customerId);
  
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

export async function updateEventForCustomer(
  customerId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const calendar = await getCalendarClientForCustomer(customerId);
  
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

export async function deleteEventForCustomer(customerId: string, eventId: string): Promise<void> {
  const calendar = await getCalendarClientForCustomer(customerId);
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

export async function getFreeBusyForCustomer(
  customerId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ start: Date; end: Date }[]> {
  const calendar = await getCalendarClientForCustomer(customerId);
  
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
