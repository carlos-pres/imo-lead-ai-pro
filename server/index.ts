import { createServer } from "http";
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './lib/stripeClient';
import { WebhookHandlers } from './lib/webhookHandlers';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRateLimiter } from './middleware/rateLimit';
import { sanitizeInputs } from './middleware/sanitize';
import { logSecurityEvent, logError } from './lib/logger';
import { startScheduler } from './lib/scheduledSearches';

const app = express();

// Trust proxy for rate limiting behind Replit's proxy
app.set('trust proxy', 1);

// Hide Express server signature
app.disable('x-powered-by');

// Cookie parser for CSRF
app.use(cookieParser());

// CORS configuration - secure for production
const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.REPLIT_DOMAINS?.split(',').map(d => `https://${d}`) || ['https://imo-lead-ai-pro.replit.app'])
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Apply general rate limiting to all API routes
app.use('/api/', apiRateLimiter);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

async function initStripe(retries = 3, delay = 2000) {
  const databaseUrl = process.env.DATABASE_URL;
  const replitDomains = process.env.REPLIT_DOMAINS;

  // Skip Stripe initialization if required environment variables are missing
  if (!databaseUrl) {
    console.log('[Stripe] Skipping initialization - DATABASE_URL not set');
    return;
  }

  if (!replitDomains) {
    console.log('[Stripe] Skipping webhook setup - REPLIT_DOMAINS not set');
    // Still run migrations but skip webhook setup
    try {
      await runMigrations({ databaseUrl });
      const stripeSync = await getStripeSync();
      stripeSync.syncBackfill().catch(() => {});
    } catch (error) {
      console.log('[Stripe] Migration/sync skipped:', error instanceof Error ? error.message : 'Unknown error');
    }
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await runMigrations({ databaseUrl });

      const stripeSync = await getStripeSync();

      const webhookBaseUrl = `https://${replitDomains.split(',')[0]}`;
      await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ['*'],
          description: 'Managed webhook for ImoLead AI Pro',
        }
      );

      stripeSync.syncBackfill().catch(() => {});
      console.log('[Stripe] Initialization complete');
      return;
    } catch (error: any) {
      if (attempt < retries && error?.code === '08P01') {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      } else if (attempt === retries) {
        console.log('[Stripe] Initialization failed after retries, will retry on next request');
      }
    }
  }
}

setTimeout(() => initStripe().catch(() => {}), 1000);

app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Sanitize all inputs to prevent XSS
app.use(sanitizeInputs);

// Security headers middleware
app.use((req, res, next) => {
  // Strict-Transport-Security (HSTS) - always enabled with preload
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content-Security-Policy - secure baseline for SPA
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://api.openai.com wss://*.replit.dev wss://*.replit.app",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  // X-Frame-Options - prevent clickjacking (DENY for maximum protection)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options - prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer-Policy - control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy - comprehensive feature restrictions
  res.setHeader('Permissions-Policy', 'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(self), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()');
  
  // X-XSS-Protection - legacy XSS protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Cross-Origin headers for additional isolation
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  next();
});

// Suspicious activity detection and logging with Winston
app.use((req, res, next) => {
  const suspiciousPatterns = /<script|javascript:|onerror=|onclick=|onload=|eval\(|\.\.\/|\.\.\\|union\s+select|drop\s+table/i;
  
  const checkSuspicious = (obj: Record<string, any>, source: string) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && suspiciousPatterns.test(obj[key])) {
        logSecurityEvent('SUSPICIOUS_INPUT', {
          ip: req.ip,
          source,
          field: key,
          path: req.path,
          method: req.method,
          userAgent: req.get('user-agent')
        });
      }
    }
  };
  
  if (req.body && typeof req.body === 'object') checkSuspicious(req.body, 'body');
  if (req.query && typeof req.query === 'object') checkSuspicious(req.query as Record<string, any>, 'query');
  if (req.params) checkSuspicious(req.params, 'params');
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") && res.statusCode >= 400) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";

  logError(`${status}: ${message}`, err);

  if (!res.headersSent) {
    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
};

(async () => {
  await registerRoutes(app);
const server = createServer(app);

   app.use(errorHandler);

    process.on('uncaughtException', (error) => {
    logError('UNCAUGHT EXCEPTION', error);
  });

  process.on('unhandledRejection', (reason) => {
    logError('UNHANDLED REJECTION', reason);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the scheduled search scheduler for daily lead generation
    startScheduler();
  });
})();
