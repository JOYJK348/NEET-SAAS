# NEET Platform — Frontend Implementation Plan

## 1. Purpose

This document defines the frontend implementation strategy, development workflow, performance standards, and engineering rules for the NEET Platform.

---

## 2. Frontend Vision

Build an enterprise-grade, mobile-first SaaS application that feels instant, consistent, responsive, and production-ready across every device.

The application should provide an instant user experience. Use intelligent prefetching, efficient caching, and background data loading to minimize perceived loading times. Route-level code splitting may be used where appropriate, but transitions should feel seamless to the user.

---

## 3. Development Order

This order is frozen. No one should start Phase 6 before Phase 3 is complete.

```
Phase 1  — Design System
Phase 2  — Application Shell
Phase 3  — Authentication
Phase 4  — Dashboard
Phase 5  — Students
Phase 6  — Admissions
Phase 7  — Batch
Phase 8  — Attendance
Phase 9  — Fees
Phase 10 — Reports
Phase 11 — AI
```

Never start a later phase before completing the earlier one. Each phase depends on the previous.

---

## 4. Folder Architecture

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── (public)/           # Landing, marketing pages
│   ├── auth/               # Login, register, forgot-password
│   └── dashboard/          # All authenticated pages
│
├── components/
│   ├── ui/                 # Shared UI components (Button, Input, Card, etc.)
│   ├── layout/             # DashboardLayout, Header, Sidebar
│   └── shared/             # Cross-feature shared components
│
├── features/               # Feature-based domain logic
│   ├── students/
│   ├── admissions/
│   ├── attendance/
│   ├── fees/
│   ├── dashboard/
│   └── settings/
│
├── services/               # API service layer (Axios calls per domain)
├── hooks/                  # Shared custom hooks
├── stores/                 # Zustand stores (auth, ui, preferences)
├── providers/              # React context providers
├── types/                  # Shared TypeScript types/interfaces
├── lib/                    # Utilities (api client, validations, helpers)
└── utils/                  # Pure utility functions
```

### Folder Rules

- `app/` — Only page components. No logic, no direct API calls. Page components compose from features and components.
- `components/ui/` — Pure presentational components. No business logic. No API calls.
- `features/` — Feature modules. Each contains its own components, hooks, and types. No cross-feature imports between features (extract shared code to `components/shared/` or `hooks/`).
- `services/` — API call functions. One file per domain. Return typed responses.
- `hooks/` — Reusable hooks shared across features.
- `stores/` — Zustand stores only. No React Query cache here.
- `lib/` — Core utilities: API client, validation schemas, type guards.

---

## 5. Feature-Based Architecture

Every feature lives in its own folder under `features/`:

```
features/students/
├── components/          # Student-specific components
│   ├── student-table.tsx
│   ├── student-card.tsx
│   ├── student-form.tsx
│   └── student-filters.tsx
├── hooks/               # Student-specific hooks
│   ├── use-students.ts
│   ├── use-student.ts
│   └── use-create-student.ts
├── services/            # Student API service
│   └── student-service.ts
└── types/               # Student-specific types
    └── student-types.ts
```

### Rules

- Every feature has its own `services/`, `hooks/`, `components/`, and `types/`
- Features do not import from other features directly
- Shared code moves to `components/shared/`, `hooks/`, or `services/`
- Page components in `app/` import from features (not the reverse)

---

## 6. API Strategy

### Stack

- **HTTP Client:** Axios (singleton instance with interceptors)
- **Server State:** TanStack Query v5 (React Query)
- **Base Service:** Centralized Axios instance with token injection, response unwrapping, error transformation

### Pattern

```
// Service layer — pure API calls, no React Query
export const studentService = {
  list: (params: StudentListParams) =>
    api.get<PaginatedResponse<Student>>('/students', { params }),

  getById: (id: string) =>
    api.get<Student>(`/students/${id}`),

  create: (data: CreateStudentDto) =>
    api.post<Student>('/students', data),

  update: (id: string, data: UpdateStudentDto) =>
    api.patch<Student>(`/students/${id}`, data),

  delete: (id: string) =>
    api.delete(`/students/${id}`),
};

