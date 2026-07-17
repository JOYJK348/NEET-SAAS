# NEET Platform — UI/UX Guidelines

## 1. Purpose

This document defines the UI and UX standards that every page, module, and component must follow to maintain a consistent, professional, mobile-first experience across the NEET Platform.

---

## 2. User Experience Philosophy

Every screen should make the user feel:

| Attribute     | Meaning                                                             |
| ------------- | ------------------------------------------------------------------- |
| Fast          | Instant feedback, no waiting without skeleton                       |
| Clean         | Minimal visual noise, purposeful whitespace                         |
| Predictable   | Same patterns everywhere — user never surprised                     |
| Professional  | Enterprise-grade polish, not toy-like                               |
| Mobile First  | Designed for small screens, enhanced for large                      |
| Easy to Learn | No learning curve — intuitive by default                            |
| Consistent    | Same layout, same spacing, same behavior, same component everywhere |

> **Golden rule:** Users should never think. They should instantly understand the UI. Every button, label, and interaction must be self-explanatory.

---

## 3. Mobile First Design

Every screen must be designed for:

```
375px   (Mobile)
   ↓
768px   (Tablet)
   ↓
1024px  (Laptop)
   ↓
1440px  (Desktop)
```

Desktop is an enhancement. Mobile is the priority.

### Always ✅

- Single column layouts on mobile
- Full-width inputs on mobile
- Drawer navigation (sidebar hidden)
- Card-style tables on small screens
- Touch targets ≥ 44px
- Bottom positioning for primary actions

### Never ❌

- Desktop-first design
- Horizontal scrolling at any breakpoint
- Tiny buttons or inputs on mobile
- Hover-only interactions (must work on touch)
- Side-by-side content that forces zoom

---

## 4. Responsive Behaviour

| Device           | Layout                                                          |
| ---------------- | --------------------------------------------------------------- |
| Desktop (1440px) | Fixed sidebar + header + multi-column content                   |
| Laptop (1024px)  | Fixed sidebar + header + responsive content grid                |
| Tablet (768px)   | Collapsible sidebar (hamburger toggle) + header + 2-column grid |
| Mobile (375px)   | Full-screen drawer nav + top header + single column             |

### Breakpoint Specifics

- **Desktop:** Sidebar visible (256px), content area max 1280px, up to 4 columns
- **Tablet:** Sidebar collapses to icons or becomes a drawer, 2-3 columns
- **Mobile:** No sidebar visible — drawer on demand, single column, bottom sheet for actions

---

## 5. Navigation Guidelines

### Elements

| Element       | Standard                                                   |
| ------------- | ---------------------------------------------------------- |
| Sidebar       | Primary navigation, fixed on desktop, drawer on mobile     |
| Header        | Context title, search, notifications, profile              |
| Breadcrumb    | Secondary navigation, shows depth                          |
| Back Button   | For nested screens (detail pages)                          |
| Page Title    | H2 (24px/600), at top of every page                        |
| Search        | Global search in header, module-specific search in content |
| Notifications | Bell icon in header, dropdown with recent items            |
| Profile       | Avatar + name in header, dropdown for settings/logout      |

### Rules

- Sidebar items must be consistent across all pages (no per-module sidebar)
- Active nav item highlighted with primary color + light background
- Breadcrumb format: `Home > Module > Page`
- Back button only when navigating into a detail view (not for top-level pages)
- Every page must have a title — never leave it empty

---

## 6. Dashboard UX

### Dashboard should:

- Show only the most important information — nothing more
- Avoid clutter — maximum 4 stat cards per row
- Include recent activity feed (5-10 items)
- Provide quick actions (Create, View All)
- Display upcoming events or deadlines (if applicable)
- Feel spacious — whitespace is a feature

### Dashboard should NEVER:

- Have 50 cards on one screen
- Show every metric available
- Auto-play charts or carousels
- Use decorative illustrations that add no information value
- Stack more than 3 vertical sections without a break

