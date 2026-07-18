# NEET Platform — Design System

## Design Vision

The Education Management Platform should feel like a premium enterprise SaaS product rather than a traditional education software.

The interface must be:

- Professional
- Minimal
- Modern
- Clean
- Mobile-first
- Highly responsive
- Accessible
- Performance-oriented

Premium quality should be achieved through typography, spacing, consistency, and usability — not through excessive colors, gradients, or animations.

Every screen should look production-ready, maintain visual consistency across all modules, and provide an excellent experience on mobile, tablet, laptop, and desktop devices.

> **Core identity:** White-first professional UI. Royal Purple (#7C3AED) as the single primary accent. Mobile-first from day one. Responsive on every screen size. Clean hover effects. Minimal, purposeful animations only. Enterprise SaaS quality similar to products like Linear, Stripe, Notion, Vercel, and Clerk — not a flashy or gaming-style interface.

---

## 1. Introduction

### Purpose

This document defines the visual language, component standards, and interaction patterns for the NEET Platform. Every frontend page must follow this system to maintain a unified, premium enterprise SaaS experience.

### Goals

- Consistent look and feel across all modules
- Reduced design and development decision fatigue
- Faster onboarding for new developers
- Production-ready UI from day one

### Design Principles

- Mobile First
- White First UI
- Premium Through Simplicity
- Consistency Over Creativity
- Responsive by Default
- Accessibility First
- Performance Before Animation
- Reusable Components Only
- Enterprise SaaS Experience
- Clean Typography
- Spacious Layouts
- Predictable Navigation

### Design Philosophy

Good enterprise design is invisible. Users should focus on their tasks, not the interface. Every pixel, spacing, and interaction must have a purpose. If it doesn't add clarity or usability, remove it.

---

## 2. Brand Identity

### Product Vision

A premium, trustworthy, and minimal education management platform that feels as polished as Stripe, Linear, or Notion.

### Premium Enterprise SaaS

- White-first layouts with purposeful use of color
- High information density without clutter
- Predictable, consistent interactions
- Professional tone

### Visual Attributes

| Attribute           | Implementation                                             |
| ------------------- | ---------------------------------------------------------- |
| Modern              | Clean typography, generous whitespace, subtle shadows      |
| Professional        | Consistent spacing, no decorative excess, clear hierarchy  |
| Minimal             | Content-forward, reduced visual noise, purposeful color    |
| Trustworthy         | Stable layout, predictable navigation, accessible contrast |
| Mobile First        | Design from 375px up, touch-friendly targets               |
| Accessibility First | WCAG AA minimum, keyboard navigable, screen reader ready   |

---

## 3. Design Principles

### Mobile First

Every component and layout is designed for 375px first, then progressively enhanced for larger screens. Never reverse.

### White First UI

White (#FFFFFF) and near-white surfaces dominate. Color is used sparingly and only to communicate meaning. Dark/heavy backgrounds are prohibited except for specific overlay or modal contexts.

### Premium Through Simplicity

Luxury in SaaS comes from restraint — clean typography, consistent spacing, soft shadows, and meaningful whitespace. Not from gradients, glassmorphism, or decorative flourishes.

### Consistency Over Creativity

Every button, input, card, and dialog must look and behave the same across the entire platform. Creativity belongs in product strategy, not in UI variation.

### Responsive by Default

Every component must work on 375px, 768px, 1024px, and 1440px. No horizontal scroll. No broken layouts. Mobile card views for tables on small screens.

### Accessibility First

All components must meet WCAG AA standards. Keyboard navigation, focus indicators, proper ARIA labels, and screen reader support are non-negotiable.

### Performance Before Animation

Animations must be purposeful and sub-300ms. No decorative bounce, rotate, or flash effects. Performance and perceived speed are more important than visual flair.

### Reusable Components Only

No one-off UI. Every button, card, input, and dialog comes from the shared component library. If a new pattern is needed, add it to the library first, then use it everywhere.

### Enterprise SaaS Experience

The UI should feel like a tool, not a toy. Predictable navigation, clear data hierarchies, spacious layouts, and professional typography define the experience.

### Clean Typography

Single font family (Inter). Limited weight usage (400, 500, 600, 700). Consistent line-height and letter-spacing. No decorative or script fonts.

### Spacious Layouts

Content needs room to breathe. Padding and gap values follow the 4px spacing scale. Never crowd elements. White space is a feature, not wasted space.

### Predictable Navigation

Sidebar for primary navigation. Header for context and actions. Breadcrumbs for depth. Consistent placement across all screens.

---

## 4. Color System

### Primary

| Token      | Value     | Usage                                                       |
| ---------- | --------- | ----------------------------------------------------------- |
| Primary    | `#7C3AED` | Buttons, links, active navigation, focus states, highlights |
| Hover      | `#6D28D9` | Primary hover states                                        |
| Light      | `#EDE9FE` | Light backgrounds, selected states, active tab indicators   |
| Foreground | `#FFFFFF` | Text on primary backgrounds                                 |

### Neutral Colors

| Token          | Value     | Usage                                 |
| -------------- | --------- | ------------------------------------- |
| Background     | `#FFFFFF` | Page background                       |
| Surface        | `#F9FAFB` | Card, sidebar, dropdown backgrounds   |
| Card           | `#FFFFFF` | Card surface                          |
| Border         | `#E5E7EB` | Dividers, input borders, card borders |
| Text Primary   | `#111827` | Headings, primary content             |
| Text Secondary | `#6B7280` | Labels, descriptions, metadata        |
| Disabled       | `#D1D5DB` | Disabled states, placeholders         |
| Divider        | `#E5E7EB` | Section dividers, horizontal rules    |

### Semantic Colors

| Token   | Value     | Usage                               |
| ------- | --------- | ----------------------------------- |
| Success | `#10B981` | Success states, completed badges    |
| Warning | `#F59E0B` | Warning states, pending badges      |
| Danger  | `#EF4444` | Errors, destructive actions, delete |
| Info    | `#3B82F6` | Informational states                |

### Color Usage Rules

#### DO

- Primary only for: Buttons, Links, Active navigation, Focus indicators, Highlights
- Semantic colors only for their specific meaning (success/warning/danger/info)
- Neutral colors for everything else

#### DON'T

- Never use primary for background fills, decorative elements, or every interactive element
- Never use semantic colors outside their intended context
- Never mix multiple accent colors on one screen
- Never apply primary color to non-interactive text unless it's a link

---

## 5. Typography

### Font Family

```
Inter (sans-serif)
```

Single font family across the entire platform. No fallback to system fonts for headings.

### Hierarchy

| Element    | Size            | Weight         | Line Height | Letter Spacing |
| ---------- | --------------- | -------------- | ----------- | -------------- |
| H1         | 32px / 2rem     | 700 (Bold)     | 1.2         | -0.02em        |
| H2         | 24px / 1.5rem   | 600 (Semibold) | 1.3         | -0.01em        |
| H3         | 20px / 1.25rem  | 600 (Semibold) | 1.4         | 0              |
| H4         | 18px / 1.125rem | 600 (Semibold) | 1.4         | 0              |
| Body       | 16px / 1rem     | 400 (Regular)  | 1.5         | 0              |
| Body Small | 14px / 0.875rem | 400 (Regular)  | 1.5         | 0              |
| Caption    | 12px / 0.75rem  | 400 (Regular)  | 1.5         | 0              |
| Label      | 14px / 0.875rem | 500 (Medium)   | 1           | 0              |
| Button     | 14px / 0.875rem | 500 (Medium)   | 1           | 0              |
| Overline   | 12px / 0.75rem  | 600 (Semibold) | 1           | 0.05em         |

### Weights

- 400 — Body text, descriptions
- 500 — Labels, buttons, navigation
- 600 — Subheadings, card titles
- 700 — Page titles, H1

### Rules

- Never use weight below 400
- Never use weight above 700
- Never mix font families
- Never use italic for body text
- All caps only for overline style, never for headings or body

---

## 6. Spacing System

Use only these design tokens. No random margins or padding.

```
4   8   12   16   20   24
32  40  48   64   80   96
```

### Common Patterns

| Context                           | Token        |
| --------------------------------- | ------------ |
| Page padding (mobile)             | 16px         |
| Page padding (tablet+)            | 24px or 32px |
| Section gap                       | 32px         |
| Card gap (grid)                   | 24px         |
| Card padding                      | 24px         |
| Form field gap                    | 20px         |
| Inline element gap                | 12px         |
| Stack (vertical) between elements | 16px         |
| Button icon spacing               | 8px          |

### Rules

- Never use odd numbers (3px, 5px, 7px, etc.)
- Never use fractions (0.5px, 1.5px, etc.)
- Never add random margins to components
- Components must use spacing props, not custom CSS margins

---

## 7. Border Radius

| Context                    | Value            |
| -------------------------- | ---------------- |
| Buttons                    | 8px              |
| Inputs, Selects, Textareas | 8px              |
| Cards                      | 12px             |
| Dialogs, Modals            | 16px             |
| Tables                     | 8px              |
| Badges, Tags               | 6px              |
| Avatars                    | 50% (full round) |
| Dropdown Menus             | 10px             |
| Tooltips                   | 6px              |
| Checkbox, Radio            | 4px              |

### Rules

- Never use random border-radius values
- Never use pill shape (9999px) on buttons
- Full round (50%) only for avatars and notification dots

---

## 8. Shadows

| Token | Value                                                                | Usage                                  |
| ----- | -------------------------------------------------------------------- | -------------------------------------- |
| XS    | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                      | Small cards, subtle depth              |
| SM    | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`      | Cards, dropdowns                       |
| MD    | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`   | Elevated cards, dialogs                |
| LG    | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Modals, large dialogs                  |
| XL    | `0 25px 50px -8px rgb(0 0 0 / 0.2)`                                  | Toast notifications, floating elements |

### Rules

- Cards default to XS or no shadow
- Elevated cards (selected, hovered) use SM
- Modals use LG
- Toasts use XL
- Never use inset shadows
- Never use colored shadows

---

## 9. Icons

### Library

**Lucide React** — single icon library across the entire platform. No mixing.

### Standard Sizes

| Context             | Size         |
| ------------------- | ------------ |
| Inline with text    | 16px         |
| Input/Button icons  | 18px         |
| Navigation items    | 20px         |
| Section/Empty state | 48px or 64px |
| Avatar placeholder  | 24px         |

### Rules

- Never mix icon libraries (no Heroicons, Phosphor, Font Awesome alongside Lucide)
- Never use custom SVG icons unless absolutely necessary
- Never animate icons (spin, pulse, bounce)
- Icons must be stroke-based (Lucide default), never filled
- Icon color inherits from text color by default
- Use semantic icon colors only for status indicators

---

## 10. Motion & Animation

### Allowed

- Fade in/out (opacity 0 → 1)
- Scale (transform: scale(1) → scale(1.01))
- Slide (translateY for modals, translateX for mobile drawer)
- Smooth hover transitions (color, background-color, box-shadow)
- Skeleton pulse animation

### Not Allowed

- Bounce
- Rotate / spin (except loading spinners)
- Flash / strobe
- Long animations (above 300ms)
- Fancy page transitions (page-to-page slide, 3D flips)
- Animated gradients
- Typewriter effects
- Confetti or celebratory animations

### Duration Guidelines

| Context                | Duration      |
| ---------------------- | ------------- |
| Hover transition       | 150ms         |
| Dropdown open/close    | 200ms         |
| Modal/Dialog open      | 250ms         |
| Mobile drawer slide    | 250ms         |
| Toast appear/disappear | 250ms         |
| Skeleton pulse         | 1500ms (loop) |

> **Hard limit:** Nothing above 300ms for user-initiated interactions.

### Easing

- Default: `cubic-bezier(0.4, 0, 0.2, 1)` (ease in-out)
- Enter: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like exit)
- Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in for disappearing)

