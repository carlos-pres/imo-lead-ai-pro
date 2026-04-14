import crypto from "crypto";
import { google } from "googleapis";
import * as storage from "../storage.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || "http://localhost:3000";

const REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? `${APP_BASE_URL}/api/calendar/google/callback`
    : "http://localhost:5000/api/calendar/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const STATE_EXPIRY_MS = 10 * 60 * 1000;

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

function generateSignedState(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function validateSignedState(state: string) {
  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const [userId, timestampStr, signature] = decoded.split(":");
    const timestamp = Number(timestampStr);

    if (!userId || !Number.isFinite(timestamp)) {
      return { valid: false, userId: "" };
    }

    if (Date.now() - timestamp > STATE_EXPIRY_MS) {
      return { valid: false, userId: "" };
    }

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(`${userId}:${timestamp}`)
      .digest("hex")
      .slice(0, 16);

    return {
      valid: signature === expectedSignature,
      userId: signature === expectedSignature ? userId : "",
    };
  } catch {
    return { valid: false, userId: "" };
  }
}

export function getAuthUrl(userId: string) {
  const client = getOAuth2Client();

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: generateSignedState(userId),
  });
}

export async function handleCallback(code: string, userId: string) {
  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    await storage.updateWorkspaceUserGoogleAccessToken(userId, tokens.access_token);
    return true;
  } catch (error) {
    console.error("Google Calendar OAuth error:", error);
    return false;
  }
}

async function getAccessToken(userId: string): Promise<string | null> {
  return storage.getWorkspaceUserGoogleAccessToken(userId);
}

async function getCalendarClientForUser(userId: string) {
  const accessToken = await getAccessToken(userId);

  if (!accessToken) {
    throw new Error("Calendar not connected");
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.calendar({ version: "v3", auth });
}

export interface CalendarEvent {
  id?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  attendees?: string[];
}

export async function listEventsForUser(userId: string) {
  const calendar = await getCalendarClientForUser(userId);
  const response = await calendar.events.list({
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((event) => ({
    id: event.id || undefined,
    title: event.summary || "Sem titulo",
    startTime: new Date(event.start?.dateTime || event.start?.date || ""),
    endTime: new Date(event.end?.dateTime || event.end?.date || ""),
    description: event.description || undefined,
    location: event.location || undefined,
    attendees: event.attendees?.map((item) => item.email || "").filter(Boolean),
  }));
}

export async function createEventForUser(userId: string, event: CalendarEvent) {
  const calendar = await getCalendarClientForUser(userId);
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: "Europe/Lisbon",
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: "Europe/Lisbon",
      },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  });

  return {
    id: response.data.id || undefined,
    title: response.data.summary || event.title,
    startTime: new Date(response.data.start?.dateTime || response.data.start?.date || event.startTime),
    endTime: new Date(response.data.end?.dateTime || response.data.end?.date || event.endTime),
    description: response.data.description || event.description,
    location: response.data.location || event.location,
  };
}
