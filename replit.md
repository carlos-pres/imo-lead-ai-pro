# ImoLead AI Pro

## Overview

ImoLead AI Pro is an intelligent real estate lead management platform tailored for the Portuguese market. It automates lead generation through web scraping, uses AI for lead classification and scoring, and provides comprehensive tools for managing client interactions and appointments. The platform aims to streamline the sales pipeline for real estate professionals by identifying high-potential leads. It offers a dual interface: a marketing website for client acquisition and a dashboard for daily lead management. The project's vision is to become the leading AI-powered solution for real estate lead management in Portugal, enhancing efficiency and sales for agencies and agents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Technology Stack:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, Tailwind CSS with shadcn/ui.

**Design System:** Custom "new-york" shadcn theme, Inter and JetBrains Mono fonts, dark/light theme support, component-based architecture using Radix UI primitives.

**Key Features:**
- **Marketing Pages:** Home, Pricing, Legal (Privacy Policy, Terms of Service, Security).
- **Dashboard:** Lead management interface with statistics, charts, lead tables.
- **CRM Pro Module (Pro plan):** Lead selector, message composer (WhatsApp, Email), customizable message templates, interaction timeline, quick stats.
- **Admin Panel:** Payment monitoring, subscription management, customer list.
- **Store:** Stripe-integrated storefront for subscription purchases.
- **GDPR Compliance:** CookieConsent banner, legal pages, data controller information.

### Backend

**Server Framework:** Express.js with TypeScript, RESTful API design.

**Security:**
- **Headers:** Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Input Security:** Global sanitization (sanitize-html), form validation (express-validator), suspicious activity detection (XSS, SQL injection, path traversal), structured security logging.
- **Authentication:** bcrypt password hashing with timing attack prevention, token-based authentication (JWT-like), CSRF-safe.
- **Rate Limiting:** Configurable limits for authentication and general API endpoints.

**Authentication System:** JWT-like token authentication, AuthContext for global state, protected routes, token storage in localStorage.