// Hook layer — React Query wrappers
export function useStudents(filters: StudentListParams) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentService.list(filters),
    staleTime: 30_000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create student');
    },
  });
}
```

### Error Handling

- All API errors flow through a single Axios interceptor
- 401 → token refresh or redirect to login
- 403 → toast "You don't have permission"
- 404 → inline error state in component
- 422 → form validation errors mapped to fields
- 500 → toast "Something went wrong" + retry button
- Network error → toast "Check your connection" + retry

### Retry Strategy

- React Query: 3 retries with exponential backoff
- Mutations: no automatic retry (user must retry manually)
- Idempotent GETs: retry on 5xx only
- Non-idempotent POST/PATCH/DELETE: no retry

---

## 7. State Management

### Zustand (Global Client State)

- Auth state (user, tokens, isAuthenticated)
- UI state (sidebar open/closed, theme, mobile drawer)
- Transient UI state (toast queue, modal stack)
- Persisted to localStorage (auth only)

### React Query (Server State)

- All API data
- Cache keyed by `[domain, filters]`
- Stale time: 30s for lists, 5min for reference data
- Cache time: 10min
- Background refetch on window focus (refetchInterval for real-time data)

### Rules

- Never put server data in Zustand
- Never put UI state in React Query
- Never duplicate state — if it comes from API, it belongs in React Query
- Form state stays in react-hook-form (local only)

---

## 8. Performance Rules

### MUST

- Use React Query for all server state (caching, deduplication, background refetch)
- Prefetch data the user is likely to need next
- Use proper cache configuration (staleTime, cacheTime, refetchInterval)
- Memoize expensive computations (`useMemo`)
- Memoize callbacks passed to children (`useCallback`)
- Use virtualized tables for 100+ rows
- Optimize images with `next/image` (WebP, lazy loading, sizing)
- Route-level code splitting (default Next.js behavior)
- Use `React.memo` for pure display components
- Use Zustand selectors to prevent unnecessary re-renders

### MUST NOT

- Make unnecessary API calls
- Duplicate API requests (React Query deduplicates automatically)
- Refetch on every navigation (use proper staleTime)
- Cause heavy re-renders (inline objects, unnecessary context updates)
- Use barrel imports that pull entire libraries
- Import feature code in unrelated features

### Prefetch Rules

When the user is on a page, prefetch what they are likely to open next:

```
Dashboard
  ↓ Prefetch
  Students (first page)
  Notifications (unread count)
  Profile (user info)
  Today's Stats

Student List
  ↓ Prefetch
  Student Details (first 3 student IDs)
  Admissions (recent)
  Attendance Summary (today)

Student Details
  ↓ Prefetch
  Edit form data
  Fee history
  Attendance records
  Batch enrollment info

Admissions
  ↓ Prefetch
  Academic Years
  Courses
  Branches
  Fee Structures

Batch
  ↓ Prefetch
  Students (enrolled list)
  Tutors
  Attendance (today)
  Schedule

Attendance
  ↓ Prefetch
  Today's batch list
  Student list per batch

Fees
  ↓ Prefetch
  Pending payments
  Collection summary
  Fee structures
```

Implementation:

```ts
// In the Dashboard page component
useEffect(() => {
  // Prefetch students list in background
  queryClient.prefetchQuery({
    queryKey: ['students', { page: 1, limit: 10 }],
    queryFn: () => studentService.list({ page: 1, limit: 10 }),
  });

  // Prefetch notifications
  queryClient.prefetchQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.getUnreadCount(),
  });
}, [queryClient]);
```

---

## 9. Navigation Performance

### Next.js Link Prefetch

- All `<Link>` components use Next.js automatic prefetch (links in viewport)
- For critical links below the fold, use `prefetch={true}` explicitly
- For rarely used links (settings, admin), use `prefetch={false}` to save bandwidth

### React Query Prefetch

- On page mount, prefetch data for the most likely next navigation
- Prefetch in parallel, not sequentially
- Store prefetched data in React Query cache (available instantly when navigated)

### Instant Transition Goal

- User clicks a link → 0ms loading state (data comes from cache or prefetch)
- If data is not cached, show skeleton immediately (not spinner)
- Navigation itself is instant (Next.js client-side navigation)

---

## 10. Loading Strategy

Never show a blank page. Every screen follows:

```
Navigation Click
    ↓
