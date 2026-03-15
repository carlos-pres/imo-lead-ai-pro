// Google Calendar Per-User OAuth Integration

import { google } from "googleapis";
import crypto from "crypto";
import * as storage from "../storage.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";

const REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://imoleadaipro.com/api/google-calendar/callback"
    : "http://localhost:5000/api/google-calendar/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const STATE_EXPIRY_MS = 10 * 60 * 1000;

export function isGoogleOAuthConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

/* ================= STATE ================= */

function generateSignedState(customerId: string): string {
  const timestamp = Date.now();
  const payload = `${customerId}:${timestamp}`;

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex")
    .substring(0, 16);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function validateSignedState(state: string) {
  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const [customerId, timestampStr, signature] = decoded.split(":");

    const timestamp = Number(timestampStr);

    if (Date.now() - timestamp > STATE_EXPIRY_MS) {
      return { valid: false, customerId: "" };
    }

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(`${customerId}:${timestamp}`)
      .digest("hex")
      .substring(0, 16);

    if (signature !== expectedSignature) {
      return { valid: false, customerId: "" };
    }

    return { valid: true, customerId };
  } catch {
    return { valid: false, customerId: "" };
  }
}

/* ================= AUTH URL ================= */

export function getAuthUrl(customerId: string) {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: generateSignedState(customerId),
  });
}

/* ================= CALLBACK ================= */

export async function handleCallback(code: string, customerId: string) {
  try {
    const oauth2Client = getOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // guardamos apenas o token atual
    await storage.updateCustomer(customerId, {
      googleAccessToken: tokens.access_token,
    });

    return true;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return false;
  }
}

/* ================= CLIENT ================= */

async function getAccessToken(customerId: string): Promise<string | null> {
  const customer = await storage.getCustomer(customerId);

  if (!customer) return null;

  return (customer as any).googleAccessToken || null;
}

export async function getCalendarClientForCustomer(customerId: string) {
  const accessToken = await getAccessToken(customerId);

  if (!accessToken) {
    throw new Error("Calendar not connected");
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.calendar({ version: "v3", auth });
}

/* ================= EVENTS ================= */

export interface CalendarEvent {
  id?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export async function listEventsForCustomer(customerId: string) {
  const calendar = await getCalendarClientForCustomer(customerId);

  const res = await calendar.events.list({
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items || []).map((e) => ({
    id: e.id || undefined,
    title: e.summary || "",
    startTime: new Date(e.start?.dateTime || ""),
    endTime: new Date(e.end?.dateTime || ""),
    description: e.description || undefined,
  }));
}

export async function createEventForCustomer(
  customerId: string,
  event: CalendarEvent
) {
  const calendar = await getCalendarClientForCustomer(customerId);

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
      },
      end: {
        dateTime: event.endTime.toISOString(),
      },
    },
  });

  return {
    id: res.data.id,
    title: res.data.summary || "",
    startTime: new Date(res.data.start?.dateTime || ""),
    endTime: new Date(res.data.end?.dateTime || ""),
  };
}