---

## 7. Forms UX

Every form must include:

| Element          | Standard                                         |
| ---------------- | ------------------------------------------------ |
| Label            | 14px/500, above the input, left-aligned          |
| Placeholder      | 14px/400, text-secondary color                   |
| Validation       | On blur (not while typing)                       |
| Helper text      | Below input, 12px/400, text-secondary            |
| Required mark    | Red asterisk next to label                       |
| Error message    | Below input, 12px/400, #EF4444                   |
| Loading state    | Skeleton placeholder or spinner in submit button |
| Success feedback | Toast notification on successful submission      |

### Button Standards (every form)

| Button        | Position                                            |
| ------------- | --------------------------------------------------- |
| Save / Submit | Right side or full-width (mobile)                   |
| Cancel        | Left of Save, outline variant                       |
| Reset         | Hidden in dropdown or tertiary link — never primary |
| Delete        | Red destructive variant, with confirmation dialog   |

> Buttons must always be in the same location across all forms. Never rearrange.

### Form Layout Rules

- Single column on mobile
- 2 columns on tablet+ for related fields (e.g., First Name / Last Name)
- Submit button aligned right on desktop, full-width on mobile
- Group related fields with section headings and spacing (32px gap between groups)

---

## 8. Table UX

Every table must support:

| Feature        | Required                                  |
| -------------- | ----------------------------------------- |
| Search         | Always — top right above table            |
| Sorting        | Clickable column headers, arrow indicator |
| Pagination     | Bottom, 10/25/50/100 per page             |
| Filters        | Above table or sidebar, drawer on mobile  |
| Bulk selection | Checkbox in first column                  |
| Row actions    | Kebab menu (three dots) on the right      |
| Responsive     | Collapses to card view on mobile          |
| Loading        | Skeleton rows (not spinner)               |
| Empty state    | Illustration + message + CTA              |

### Mobile Table Behavior

On mobile (375px-768px), tables MUST convert to a card list:

```
+------------------------------------------+
| John Doe                     [Active]     |
| ID: STU-2024-001             16 Dec 2024 |
| Biology                                ⋮  |
+------------------------------------------+
```

- Each row becomes a card
- Primary identifier at top-left
- Status badge at top-right
- Key-value pairs for remaining columns
- Kebab menu for actions

---

## 9. Dialog UX

Every dialog must have:

| Element          | Standard                                         |
| ---------------- | ------------------------------------------------ |
| Title            | 18px/600, top of dialog                          |
| Description      | 14px/400, below title, text-secondary            |
| Primary button   | Right side, filled variant                       |
| Secondary button | Left of primary, outline/ghost                   |
| Close button     | X icon in top-right corner                       |
| ESC support      | Keyboard: Escape closes dialog                   |
| Backdrop click   | Closes dialog (except destructive confirmations) |

### Rules

- Max width: 480px (default), 640px (large), 320px (small)
- Never stack multiple dialogs
- Never use dialog for simple confirmations (use inline toast instead)
- Destructive actions require explicit confirmation: "Are you sure?" + type entity name

---

## 10. Loading UX

Every async page must show:

| State              | Component                          |
| ------------------ | ---------------------------------- |
| Page load          | Skeleton matching final layout     |
| Data fetch         | Skeleton rows / skeleton cards     |
| Action submission  | Button spinner + disabled state    |
| File upload        | Progress bar                       |
| Background refresh | Inline spinner or subtle indicator |

> **No blank screens. Ever.**

### Rules

- Skeleton must match the exact dimensions of the final content
- Never show a full-page spinner for data loading
- Use skeleton pulse animation only (1500ms loop)
- Minimum loading display: 300ms (avoid flash for fast loads)

---

## 11. Empty States

Every module must have an empty state with:

| Element        | Standard                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| Illustration   | 64px icon (Lucide), text-secondary color                                      |
| Title          | 18px/600 — e.g., "No students found"                                          |
| Description    | 14px/400, text-secondary — e.g., "Get started by creating your first student" |
| Primary action | Button to create the first item                                               |