Show Skeleton (immediately, within 100ms)
    ↓
Fetch Data (React Query)
    ↓
Content (replace skeleton)
```

### Skeleton Rules

- Skeleton must match the exact dimensions of final content
- Skeleton rows for tables, skeleton cards for grids, skeleton lines for text
- Use pulse animation (opacity 0.3 → 0.7, 1500ms loop)
- Never use full-page spinner for data loading
- Button spinner only for mutations (save, delete)

---

## 11. Error Strategy

| Error Type           | UI Response                                         |
| -------------------- | --------------------------------------------------- |
| Form validation      | Inline error below field (on blur)                  |
| API mutation failure | Toast error + keep form data                        |
| API fetch failure    | Inline error state in component (with retry button) |
| Network offline      | Banner at top: "You are offline"                    |
| 401 Unauthorized     | Redirect to login                                   |
| 403 Forbidden        | Toast: "You don't have access"                      |
| 404 Not found        | Inline: "Resource not found"                        |
| 500 Server error     | Toast + retry button                                |

### Error State Component

Every data-dependent component must handle:

```tsx
if (isLoading) return <Skeleton variant="table" />;
if (isError) return <ErrorState message="Failed to load students" onRetry={refetch} />;
if (!data?.items.length)
  return <EmptyState icon={Users} title="No students found" action="Create Student" />;
