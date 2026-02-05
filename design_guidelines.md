# ImoLead AI Pro - Design Guidelines

## Design Approach

**Hybrid Reference-Based Approach**: Drawing inspiration from premium SaaS platforms (Linear, Notion, Stripe) combined with real estate industry professionalism. The design splits into two distinct experiences:

1. **Marketing Site**: High-impact, trust-building presentation optimized for client conversion
2. **Dashboard**: Efficiency-focused interface for daily lead management operations

**Core Principles**:
- Professional credibility for Portuguese real estate market
- Clean, modern aesthetics that convey AI-powered sophistication
- Data-forward design for the dashboard; emotion-forward for marketing
- Spacious layouts that allow content to breathe

---

## Typography System

**Font Families**:
- **Headings**: Inter (600/700 weights) - modern, professional SaaS standard
- **Body**: Inter (400/500 weights) - optimal readability for both Portuguese text and data tables
- **Accent/Numbers**: JetBrains Mono (500) - for metrics, statistics, and data displays

**Hierarchy**:
- **Hero Headline**: text-5xl md:text-6xl lg:text-7xl, font-bold, tracking-tight
- **Section Headers**: text-3xl md:text-4xl, font-semibold
- **Subsection Headers**: text-2xl md:text-3xl, font-semibold
- **Card Titles**: text-xl font-semibold
- **Body Large**: text-lg leading-relaxed
- **Body Standard**: text-base leading-relaxed
- **Captions/Labels**: text-sm font-medium, uppercase tracking-wide for labels
- **Metrics/Numbers**: text-4xl md:text-5xl font-bold (JetBrains Mono)

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: py-16 md:py-20 lg:py-24 (marketing), py-8 md:py-12 (dashboard)
- Card gaps: gap-6 to gap-8
- Content spacing: space-y-4 to space-y-6

**Container Strategy**:
- Marketing pages: max-w-7xl for full sections, max-w-4xl for text-heavy content
- Dashboard: Full-width layout with max-w-none, sidebar-based navigation
- Form containers: max-w-2xl centered

**Grid System**:
- Marketing features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard tables: Full-width responsive tables with horizontal scroll on mobile
- Stat cards: grid-cols-2 md:grid-cols-4 for metric displays

---

## Component Library

### Navigation
**Marketing Site Header**:
- Sticky navigation (sticky top-0 z-50)
- Logo left, navigation center, CTA button right
- py-4 with backdrop-blur-lg for modern glassmorphism effect
- Mobile: Hamburger menu with slide-out panel

**Dashboard Sidebar**:
- Fixed left sidebar (w-64) with collapsible mobile overlay
- Vertical navigation with icon + label pattern
- Active state with subtle background highlight
- Bottom section for user profile and settings

### Buttons
**Primary CTA**: px-8 py-3.5, rounded-lg, font-semibold, text-base
**Secondary**: px-6 py-2.5, rounded-lg, outlined style
**Icon Buttons**: p-2.5, rounded-md for compact actions
**Blur Background**: When over images, use backdrop-blur-md with semi-transparent background

### Cards
**Feature Cards** (Marketing):
- p-8, rounded-2xl, border with subtle shadow
- Icon at top (w-12 h-12), title, description below
- hover:translate-y-[-4px] transition for lift effect

**Lead Cards** (Dashboard):
- p-6, rounded-xl, compact information density
- Header with lead name + classification badge
- Body with property details in grid layout
- Footer with action buttons and timestamp

### Data Tables
**Lead Management Table**:
- Alternating row backgrounds for readability
- Fixed header with sticky positioning
- Column widths: Name (25%), Property (30%), Status (15%), Contact (20%), Actions (10%)
- Sortable headers with arrow indicators
- Row hover state for interactivity

### Forms
**Input Fields**:
- h-12, px-4, rounded-lg with border
- Labels: text-sm font-medium mb-2
- Grouped inputs: space-y-4
- Validation states with icon indicators (success/error)

**Search/Filter Bar**:
- Combined input with icon prefix
- Filter tags as removable pills below
- Clear all option

### Badges & Tags
**Lead Classification**:
- "Quente" (Hot): px-3 py-1, rounded-full, text-xs font-semibold
- "Morno" (Warm): Same sizing, different semantic treatment
- "Frio" (Cold): Same pattern
- Use pill shape for status, square rounded-md for categories