**API Endpoints:**
- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/verify`, `POST /api/auth/forgot-password`, `GET /api/auth/verify-reset-token`, `POST /api/auth/reset-password`.
- Automation: `POST /api/automation/run-search`, `GET /api/automation/status/:customerId`.
- Leads: `POST /api/leads`, `GET /api/leads`, CRUD operations.

**Storage Layer:** Pluggable `IStorage` interface supporting in-memory (dev) and PostgreSQL (prod) via Drizzle ORM.

### Data Architecture

**Database (PostgreSQL with Drizzle ORM):**
- **Leads:** Name, property details, contact, AI analysis (score, reasoning, status), metadata.
- **Message Templates:** Customizable templates with variable substitution.
- **Calendar Events:** Linked to leads, event details.
- **Interaction History:** Audit trail of lead communications (calls, emails, notes).
- **Configuration:** Key-value store for application settings.
- **Automation Settings (Pro Plan):** Per-customer configuration for Casafari, messaging preferences, auto-trigger settings, quiet hours.
- **Message Jobs:** Queue for automated messages with status and retry logic.
- **Usage Ledger:** Tracks consumption for usage-based billing (lead capture, AI analysis, messages).
- **Password Reset Tokens:** Secure tokens for password recovery with 1-hour expiration, single-use validation.

### AI Integration

**OpenAI:** GPT-based lead classification and scoring based on property details, location, pricing, contact completeness, and source, returning structured output (status, score, reasoning). Includes a graceful fallback mechanism.

### Form Validation

**Zod Integration:** Schema validation via drizzle-zod, integrated with React Hook Form for client-side validation, shared schemas between client and server.

## External Dependencies

### Third-Party Services

-   **Database:** Neon Database (PostgreSQL serverless) with `@neondatabase/serverless` and Drizzle ORM.
-   **AI Service:** OpenAI API (configurable via `OPENAI_API_KEY`), OpenRouter API as an alternative.
-   **Payment Processing:** Stripe SDK with `stripe-replit-sync` for product/price synchronization, webhooks for real-time updates, checkout sessions, and customer portal for subscription management.

### Subscription Plans

**ImoLead Basic (€67/mês):**
- 100+ leads/mês
- Pesquisa automática em sites imobiliários (Idealista, Supercasa, Imovirtual)
- Gestão de agenda integrada (Google Agenda)
- Relatório semanal dos leads
- Aliado digital estratégico
- Suporte semanal
- Estudo de mercado analítico (1x por semana)
- **Nota:** Marcação de visitas pelo assistente IA não disponível

**ImoLead Pro (€167/mês):**
- Tudo do plano Basic
- IA avançada com análise detalhada
- Leads ilimitados
- Relatórios 3x por semana
- Cards personalizados digitais
- Relatório mensal da evolução do agente
- Agenda com marcação de visitas pelo assistente IA
- Automação de mensagens WhatsApp/Email
- Suporte prioritário

**ImoLead Custom (€397-697/mês, Enterprise):**
- Tudo do plano Pro
- Reuniões estratégicas individuais (com equipa)
- 3 vídeos imobiliários profissionais/mês
- Acesso exclusivo com estudo de mercado
- Automação integrada: Instagram, WhatsApp, TikTok
- Relatório diário de acompanhamento leads
- Material promocional digital
- Gestor de conta dedicado
- Suporte 24/7

**Plan Configuration:** `shared/plans.ts` - centralized plan features and limits with helper functions `canScheduleVisits()`, `hasAdvancedAI()`, `getLeadLimit()`.

-   **Automation Services (Pro/Custom Plans):** Apify web scraping for lead discovery (Idealista, Supercasa, Imovirtual), Email service (SendGrid/Resend/Gmail), WhatsApp integration (wa.me links and Business API ready).
-   **Property Search APIs:** Apify scrapers for Idealista, Supercasa, Imovirtual (requires APIFY_API_TOKEN).
    - **IMPORTANT - Apify Actor Activation:** Before lead scraping works, you must manually activate/rent each Apify actor in your Apify console:
      1. Idealista: https://apify.com/memo23/apify-idealista-scraper
      2. Imovirtual: https://apify.com/dadhalfdev/imovirtual-scraper
      3. Supercasa: https://apify.com/igolaizola/supercasa-scraper
    - Visit each link and click "Try for free" or "Rent" to activate the actor under your API key.
-   **Scheduled Daily Searches:** Automatic lead generation at 08:00 daily for Pro/Custom customers with catch-up on restart.
-   **Email Verification:** SMTP configuration for sending verification emails.
-   **Automated Reports:** Email reports scheduled based on plan (Basic: weekly, Pro: 3x/week, Custom: daily) sent at 08:00.

### Recent Changes (February 2026)

-   **Google Calendar Per-User OAuth:** Each customer can now connect their own Google account via OAuth2 flow. Tokens (access, refresh, expiry) stored per-customer with automatic refresh. Secure state validation with HMAC+timestamp prevents CSRF attacks.
-   **Google Calendar API Endpoints:** 
    - `GET /api/google-calendar/status` - Check connection status
    - `GET /api/google-calendar/auth-url` - Get OAuth authorization URL
    - `GET /api/google-calendar/callback` - OAuth callback with signed state validation
    - `POST /api/google-calendar/disconnect` - Disconnect Google account
    - `GET /api/google-calendar/events` - List calendar events
    - `POST /api/google-calendar/events` - Create event
    - `PATCH /api/google-calendar/events/:id` - Update event
    - `DELETE /api/google-calendar/events/:id` - Delete event
    - `POST /api/google-calendar/freebusy` - Check availability
-   **Apify Integration:** Added real lead capture from Idealista, Supercasa, and Imovirtual using Apify web scrapers
-   **Scheduled Searches:** Automatic daily lead generation at 08:00 for Pro/Custom customers with catch-up on restart
-   **Manual Search Trigger:** Added endpoint `/api/automation/run-scheduled-search` for manual lead searches
-   **Dashboard Navigation:** Fixed navigation buttons to use state-based routing instead of URL redirects
-   Added automatic email report scheduling based on subscription plan
-   Improved agenda module with plan-specific AI scheduling badges and upgrade prompts
-   Enhanced notification settings to show active email report frequency
-   Fixed LSP errors and improved type safety across components

### UI Component Libraries

-   **Radix UI:** Unstyled, accessible components (Dialog, Dropdown Menu, Popover, Select, Toast, Tooltip, etc.).
-   **shadcn/ui:** Styled Radix components based on Tailwind CSS ("new-york" theme).
-   **Additional:** `recharts` for data visualization, `embla-carousel-react` for carousels, `cmdk` for command palette, `date-fns` for date manipulation.

### Development Tools

-   **Replit-specific:** `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`.
-   **Build & Bundling:** Vite (frontend), esbuild (backend), TypeScript.

### Environment Variables

-   **Required:** `DATABASE_URL`.
-   **Optional:** `OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENROUTER_API_KEY`, `APIFY_API_TOKEN`, `SESSION_SECRET`, `NODE_ENV`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM_NAME`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.