return <StudentTable data={data.items} />;
```

---

## 12. Component Reuse

Never duplicate a component. Follow this hierarchy:

1. Check `components/ui/` — is there an existing component?
2. Check `components/shared/` — is there a shared feature component?
3. Check `features/*/components/` — can you extract it to shared?
4. If none exists, build it in `components/ui/` (for generic) or `components/shared/` (for domain)

### Rules

- Copy-pasting components is prohibited
- If a component needs a small variation, use props (not a new component)
- If two features need the same pattern, extract to shared
- No one-off UI styles — every style must come from the design system

---

## 13. Data Fetching Rules

### Dashboard

- Fetch all widgets in **parallel** (Promise.all or useQueries)
- Never fetch sequentially

```ts
// ✅ Correct: Parallel
const stats = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: getStats });
const activity = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: getActivity });
const upcoming = useQuery({ queryKey: ['dashboard', 'upcoming'], queryFn: getUpcoming });

// ❌ Wrong: Sequential
const stats = await getStats();
const activity = await getActivity(); // waits for stats
```

### Students / Lists

- Always use **pagination** — never fetch all records
- Default page size: 10
- Allow: 10, 25, 50, 100 per page
- Search + filters sent as query params

### Detail Pages

- Fetch entity data + related data in parallel
- Use `enabled` option to wait for dependent data

### Cache Rules

- Stale time 30s for dynamic lists (students, admissions)
- Stale time 5min for reference data (courses, branches, academic years)
- Invalidate list caches on successful create/update/delete
- Use optimistic updates for fast UI response on mutations

---

## 14. Mobile Performance

### Bundle Size

- Route-level code splitting ensures mobile users don't download desktop-only code
- Dynamic imports for heavy components (charts, PDF export, AI chat)
- No large third-party libraries for mobile-only features

### Rendering

- Virtualized lists for long tables
- Debounced search inputs (300ms)
- Lazy-loaded images (next/image default)
- Avoid heavy animations on mobile (reduce motion for low-end devices)

### Touch

- All interactive elements ≥ 44px touch target
- No hover-dependent interactions (hover must be polyfilled as tap)
- Bottom sheets instead of modals on mobile
- Swipe gestures optional (not required for core functionality)

---

## 15. Accessibility

Same standards as defined in `02-ui-ux-guidelines.md` Section 18.

### Implementation Rules

- All form inputs must have associated `<label>` elements
- All icon-only buttons must have `aria-label`
- All modals must trap focus and close on Escape
- All loading states must use `aria-live="polite"`
- All error messages must be announced to screen readers
- Color is never the sole indicator of meaning (add icons or text)
- Skip-to-content link at the start of every page

---

## 16. Testing Strategy

### Unit Tests (Vitest + React Testing Library)

- All form components (validation, submission)
- All hooks (loading, error, success states)
- All utility functions
- All validation schemas

### Integration Tests (Vitest + RTL)

- Page-level flows: render → interact → assert
- Form flows: fill → submit → success/error
- Table flows: search → filter → paginate

### E2E Tests (Playwright)

- Auth flow: login → dashboard → logout
- CRUD flow: create → verify in list → view → edit → delete
- Mobile flow: navigation drawer → form fill → submission
- Error flow: network error → retry → success

### Coverage Target

- Unit: 80%+
- Integration: 70%+
- E2E: Critical paths only (auth, CRUD)

---

## 17. Code Review Checklist

Before every merge, the reviewer must verify:

- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Mobile layout works (no horizontal scroll, touch targets ≥ 44px)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] TypeScript: `pnpm typecheck` passes (0 errors)
- [ ] Lint: `pnpm lint` passes (0 errors, 0 warnings)
- [ ] No unnecessary API calls (proper caching, no fetch in render)
- [ ] No duplicate components (reused from ui/ or shared/)
- [ ] No inline styles (all styles via Tailwind classes or cn())
- [ ] Skeleton/loading state present
- [ ] Empty state present
- [ ] Error state present with retry
- [ ] Form validation working (all fields, all rules)
- [ ] Toast on success/error for mutations
- [ ] No console.log or debug code
- [ ] No hardcoded strings (token, URLs, IDs)
- [ ] Follows design system tokens (colors, spacing, radius)

---

## 18. Engineering Rules

### Always ✅

- Reuse existing components from `components/ui/`
- Reuse existing hooks from `hooks/`
- Reuse existing services from `services/`
- Reuse existing DTOs and types from `types/`
- Use `cn()` utility for class merging
- Use design tokens only (no custom colors, spacing, radius)
- Use React Query for all API interactions
- Use Zod for all form and API validation
- Use proper semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`)

### Never ❌

- Copy-paste components to create variations (use props)
- Use inline styles (`style={{}}` is prohibited)
- Duplicate API calls (use React Query deduplication)
- Duplicate validation (Zod schema in one place, reuse everywhere)
- Import from another feature's folder directly
- Use `any` type — always define proper types
- Use `useEffect` for data fetching (use React Query)
- Hardcode API URLs or tokens
- Ignore TypeScript errors
- Merge without review

---

## 19. Future Roadmap

### Phase 12 — PWA

- Service worker for offline support
- Add to home screen
- Push notifications

### Phase 13 — Offline Mode

- Cache critical data for offline access
- Queue mutations when offline, sync when online
- Conflict resolution strategy

### Phase 14 — Push Notifications

- Web push API integration
- Notification preferences per user
- Real-time updates via WebSocket

### Phase 15 — White Label

- Custom domain per tenant
- Tenant-specific theming (primary color, logo)
- Remove NEET Platform branding for enterprise clients
- Custom login page per tenant

---

## 20. Frontend Performance Standards

Every page should feel instant to the user.

### Performance Standards

- Use Next.js route prefetching wherever applicable
- Prefetch frequently accessed data using React Query
- Fetch independent resources in parallel instead of sequentially
- Use optimistic UI updates where appropriate
- Display skeleton loaders instead of blank screens
- Avoid unnecessary refetching through proper cache configuration
- Minimize bundle size through route-level code splitting (default Next.js behavior)
- Optimize images, icons, and assets
- Keep interactions responsive even on low-end mobile devices

### The application should provide an instant user experience

Use intelligent prefetching, efficient caching, and background data loading to minimize perceived loading times. Route-level code splitting may be used where appropriate, but transitions should feel seamless to the user.

> This is the approach followed by Stripe, GitHub, Vercel, Notion, and Linear. The user should never notice loading — if they do, we've failed.