### Modals & Overlays
**Modal Container**: max-w-2xl, p-8, rounded-2xl, centered with backdrop
**Close Button**: Absolute top-right with p-2 hit area

### Calendar Component
- Weekly/Monthly grid view toggle
- Day cells: p-4 minimum, events as stacked bars
- Today highlight with subtle border
- Event cards show time + lead name + property type

---

## Page-Specific Guidelines

### Marketing Site

**Hero Section** (Landing):
- Full viewport height (min-h-screen) with centered content
- Large hero image: Real estate professional using laptop/tablet in modern office setting
- Image treatment: Subtle gradient overlay for text readability
- Content layout: Left-aligned text (max-w-2xl) with headline, subheadline, dual CTA buttons
- Trust indicators below CTAs: "Já prospectou 10.000+ leads" with small metric cards

**Features Section**:
- 6 feature cards in 3-column grid
- Each card: Icon, title, 2-3 line description
- Icons: Heroicons for consistency (search, chat-bubble, calendar, chart-bar, etc.)
- py-24 section spacing

**Benefícios/Results Section**:
- 2-column layout: Image left (dashboard screenshot/mockup), content right
- Bullet points with checkmark icons
- Quantifiable metrics highlighted in accent treatment

**Social Proof Section**:
- Simulated testimonial cards (2-column grid)
- Each: Quote, name, role, company
- Avatar placeholders (circular, 56px)

**Pricing/Planos Section**:
- 3-tier pricing cards in row
- Highlight middle tier with subtle elevation
- Feature list with icon checks
- CTA button per card

**CTA Final Section**:
- Centered layout, max-w-3xl
- Large headline + supportive copy
- Single prominent CTA
- Background: Subtle gradient or image with overlay

**Footer**:
- 4-column grid: About, Features, Legal, Contact
- Newsletter signup form (inline horizontal: input + button)
- Social media icons (Instagram, LinkedIn)
- Copyright and compliance info

### Dashboard

**Dashboard Home**:
- Top stats row: 4 metric cards (grid-cols-4)
- Charts section: Line graph for lead trends over time
- Recent leads table (last 10, condensed view)
- Quick actions sidebar on right (sticky)

**Leads Table Page**:
- Filter bar at top (search + dropdowns for status, property type, location)
- Full-width sortable table
- Pagination at bottom
- Bulk actions toolbar (appears when rows selected)

**Lead Detail View**:
- Split layout: Lead info left (max-w-md), timeline/history right (flex-1)
- Classification badge prominent
- Property details in definition list format
- Message history as chat-style bubbles
- Editable notes section
- Action buttons: Schedule Visit, Send Message, Mark as...

**Calendar Page**:
- Calendar header with month navigation
- View toggles (Day/Week/Month)
- Sidebar with upcoming appointments list
- Click day to create new event modal

**Configurações/Settings**:
- Tabbed navigation (Account, Scraping, Messages, Notifications)
- Form layouts with clear sections
- Template editor: Textarea with preview pane
- Save/Cancel buttons bottom-right

---

## Images

**Hero Image** (Marketing Site):
- Placement: Full-width background on hero section
- Description: Professional Portuguese real estate agent in modern office using tablet/laptop with property listings visible, natural lighting, confident and approachable atmosphere
- Treatment: Subtle dark gradient overlay (from bottom) to ensure text readability

**Feature Visuals** (Marketing Site):
- Dashboard mockup screenshot showing lead table interface
- Calendar view mockup with scheduled appointments
- Mobile phone mockup showing WhatsApp integration preview
- These as supporting images in benefits/features sections

**Dashboard Placeholders**:
- Property thumbnail images in lead cards (placeholder: modern Portuguese properties)
- User avatars (circular, initials when no photo)

---

## Animations

**Marketing Site**:
- Subtle fade-in on scroll for section reveals (50ms delay between cards)
- Hero CTA pulse effect (very subtle, 2s interval)
- Card hover lift transitions (200ms)

**Dashboard**:
- Minimal animations - focus on speed
- Smooth transitions for filters/sorting (150ms)
- Modal fade in/out (200ms)
- No scroll-based animations

---

**Design Identity**: Premium, trustworthy, AI-powered efficiency for the modern Portuguese real estate professional. Clean data presentation meets aspirational marketing aesthetics.