### Hover Effects Rules

- Button hover: subtle shadow increase + 1px translateY(-1px)
- Card hover: shadow SM → MD, no scale
- Link hover: color transition only, no underline
- Icon button hover: background color change, no scale
- Scale max: 1.01 (never 1.05, 1.1, or 1.2)
- Never: Scale with rotation, Scale with color change, Jump effects

---

## 11. Responsive Design

### Mobile First

Always design starting from 375px, then enhance:

```
375px   →   768px   →   1024px   →   1440px
```

Never reverse (never start with desktop and scale down).

### Breakpoints

| Name    | Min Width | Target                           |
| ------- | --------- | -------------------------------- |
| Mobile  | 375px     | Phones                           |
| Tablet  | 768px     | iPads, large phones landscape    |
| Laptop  | 1024px    | Small laptops, tablets landscape |
| Desktop | 1440px    | Monitors                         |

### Every Component Must Support

| Device           | Layout Approach                                           |
| ---------------- | --------------------------------------------------------- |
| Mobile (375px)   | Single column, full-width inputs, drawer nav, card tables |
| Tablet (768px)   | 2-column grids, sidebar visible, inline tables            |
| Laptop (1024px)  | 3-column grids max, full sidebar, normal tables           |
| Desktop (1440px) | 4-column grids max, spacious layout                       |