### Examples

- **No Students** → "Create Student" button
- **No Results** → "Clear filters" or "Try a different search"
- **No Notifications** → "You're all caught up"
- **No Activity** → "No recent activity"

---

## 12. Error Handling

Every API failure must show:

| Element | Standard                                                |
| ------- | ------------------------------------------------------- |
| Message | Friendly, user-readable — never raw error codes         |
| Retry   | Button or link to retry the failed action               |
| Support | "Contact support" link for persistent issues            |
| Context | Show the error near the failed component, not full-page |

### Error Display Hierarchy

1. **Toast** — for background operations (save, delete)
2. **Inline error** — for form validation
3. **Error state component** — for page-level failures (with retry)
4. **Full error page** — for critical system failures only (500, network down)

### Rules

- Never show `Error: 500 Internal Server Error` directly
- Never show stack traces to users
- Never show raw JSON error responses
- Always log errors to console for debugging

---

## 13. Search Experience

### Standards

| Feature         | Standard                                           |
| --------------- | -------------------------------------------------- |
| Search box      | Top of content area, 320px max-width               |
| Debounce        | 300ms delay before triggering search               |
| Highlight       | Matched text highlighted in results                |
| Recent searches | Saved in local storage, shown on focus             |
| Empty result    | "No results found" with suggestion to modify query |
| Clear button    | X icon when input has value                        |

### Rules

- Global search in header (navigates to search page)
- Module-specific search above the table
- Search is case-insensitive
- Minimum 2 characters before triggering search

---

## 14. Filters

| Device  | Filter UI                          |
| ------- | ---------------------------------- |
| Desktop | Sidebar panel or above-table row   |
| Tablet  | Slide-over panel from right        |
| Mobile  | Bottom sheet or full-screen drawer |

### Every filter panel must have:

- **Apply** button — applies all selected filters
- **Reset** button — clears all filters
- **Close** / done — for mobile panels
- **Count** — shows how many filters are active

### Rules

- Active filters shown as badges below the filter button
- Click badge to remove individual filter
- Filter state persisted in URL query params (shareable URLs)
- Never auto-apply filters on selection change

---

## 15. Notifications

### Types

| Type    | Component      | When to use                                      |
| ------- | -------------- | ------------------------------------------------ |
| Success | Toast          | Operation completed successfully                 |
| Error   | Toast + inline | Operation failed                                 |
| Warning | Toast          | Non-blocking warning                             |
| Info    | Toast          | Informational message                            |
| Banner  | Top of page    | System-wide announcement (maintenance, downtime) |
| Inline  | Below input    | Form validation errors                           |

### Toast Standards

- Position: Top-right (desktop), top-center (mobile)
- Auto-dismiss: 4000ms (success), 8000ms (error)
- Manual dismiss: Always available (X button)
- Max visible: 3 toasts at a time
- Stack new toasts below existing ones

### Rules

- Never use toast for critical errors that require user action (use dialog)
- Never show more than one banner at a time
- Inline errors must appear immediately on blur

---

## 16. Feedback States

Every interactive component must have:

| State    | Visual                                           |
| -------- | ------------------------------------------------ |
| Default  | Normal appearance                                |
| Hover    | Subtle visual change (shadow, color, background) |
| Focus    | 2px ring in primary color                        |
| Pressed  | Slight scale (0.98) or darker background         |
| Disabled | Grayed out (#D1D5DB), cursor not-allowed         |
| Loading  | Spinner replaces content or button text          |
| Success  | Green checkmark or indicator                     |
| Error    | Red border + error message                       |

> Every component must communicate its state to the user. No silent failures.

---

## 17. Micro Interactions

### Allowed

- Hover transitions (150ms, color/shadow changes)
- Focus ring appearance
- Subtle ripple on button click (optional, must be minimal)
- Fade in/out for dropdowns and tooltips (200ms)
- Small scale on press (transform: scale(0.98))

### Not Allowed

- Bounce animations on any element
- Crazy page transitions (3D flips, slides, cube effects)
- Heavy animations (spinning backgrounds, floating elements)
- Confetti, fireworks, or celebratory effects
- Auto-playing carousels or sliders

---

## 18. Accessibility

| Requirement    | Standard                                                      |
| -------------- | ------------------------------------------------------------- |
| Keyboard       | Tab reaches all interactive elements, order is logical        |
| Tab navigation | Visible focus ring on every focusable element                 |
| Screen readers | Semantic HTML + ARIA labels for complex widgets               |
| Focus ring     | 2px solid #7C3AED with 2px offset — never use `outline: none` |
| Contrast       | All text meets WCAG AA (4.5:1) minimum                        |
| ARIA labels    | Icon-only buttons must have aria-label                        |
| Skip link      | "Skip to main content" for keyboard users                     |
| Touch targets  | Minimum 44px for all interactive elements                     |
| Reduced motion | Respect `prefers-reduced-motion` — disable all animations     |

---

## 19. Performance UX

| Area               | Standard                                             |
| ------------------ | ---------------------------------------------------- |
| Page load          | Skeleton shown immediately, content loaded async     |
| Lazy load          | Below-fold images and heavy components               |
| Virtual scrolling  | Tables with 100+ rows                                |
| Code splitting     | Route-based, automatic with Next.js                  |
| Prefetch           | Link hover prefetch for likely navigation            |
| Image optimization | next/image with WebP, lazy loading                   |
| Bundle size        | Monitor with bundle analyzer — no large dependencies |

### Perceived Performance

- Show skeleton within 100ms of navigation
- Show content incrementally (stream if possible)
- Optimistic updates for create/edit/delete (rollback on error)
- Prefetch common routes on idle

---

## 20. Page Layout Standards

Every page follows this structure:

```
Breadcrumb
    ↓
Page Title
    ↓
Actions (Create, Export, etc.)
    ↓
Search + Filters
    ↓
Content (Table / Cards / Form)
    ↓
Pagination (if applicable)
```

> No random layouts. Every page must follow this exact structure.

### Layout Rules

- Breadcrumb is optional on top-level pages (dashboard, home)
- Page title is mandatory on every page
- Actions row contains primary and secondary CTAs (right-aligned)
- Search + Filters are optional but must be together when present
- Content is always the main section
- Pagination at bottom, centered

---

## 21. Page Consistency Rules

Every page must have:

| Element       | Required                               |
| ------------- | -------------------------------------- |
| Title         | ✅ Always                              |
| Description   | ✅ For context (under title)           |
| Primary CTA   | ✅ At least one (Create, Save, Submit) |
| Secondary CTA | ⬜ Optional                            |
| Search        | ⬜ For list/table pages                |
| Filter        | ⬜ For list pages with many items      |
| Content       | ✅ Always                              |
| Pagination    | ⬜ For lists with 10+ items            |
| Loading state | ✅ For async content                   |
| Empty state   | ✅ For lists with no items             |
| Error state   | ✅ For failed API calls                |

---

## 22. Dashboard Cards

### Rules

- All cards in the same row must have equal height
- Same spacing between cards (24px gap)
- Same shadow level (XS or none)
- Same border radius (12px)
- Same typography hierarchy
- Same padding (24px)
- Cards should not independently scroll

### Card Types

| Type     | Content                                                |
| -------- | ------------------------------------------------------ |
| Stat     | Label, large number, trend arrow, sparkline (optional) |
| List     | 3-5 recent items, "View all" link                      |
| Chart    | Title, clean chart (line/bar), legend (optional)       |
| Progress | Title, progress bar, percentage, target                |

---

## 23. Charts

### When to use each type

| Type       | Use Case                                    |
| ---------- | ------------------------------------------- |
| Line chart | Trends over time (daily/weekly/monthly)     |
| Bar chart  | Comparisons across categories               |
| Area chart | Volume over time with cumulative context    |
| Pie chart  | Only for 2-3 categories (avoid if possible) |

> Never use a chart just because you can. If a number tells the story better, use a number.

### Rules

- No 3D charts
- No gradient fills
- No animation on load
- Grid lines: light (#E5E7EB), minimal
- Legend: below the chart, horizontal
- Tooltip: on hover, shows exact values

---

## 24. Data Density

- Whitespace is premium — don't overcrowd
- Maximum 4 stat cards per row
- Maximum 10 table rows visible without scroll
- Maximum 3 chart cards per row
- Minimum 24px padding inside every card
- Avoid nesting more than 2 levels of cards

### Signs of overcrowding

- Horizontal scrollbars
- Text truncated everywhere
- Cards with no padding
- Multiple scrollable sections on one page
- Users need to scroll past 3 sections to find primary action

---

## 25. Animation Rules

Reinforcing from the Design System:

- Every animation must have a purpose
- Duration: never exceed 300ms for user-initiated interactions
- Subtle transitions only (fade, scale 1.01, slide)
- No bounce, rotate, flash, or fancy transitions
- Respect `prefers-reduced-motion`
- Skeleton pulse: 1500ms loop, opacity 0.3 → 0.7
- Loading spinners: only for button states, not for page loads

---

## 26. UX Do's & Don'ts

### Always ✅

- Mobile-first layouts
- Large touch targets (≥ 44px)
- Generous whitespace
- Consistent spacing (4px scale)
- Fast navigation (skeleton before content)
- Clean typography (Inter, limited weights)
- Premium, enterprise look
- Purposeful color usage
- Predictable patterns everywhere

### Never ❌

- Dark-heavy UI themes
- Random or inconsistent layouts
- Huge gradients or decorative backgrounds
- Fancy loaders (full-page spinners)
- Popup overload (multiple dialogs at once)
- Tiny fonts (under 14px for body)
- Tiny buttons (under 40px height)
- Hidden actions (kebab menu for everything)
- Auto-play anything
- Flashy or gaming-style interfaces

---

## 27. Module Experience

Each module should feel distinct in purpose but consistent in UI.

| Module       | UX Feel                 | Key Pattern                                    |
| ------------ | ----------------------- | ---------------------------------------------- |
| Students     | Simple, search-first    | Table + search + profile cards                 |
| Admissions   | Step-based, guided      | Progress wizard + form steps + status tracking |
| Fees         | Financial, precise      | Table + summary cards + payment flow           |
| Attendance   | Fast, daily             | Grid + batch toggle + mark present/absent      |
| Reports      | Analytical, data-heavy  | Filters + charts + export                      |
| AI Assistant | Conversational, helpful | Chat interface + suggestions + context-aware   |

> Each module shares the same UI components, spacing, and design tokens — only the interaction pattern changes based on the task.

---

## 28. SaaS Benchmark References

This project should follow the UX quality and interaction patterns inspired by:

| Product            | Takeaway                                                      |
| ------------------ | ------------------------------------------------------------- |
| Stripe Dashboard   | Clean data tables, minimal navigation, professional feel      |
| Notion             | Spacious layouts, clean typography, flexible content          |
| Vercel Dashboard   | Modern navigation, real-time data, premium whitespace         |
| Linear             | Fast interactions, keyboard-first, elegant micro-interactions |
| GitHub             | Dense but navigable data, clear information hierarchy         |
| Clerk              | Beautiful auth flows, enterprise-grade polish                 |
| Supabase Dashboard | Responsive tables, clean API documentation style              |

### Do not imitate:

- Legacy admin templates (AdminLTE, CoreUI, Bootstrap Admin)
- Flashy dashboards with animated backgrounds
- Gaming-style interfaces with neon effects
- Traditional education software (cluttered, outdated)

> The UI should feel clean, modern, professional, and enterprise-ready — like a tool you'd trust with critical data.