### Rules

- No horizontal scroll at any breakpoint
- Touch targets minimum 44px (WCAG guideline)
- Tables collapse to card view on mobile
- Sidebar becomes drawer on mobile
- Forms are single column on mobile, multi-column on larger screens
- Content reflows, never hides essential data on mobile
- Test every component at 375px, 768px, 1024px, 1440px before merging

---

## 12. Layout Standards

### Structure

```
+------------------+----------------------------------------+
|                  |                                        |
|    Sidebar       |            Header                      |
|    (fixed)       |                                        |
|                  +----------------------------------------+
|                  |                                        |
|    Logo          |           Content Area                 |
|    Nav           |                                        |
|    User          |           (scrollable)                 |
|                  |                                        |
|    Width: 256px  |                                        |
|                  |                                        |
+------------------+----------------------------------------+
```

### Container Width

- Content area max-width: 1280px (centered)
- Full-width sections (tables, lists) can use 100% of content area

### Page Padding

- Mobile: 16px on each side
- Tablet+: 24px on each side
- Desktop: 32px on each side

### Section Gap

- Between sections: 32px
- Between cards in a grid: 24px
- Between header and content: 24px

### Card Gap

- Grid layout: 24px column gap, 24px row gap
- Stacked cards: 16px gap

---

## 13. Component Standards

### Button

| Prop          | Value                                           |
| ------------- | ----------------------------------------------- |
| Height        | 40px (default), 36px (sm), 48px (lg)            |
| Padding       | 16px horizontal (default), 12px (sm), 24px (lg) |
| Border Radius | 8px                                             |
| Font          | 14px / 500                                      |
| Icon gap      | 8px                                             |

Variants: Primary (filled #7C3AED), Outline (border #E5E7EB), Ghost (no background), Destructive (#EF4444)

### Input

| Prop          | Value                               |
| ------------- | ----------------------------------- |
| Height        | 40px                                |
| Padding       | 12px horizontal                     |
| Border Radius | 8px                                 |
| Border        | 1px solid #E5E7EB                   |
| Focus         | Ring 2px #7C3AED                    |
| Font          | 16px / 400 (to prevent mobile zoom) |

### Textarea

Same as input but min-height: 100px, resize: vertical only.

### Select

Same visual style as input. Custom chevron icon (Lucide ChevronDown).

### Checkbox / Radio

- 18px box size
- 4px border radius (checkbox) / 50% (radio)
- Primary fill on checked

### Card

- Background: #FFFFFF
- Border Radius: 12px
- Border: 1px solid #E5E7EB
- Padding: 24px
- Shadow: XS (optional, default none)

### Table

- Header: #F9FAFB background, 14px/600 font
- Cells: 14px/400 font
- Row height: 52px
- Border: 1px solid #E5E7EB (horizontal only)
- Border Radius: 8px (on container)
- Striped rows: optional, #F9FAFB for even rows

### Badge

- Height: 22px
- Padding: 6px 10px
- Border Radius: 6px
- Font: 12px/500

### Avatar

- Sizes: 32px, 40px, 48px, 64px
- Border Radius: 50%
- Fallback: Initials on primary-light background
- Online indicator: 8px green dot, absolute positioned bottom-right

### Dropdown

- Background: #FFFFFF
- Border: 1px solid #E5E7EB
- Border Radius: 10px
- Shadow: SM or MD
- Item height: 36px
- Item padding: 8px 12px
- Item hover: #F3F4F6 background

### Dialog / Modal

- Overlay: rgba(0, 0, 0, 0.5)
- Content: 480px max-width (default), 640px (lg)
- Border Radius: 16px
- Shadow: LG
- Padding: 24px
- Animation: fade + scale (250ms)

### Tabs

- Active tab: primary color text + bottom border (2px)
- Inactive: text secondary color
- Hover: subtle background change (#F9FAFB)

### Toast

- Border Radius: 10px
- Shadow: XL
- Duration: 4000ms
- Types: success (green border), error (red border), warning (yellow border), info (blue border)

### Skeleton

- Background: #E5E7EB
- Border Radius: 4px
- Animation: pulse (opacity 0.3 → 0.7, 1500ms loop)

### Empty State

- Icon: 48px, text-secondary
- Title: 18px/600
- Description: 14px/400, text-secondary
- Optional action button

---

## 14. Forms

### Layout

- Label above input (default), label to left (optional for settings)
- Single column on mobile, multi-column on desktop
- Submit button at bottom, aligned right or full-width

### Label

- Font: 14px/500
- Color: #111827 (text primary)
- Margin bottom: 6px
- Required indicator: red asterisk (`*`)

### Validation

- Error message below input: 12px/400, #EF4444
- Input border on error: 1px solid #EF4444
- Success state: optional, green border + check icon
- Show error only after blur or form submission
- Never show error while user is typing (validate on blur)

### States

| State     | Visual                                       |
| --------- | -------------------------------------------- |
| Default   | Border #E5E7EB, bg #FFFFFF                   |
| Focus     | Ring 2px #7C3AED, border transparent         |
| Hover     | Border #D1D5DB                               |
| Error     | Border #EF4444, ring 2px #EF4444/20%         |
| Disabled  | bg #F9FAFB, text #D1D5DB, cursor not-allowed |
| Read-only | bg #F9FAFB, text #6B7280                     |
| Loading   | Skeleton placeholder or spinner in button    |

---

## 15. Tables

### Standard Features

- Sticky header (scrollable body)
- Search bar above table
- Pagination below (10/25/50/100 per page)
- Sortable columns with indicator arrow
- Filter dropdowns for relevant columns

### Column Rules

- First column: left-aligned (usually name/ID)
- Numeric columns: right-aligned
- Action column: right-aligned, icon buttons only
- Status column: centered, badge component
- Minimum column width: 100px

### Responsive Behavior

- **Desktop (1024px+):** Full table with all columns
- **Tablet (768px):** Hide less important columns (show more on hover or expand)
- **Mobile (375px):** Convert to card list layout

### Mobile Card View

```
+----------------------------------------+
| John Doe                     STUDENT    |
| ID: STU-2024-001             16 Dec    |
| Biology                    [Active]    |
| ⋮                                       |
+----------------------------------------+
```

Each row becomes a card with key-value pairs. Primary identifier at top-left. Status badge at top-right. Actions via kebab menu.

### Empty Table

- Centered empty state with icon, title, description
- Action button to create first entry

---

## 16. Dashboard Rules

### Layout

- Maximum 4 cards per row (desktop)
- 2 per row (tablet)
- 1 per row (mobile)
- 24px gap between cards

### Content Guidelines

- Feel spacious — avoid clutter at all costs
- Clear hierarchy: title → metric → trend/chart
- Meaningful whitespace between sections
- Each card has one primary action maximum
- Charts must be clean, minimal, no 3D effects

### Card Types

- Stat card: label, large number, trend indicator (up/down), optional sparkline
- List card: 3-5 recent items with "View all" link
- Chart card: title + clean chart + optional legend
- Progress card: title + progress bar + percentage

### Rules

- Never put more than 4 stat cards in a row
- Never use pie charts (use bar or area instead)
- Never auto-play or animate charts on load
- Never stack more than 3 cards vertically without a section break

---

## 17. Mobile Navigation

### Sidebar on Desktop → Drawer on Mobile

- Desktop: fixed sidebar (256px), always visible
- Mobile: hidden, triggered by hamburger icon in header
- Drawer slides in from left (250ms animation)
- Overlay background on mobile
- Close on selecting a nav item (mobile)
- Close on clicking overlay (mobile)

### Bottom Actions

- Primary actions (create, save, submit) at bottom of screen on mobile
- Fixed position, safe area padding

### Responsive Header

- Desktop: full header with nav, search, avatar
- Mobile: hamburger + logo + avatar only
- Everything thumb-friendly (minimum 44px touch target)

---

## 18. Accessibility

### Keyboard

- All interactive elements must be reachable via Tab
- Tab order follows visual layout (top to bottom, left to right)
- Escape closes modals, dropdowns, drawers
- Enter/Space activates buttons and links
- Arrow keys for radio groups, tabs, select dropdowns

### Focus

- Visible focus ring on all interactive elements
- Focus ring: 2px solid #7C3AED with 2px offset
- Never use `outline: none` without providing an alternative focus style
- Skip to main content link for keyboard users

### Contrast

- All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Primary color on white: check contrast
- Semantic colors on white: check contrast
- Disabled text can be exempt

### ARIA

- Use semantic HTML first (button, nav, main, aside)
- ARIA labels for icon-only buttons
- ARIA expanded for collapsible elements
- Role and aria-label for complex widgets
- Announce dynamic content changes with aria-live

### Screen Readers

- All images must have alt text
- Form inputs must have associated labels
- Error messages must be announced
- Loading states must be announced
- Table headers must use `<th>` with scope

---

## 19. Performance Rules

### Lazy Loading

- Route-based code splitting (Next.js page segments)
- Images: `next/image` with lazy loading by default
- Heavy components: dynamic import with `next/dynamic`
- Virtual list for long tables (react-virtual)

### Code Splitting

- Each page loads only its own bundle
- Shared components in common chunk
- No barrel imports that pull entire libraries
- Monorepo packages tree-shaken automatically

### Skeleton Loading

- Every data-dependent section must show skeleton while loading
- Skeleton must match the final layout dimensions
- Never show full-page spinner
- Skeleton pulse animation only (no shimmer or wave)

### Image Optimization

- Use next/image for all images
- Specify width and height to prevent layout shift
- Use WebP format
- Lazy load below-fold images
- No GIFs for illustrations (use SVG or static images)

### Re-renders

- Memoize expensive computations with useMemo
- Memoize callbacks passed to child components with useCallback
- Avoid inline object/array props in render
- Use React.memo for pure display components
- Zustand selectors to prevent unnecessary re-renders

---

## 20. Design Do's & Don'ts

### Always ✅

| Rule                  | Why                                     |
| --------------------- | --------------------------------------- |
| White-first UI        | Clean, professional, enterprise feel    |
| Premium spacing       | Content needs room to breathe           |
| Soft shadows          | Subtle depth without distraction        |
| Consistent typography | Single font, limited weights, hierarchy |
| Professional icons    | Lucide stroke icons, consistent size    |
| Responsive layouts    | Every screen, every device              |
| Mobile-first          | Design from small to large              |
| Enterprise look       | Trustworthy, stable, predictable        |
| Purposeful color      | Primary only for key elements           |
| Accessible contrast   | WCAG AA minimum                         |

### Never ❌

| Rule                            | Why                                     |
| ------------------------------- | --------------------------------------- |
| Dark-heavy UI                   | Not appropriate for education SaaS      |
| Over animations                 | Distracting, feels unprofessional       |
| Neon colors                     | Cheapens the premium feel               |
| Huge gradients                  | Fights against white-first principle    |
| Glassmorphism everywhere        | Trendy, not timeless                    |
| Random border radius            | Breaks consistency                      |
| Random spacing                  | Layout looks messy                      |
| Different button styles         | Each page must feel like the same app   |
| Different fonts                 | Typography must be uniform              |
| Fancy dashboards                | Data clarity over visual flair          |
| Pie charts                      | Harder to read than bar charts          |
| 3D charts                       | Unnecessary complexity                  |
| Auto-play animations            | User should control motion              |
| Decorative illustrations        | Every element must serve a purpose      |
| Popup modals for simple actions | Use inline editing or slide-over panels |

---

## 21. Future Scope

### Dark Mode

- Consider adding at a later stage
- Must maintain same design principles (white-first becomes dark-first)
- Same color system with adjusted luminance values
- User preference detected via system settings (next-themes)

### RTL Support

- Arabic language support in roadmap
- Layout mirroring (sidebar to right, text alignment)
- CSS logical properties for easy flip

### Tenant Branding

- Allow tenants to override primary color
- Logo replacement in sidebar and header
- Custom favicon per tenant

### Theme Customization

- User preference for compact/spacious mode
- Font size adjustment (small/medium/large)
- Color density preference

### White Label

- Complete rebranding capability for enterprise clients
- Remove all NEET Platform branding
- Custom domain, login page, email templates
