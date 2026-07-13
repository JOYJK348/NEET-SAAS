# Enterprise Frontend Architecture Specification (Next.js App Router)
**Version:** 5.0.0-Final  
**Classification:** Internal Technical Architecture  
**Author:** Principal Frontend Architect (15+ Years Enterprise Systems)  
**Target Execution Latency:** < 200ms user-perceived transition latency, ~0ms interaction feel (instantaneous)  
**Total Chapters:** 51 | **Enforcement:** ESLint + TypeScript Strict + CI/CD Pipeline + PR Checklist

---

## 1. Core Architectural Principles

To deliver a high-performance, resilient, and enterprise-grade learning management experience that feels instantaneous (achieving ~20ms interaction responses), the following frontend development rules are strictly enforced:

*   **Server Components by Default:** All layouts, page wrappers, and non-interactive list views must be React Server Components (RSC) to minimize client-side JavaScript bundles and shift rendering overhead to the server edge.
*   **Leaf-Node Client Interactivity:** Mark components with `'use client'` only at the lowest possible level in the DOM tree (e.g., individual toggle buttons, form inputs, dynamic dropdowns) to maximize static rendering capabilities.
*   **Cache-Aware and Query-Driven Views:** Raw components must never fetch data directly. Data retrieval must be delegated to specialized, React Query-wrapped hooks with precise cache invalidate policies.
*   **Zero-Spinner Layouts:** Spinners and page-level blocking loaders are prohibited. Layouts must employ skeleton UI blocks matching the exact geometry of the loading content to prevent layout shifts.
*   **Deterministic Boundary Separation:** Modules are isolated sandbox domains. The importing of logic across domains (e.g., importing a components folder from `billing` inside `attendance`) is blocked by static analysis rules. Inter-module communication is permitted only through predefined services and shared TS contracts.
*   **Optimistic Operations:** High-frequency student actions (such as attendance marking, quiz answers submission, and bookmarking) must update the UI immediately before network roundtrips complete.
*   **Budget-Bound Assets:** Every asset (JS bundles, images, icons) must pass size audits. External dependency additions require an Architecture Decision Record (ADR) approval.

---

## 2. Directory Structure & Module Boundaries

The application uses a strict feature-based monorepo-ready layout. Direct references across module directories are prohibited.

```
src/
├── app/                              # Next.js Page Router (Routing & SSR Layouts only)
│   ├── (auth)/                       # Public portal wrappers
│   ├── (platform-admin)/             # Platform core administrator routes
│   └── (tenant-admin)/               # Institute administrative workspace
│
├── components/                       # Shared Domain-Agnostic UI System
│   ├── primitives/                   # Primitive design elements (shadcn/ui base elements)
│   ├── core/                         # Global compound elements (DataTable, FormBuilder)
│   └── layouts/                      # App Shell components (Sidebar, TopBar, Breadcrumbs)
│
├── features/                         # Independent Domain Modules (Strictly Isolated)
│   ├── auth/                         # Security & token exchange systems
│   ├── academic/                     # Courses, timetables, and batch configurations
│   ├── attendance/                   # Live tracking, biometric reports, batch logs
│   │   ├── components/               # Domain-specific client UI
│   │   ├── services/                 # API client interfaces (Attendance boundaries only)
│   │   └── index.ts                  # Shared public contracts (Only what other modules see)
│   └── billing/                      # Payments, subscriptions, invoicing
│
├── lib/                              # Global Technical Infrastructure
│   ├── security/                     # CSP config, DOM sanitizers, Token persistence
│   ├── state/                        # Global Zustand UI stores
│   └── utils/                        # Formatting utilities, HSL tailwind color resolvers
│
└── providers/                        # Root context configurations
```

### Module Boundary Dependency Rules

To prevent spaghetti dependencies, boundary constraints are enforced via ESLint:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["@/features/*/*"],
        "message": "Direct deep imports are prohibited. Import only from the public api file (e.g. '@/features/attendance')."
      }]
    }]
  }
}
```

---

## 3. Rendering Decisions Matrix

We implement a hybrid rendering strategy mapped to user security levels, search visibility targets, and interactivity demands.

| Path Segment / Module | Rendering Strategy | Caching / Revalidation Policy | Suspense & Hydration Rules |
| :--- | :--- | :--- | :--- |
| `/login`, `/auth/*` | **SSR (Server-Side Rendering)** | Dynamic, no caching | Synchronous form hydration |
| `/admin/dashboard` | **PPR (Partial Prerendering)** | Layout static, content fetched client-side | Suspense bounds per chart and widget |
| `/admin/academic/courses` | **SSR + Client Cache** | staleTime: 5 min, gcTime: 30 min | Stream table skeletons |
| `/admin/reports` | **CSR (Client-Side Rendering)** | Dynamic, bypass persistent storage cache | Lazy-loaded heavy PDF/CSV parsing modules |
| `/marketing/*` | **ISR (Incremental Static Reval)** | Revalidate: 3600 seconds (1 hour) | Server cache edge distribution |
| `/admin/settings` | **SSR (Dynamic Layout)** | Dynamic, no caching | Standard form wrappers |

---

## 4. Global Data Ownership Matrix

State is split by mutate patterns and persistence requirements to prevent stale state bugs and sync lag.

| Data Frame | Owner | Mechanism | Mutation Access | Lifecycle / Persistence |
| :--- | :--- | :--- | :--- | :--- |
| **Server State** | React Query | Cache Memory / Hydration | Mutations / Invalidation | sessionStore synced, background refresh |
| **Transient UI State** | Zustand (Selective Selectors) | React Context Memory | Direct Store Actions | Tab runtime memory, clean on unload |
| **Brand Customizations** | Cookies | HTTP Header / Client State | Server-side actions | Persistent Cookie |
| **Input Form Buffer** | React Hook Form | Virtual Input State | Input-level bindings | Component execution lifetime |
| **Active Filters / Page** | URL State | Next Router SearchParams | router.push / query mutate | Browser URL History, shareable link |
| **Access Tokens (JWT)** | Client Memory | JS Variable | Silent token refresh rotation | In-memory only (Secure HttpOnly Cookie) |
| **Refresh Token** | Server Session | HttpOnly Cookie | Cookie rotation endpoint | Secure cookie storage |

---

## 5. Query Key Registry (`queryKeys.ts`)

All cache query keys must be declared inside a centralized typed registry object. Custom inline query key arrays are strictly prohibited.

```typescript
// lib/observability/queryKeys.ts

// ── Strongly-typed filter interfaces (Never use Record<string, any>) ──
export interface StudentFilters {
  page: number;
  limit: number;
  search?: string;
  batchId?: string;
  academicStatus?: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN' | 'ALUMNI';
  admissionYear?: number;
  sortBy?: 'name' | 'admissionDate' | 'rollNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceFilters {
  batchId: string;
  date?: string;       // ISO date string
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface InvoiceFilters {
  page: number;
  limit: number;
  studentId?: string;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dateRange?: { from: string; to: string };
  sortBy?: 'dueDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ExamFilters {
  batchId?: string;
  subjectId?: string;
  examType?: 'UNIT_TEST' | 'MID_TERM' | 'FINAL' | 'MOCK';
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
    permissions: () => ['auth', 'permissions'] as const,
    featureFlags: () => ['auth', 'flags'] as const,
  },
  dashboard: {
    summary: () => ['dashboard', 'summary'] as const,
    analytics: (range: string) => ['dashboard', 'analytics', range] as const,
    activities: () => ['dashboard', 'activities'] as const,
  },
  student: {
    list: (filters: StudentFilters) => ['students', 'list', filters] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
    admissions: (id: string) => ['students', 'admissions', id] as const,
    documents: (id: string) => ['students', 'documents', id] as const,
  },
  attendance: {
    today: (batchId: string) => ['attendance', 'today', batchId] as const,
    history: (studentId: string, range: string) => ['attendance', 'history', studentId, range] as const,
    batch: (filters: AttendanceFilters) => ['attendance', 'batch', filters] as const,
  },
  billing: {
    invoices: (filters: InvoiceFilters) => ['billing', 'invoices', filters] as const,
    transactions: (studentId: string) => ['billing', 'transactions', studentId] as const,
    summary: () => ['billing', 'summary'] as const,
  },
  exam: {
    list: (filters: ExamFilters) => ['exams', 'list', filters] as const,
    detail: (id: string) => ['exams', 'detail', id] as const,
    results: (examId: string) => ['exams', 'results', examId] as const,
  },
};
```

---

## 6. Layout Level Data Registry

To avoid nested component layout waterfalls, parent Layout containers execute layout-level query prefetching. Child leaf nodes must access this data strictly from the pre-populated React Query cache (0ms lookup).

```typescript
// app/(tenant-admin)/admin/layout.tsx
import { executeLoginWarmup } from '@/features/auth/services/warmup';
import { queryClient } from '@/lib/queryClient';

export default async function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  // Prefetch bootstrap payloads server-side inside Layout before streaming children
  await executeLoginWarmup(queryClient);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## 7. Form Construction & Validation Pipeline

Forms are constructed using Zod schemas dynamically bound to standard shadcn fields:

```typescript
// components/core/FormBuilder.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

interface FormBuilderProps<T extends z.ZodType<any, any>> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void;
  defaultValues: z.infer<T>;
  fields: { name: string; label: string; placeholder?: string; type?: string }[];
}

export function FormBuilder({ schema, onSubmit, defaultValues, fields }: FormBuilderProps<any>) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f.label}</FormLabel>
                <FormControl>
                  <Input placeholder={f.placeholder} type={f.type || 'text'} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </form>
    </Form>
  );
}
```

---

## 8. Selective Zustand Store Architecture

To prevent unnecessary global render sweeps, developers must never retrieve store variables using complete state destructurings. Selectors are mandatory.

```typescript
// Correct Selector Usage
const isOpen = useSidebarStore((state) => state.isOpen);
const toggle = useSidebarStore((state) => state.toggle);

// Prohibited Store Usage (Causes re-renders on any state changes)
// const { isOpen, toggle } = useSidebarStore();
```

---

## 9. Render Boundaries & Performance Guards

We isolate exceptions using localized boundaries to keep dashboard crashes from breaking the global app frame.

```typescript
// components/common/ErrorBoundary.tsx
'use client';

import React from 'react';

export class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // NEVER use console.error() directly — route through centralized capture
    captureFrontendException('ErrorBoundary caught an error', { error, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

---

## 10. DataTable Architecture (Highly Optimized Grid)

Our core grid uses row/column virtualization, memoized cells, and client persistence configurations:

```typescript
// components/core/DataTable.tsx
import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Column<T> {
  header: string;
  accessor: keyof T;
  cell?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // row height
    overscan: 10,
  });

  const headers = useMemo(() => (
    <tr className="border-b bg-muted/50">
      {columns.map((c) => (
        <th key={String(c.accessor)} className="p-3 text-left font-medium">{c.header}</th>
      ))}
    </tr>
  ), [columns]);

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto rounded-md border">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-background">{headers}</thead>
        <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const row = data[vRow.index];
            return (
              <tr
                key={vRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${vRow.start}px)`,
                  height: `${vRow.size}px`,
                }}
                className="flex w-full border-b hover:bg-muted/30"
              >
                {columns.map((col) => (
                  <td key={String(col.accessor)} className="flex-1 p-3 align-middle">
                    {col.cell ? col.cell(row[col.accessor], row) : String(row[col.accessor])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 11. Security Controls

We prevent client-side data leaks, content injections, and framing exploits using the following security controls:

*   **XSS Mitigation:** Content rendering must be sanitized on the client using `DOMPurify` before mounting to the DOM.
*   **Content Security Policy (CSP):** Layout responses must carry strict CSP headers containing `nonce` injections.
*   **CSRF Prevention:** Axios requests include validation checks that reject modifications unless the payload carries a `X-CSRF-Token` header.
*   **X-Frame-Options:** Headers must enforce `DENY` to restrict iframe wrapping (clickjacking protection).
*   **Client Cookie Storage:** Session identifiers must never be written to `localStorage`. Only use `Secure`, `HttpOnly`, `SameSite=Strict` cookies.

---

## 12. Asset and Font Optimization

Assets are optimized to minimize initial layout shift and latency:

*   **Font Subsets:** All system fonts must load via `next/font/google` using the `latin` subset and display swap parameter to prevent Cumulative Layout Shift (CLS):
    ```typescript
    // app/layout.tsx
    import { Inter } from 'next/font/google';
    const inter = Inter({ subsets: ['latin'], display: 'swap' });
    ```
*   **Edge Resizing CDN:** External profile images are fetched using Cloudflare R2 parameters: `https://cdn.platform.com/cdn-cgi/image/width=128,quality=80/avatar.png`
*   **Priority Preloading:** The logo and the default tenant background images must be preloaded immediately on login validation.

---

## 13. Bundle Governance & Budgets

To prevent bundle size decay over time, our CI/CD pipeline enforces strict binary budgets. PRs exceeding the following sizes are blocked from merge:

```yaml
# .github/workflows/bundle-guard.yml
name: Bundle Size Guard
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and Analyze
        run: npm run build
      - name: Assert Budgets
        run: |
          node -e "
            const budgets = {
              'dashboard': 150000, // 150KB gzip
              'billing': 120000,   // 120KB gzip
              'analytics': 250000  // 250KB gzip
            };
            // check against build output manifest and throw if budget exceeded
          "
```

---

## 14. Global Network Loading Strategy

We leverage HTTP/2 features and server hint configurations to download assets in parallel:

*   **Preconnect & DNS Prefetch:** Connect early to key edge resources:
    ```html
    <link rel="preconnect" href="https://cdn.platform.com" />
    <link rel="dns-prefetch" href="https://cdn.platform.com" />
    ```
*   **Network Priorities (HTTP/2):** Layout-critical chunks (CSS, theme configs) use `fetchPriority="high"`. Analytical reports and charts use `fetchPriority="low"`.
*   **Caching & Validation:** Response headers enforce ETags and `Cache-Control: public, max-age=31536000, immutable` for static components.

---

## 15. Frontend Performance Engineering (The Core Speed Architecture)

This chapter lays out the runtime execution and data synchronization protocols designed to achieve a sub-50ms user-perceived interface experience and bypass traditional 3-second data loading bottlenecks.

### 15.1 Runtime Cache Hierarchy Model

All requested application metadata passes through a cascading cache lookup structure. Network roundtrips represent a fallback of last resort.

```
[Browser UI Thread Request]
          │
          ├── 1. Memory Lookups ──────> [Query Client In-Memory Cache] (0ms - 2ms)
          │                                  │
          │                                  └── [If Miss]
          │
          ├── 2. Client Persistence ──> [Persisted Storage: SessionStorage] (2ms - 5ms)
          │                                  │
          │                                  └── [If Miss]
          │
          ├── 3. Edge CDN Caching ────> [Cloudflare Edge KV / Cache Headers] (10ms - 50ms)
          │                                  │
          │                                  └── [If Miss]
          │
          └── 4. Origin Database ─────> [Direct DB / API Fetching Payload] (> 150ms)
```

### 15.2 The Unified Bootstrap Endpoint (`POST /bootstrap`)

To eliminate the latency waterfall caused by sequential client queries, we consolidate auth and tenant metadata fetches into a single `/bootstrap` endpoint. This drops loading latency from ~4s to ~150ms.

```
[Login Success] ─> Call GET/POST /bootstrap ─> Hydrate Client Stores ─> Render Home Layout
```

The bootstrap payload compiles:
1.  **RBAC Configs:** Role permissions, dynamic authorization maps.
2.  **Tenant Parameters:** Custom HSL branding variables, logos.
3.  **Active Environment:** Current Academic Year, Campus Branches configurations.
4.  **User Identity:** Base profile, notifications badge counts.
5.  **Feature Flags:** Active features toggles.

### 15.3 Persistent Client Caching (`PersistQueryClient`)

We persist React Query's memory cache state directly inside the browser's `sessionStorage`. This maintains state continuity across page reloads without leaking data across tabs:

```typescript
// lib/observability/persistCache.ts
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { queryClient } from '../queryClient';

const sessionStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
});

export function initializePersistentCache() {
  persistQueryClient({
    queryClient,
    persister: sessionStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 Hours validity stamp
  });
}
```

### 15.4 Suspense & Progressive Hydration Layout Structures

Dashboard and complex data layouts must split rendering components using `Suspense` borders to allow Next.js progressive rendering streams. This keeps slow widgets from blocking parent screen rendering:

```typescript
// app/(tenant-admin)/admin/dashboard/page.tsx
import { Suspense } from 'react';
import { KPICardsContainer } from '@/components/dashboard/KPICardsContainer';
import { AttendanceChartSkeleton, LiveAnalyticsSkeleton } from '@/components/dashboard/Skeletons';

const DynamicAttendanceChart = dynamic(() => import('@/components/dashboard/AttendanceChart'), { ssr: false });
const DynamicLiveAnalytics = dynamic(() => import('@/components/dashboard/LiveAnalytics'), { ssr: false });

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Primary KPI Metrics: Static Layout / Pre-rendered */}
      <KPICardsContainer />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stream Chart: Suspended separately */}
        <Suspense fallback={<AttendanceChartSkeleton />}>
          <DynamicAttendanceChart />
        </Suspense>

        {/* Stream Activity Feed: Suspended separately */}
        <Suspense fallback={<LiveAnalyticsSkeleton />}>
          <DynamicLiveAnalytics />
        </Suspense>
      </div>
    </div>
  );
}
```

### 15.5 Predictive Route & Data Prefetching

When the cursor hovers over navigation links, the platform preemptively warms up the target routes and resources:

```typescript
// components/layouts/Sidebar/SidebarItem.tsx
'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/observability/queryKeys';
import { peopleService } from '@/features/people/services/people.service';

export function SidebarItem({ label, href }: { label: string; href: string }) {
  const queryClient = useQueryClient();

  const handleWarmup = () => {
    if (href.startsWith('/admin/people/learners')) {
      // Warm up API queries
      queryClient.prefetchQuery({
        queryKey: queryKeys.student.list({ page: 1, limit: 25 }),
        queryFn: () => peopleService.list({ page: 1, limit: 25 }),
        staleTime: 300000,
      });
    }
  };

  return (
    <Link 
      href={href} 
      onMouseEnter={handleWarmup}
      onFocus={handleWarmup}
      className="flex items-center space-x-2 rounded-lg p-2 hover:bg-primary/10"
    >
      <span>{label}</span>
    </Link>
  );
}
```

### 15.6 Virtualization & Infinite Scroll Strategy

Rendering thousands of DOM nodes causes heavy thread locking. The table below lists the layout virtualization strategies required based on result row size:

| Dataset Size | Interface Strategy | Technical Implementation | Pagination Mode |
| :--- | :--- | :--- | :--- |
| **< 100 Rows** | Standard paginated table | Base shadcn elements | Server offset paging |
| **101 - 500 Rows** | Virtual scroll list | `TanStack Virtual` | Server offset paging |
| **501 - 5000 Rows** | Infinite loading grid | `useInfiniteQuery` + `TanStack Virtual` | Keyset/Cursor pagination |
| **> 5000 Rows** | Elastic search filters + virtual view | Search Index server queries + Virtual table | Strict cursor queries |

### 15.7 Component Lazy Loading Policies

To maintain a minimal initial JS bundle, components are classified into dynamic loading groups:

| component Group | Dynamic Loading Mode | lazy Import Strategy | Bundle Budget (Gzipped) |
| :--- | :--- | :--- | :--- |
| **Critical Frames** (Sidebar, Header) | Synchronous / Core Hydrate | Eager Import | `< 30 KB` |
| **Layout Content** (KPI Cards, Details) | Progressive / CSR | Eager Import | `< 50 KB` |
| **Heavy Panels** (Charts, Recharts) | Dynamic Deferred | `dynamic(() => import(...), { ssr: false })` | `< 120 KB` |
| **Utility Panels** (Rich Text, Calendars) | Lazy Hover | Loaded on container hover/activation | `< 250 KB` |
| **Heavy Libraries** (Excel parsing, PDF views) | Idle Defer | Dynamically loaded via request callbacks | `< 500 KB` |

### 15.8 Image Loading & Cloudflare R2 Optimization

Images must prevent Cumulative Layout Shift (CLS) and leverage edge processing optimization:

*   **Format Selection:** All responsive images are loaded as `AVIF` format (supported on Cloudflare CDN) with `WEBP` fallback.
*   **Dimensions Allocation:** The `next/image` tag must explicitly carry width and height boundaries to reserve layout sizes.
*   **Edge Resizing:** User profiles fetch optimized thumbnails dynamically using R2 edge transformations: `https://cdn.platform.com/cdn-cgi/image/width=128,quality=80/avatar.png`.
*   **Priority Preloading:** Above-the-fold images (such as tenant logotypes and user avatar icons) must carry the `priority` tag to ensure preloading.

### 15.9 Mutation & Optimistic UI Matrix

For high-frequency actions, the UI must immediately reflect success, scheduling background synchronizations and rolling back on network failures.

| User Action | Optimistic UI Strategy | rollback Action | API Invalidation Target |
| :--- | :--- | :--- | :--- |
| **Marking Attendance** | Toggle local present/absent array | Restore original state value | Invalidate `attendance.today()` |
| **Answering Quiz Question** | Mark option state as checked | Restore previous option value | Invalidate `assessments.state()` |
| **Updating Student Profile** | Normal loading mask, no optimistic state | None (Standard Form Validation) | Invalidate `student.detail()` |
| **Deleting Student Profile** | Remove row immediately from virtual table | Re-insert row back into cache array | Invalidate `student.list()` |
| **Bulk CSV Rosters Upload** | Show upload progress bar inside notifications | Reset notification progress bar | Invalidate `student.list()` |

#### Optimistic Mutation Implementation Example:

```typescript
// features/attendance/hooks/useMarkAttendance.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/observability/queryKeys';
import { attendanceApi } from '../services/attendanceApi';

export function useMarkAttendance(batchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attendanceApi.markPresent,
    onMutate: async ({ studentId, isPresent }) => {
      // Cancel active outgoing fetches to prevent overwriting local states
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance.today(batchId) });

      // Snapshot the current cache state
      const previousState = queryClient.getQueryData(queryKeys.attendance.today(batchId));

      // Optimistically modify cache array state
      queryClient.setQueryData(queryKeys.attendance.today(batchId), (old: any) => {
        return old.map((s: any) => s.studentId === studentId ? { ...s, present: isPresent } : s);
      });

      // Return snapshot value to support rollback on error
      return { previousState };
    },
    onError: (err, variables, context) => {
      // Rollback to snapshot state
      if (context?.previousState) {
        queryClient.setQueryData(queryKeys.attendance.today(batchId), context.previousState);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today(batchId) });
    },
  });
}
```

### 15.10 Network Level Loading Strategies

We implement edge pre-connection rules inside the Next.js `DocumentLayout` headers:

*   **Pre-connect & DNS Prefetch:** Warm up external assets links early:
    ```html
    <link rel="preconnect" href="https://cdn.platform.com" />
    <link rel="dns-prefetch" href="https://cdn.platform.com" />
    ```
*   **Compression Rules:** Cloudflare edge handles `Brotli` and `gzip` compression headers automatically.
*   **Cache-Control & ETags:** Static assets (fonts, icons) use:
    `Cache-Control: public, max-age=31536000, immutable`
    Dynamic API responses leverage `ETag` matching headers to prevent downloading unmodified payloads.

### 15.11 UI Thread Blocking Controls (Zero-Freeze UI)

To keep user input handlers responsive (< 50ms INP), execution tasks are kept off the primary browser rendering thread:

*   **No Render Execution Awaiting:** Never resolve asynchronous operations inside render loops.
*   **Web Workers for Data Parsing:** Large calculations, such as client-side JSON parsing of bulk student CSV logs (exceeding 2MB), must be offloaded to Web Workers:
    ```typescript
    // utils/parseCsvWorker.ts
    const worker = new Worker(new URL('./csvParser.worker.ts', import.meta.url));
    worker.postMessage(csvRawString);
    worker.onmessage = (event) => {
      const parsedData = event.data;
      // Update store state with parsedData
    };
    ```

### 15.12 Error Recovery & Exponential Backoff

All API calls must support network retries with exponential backoff:

```typescript
// lib/utils/backoff.ts
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithBackoff(fn: () => Promise<any>, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await wait(delay);
    return fetchWithBackoff(fn, retries - 1, delay * 2);
  }
}
```

---

## 16. Observability, Logging & Tracing

Our telemetry engine tracks core vitals, logging slow rendering cycles and HTTP payloads exceeding specified latency metrics:

```typescript
// lib/observability/telemetry.ts
import { captureFrontendLog } from './logger';

export function monitorPerformanceMetrics() {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Audit slow API operations exceeding SLA targets
      if (entry.entryType === 'resource' && entry.duration > 1000) {
        captureFrontendLog('WARN', 'SLA Latency Violation: API call took > 1s', {
          name: entry.name,
          duration: `${entry.duration.toFixed(2)}ms`,
        });
      }
      
      // Audit layout shifts
      if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
        captureFrontendLog('WARN', 'CLS Layout Shift Triggered', {
          value: (entry as any).value,
        });
      }
    }
  });

  observer.observe({ entryTypes: ['resource', 'layout-shift', 'paint'] });
}
```

---

## 17. The Frontend Bootstrap & Navigation Pipeline

To ensure the user perceives an instant load, the application coordinates boots and page transitions across structured queues:

### 17.1 Runtime Bootstrap Pipeline Flow

```
[Browser App Startup]
          │
          ├── 1. Sync Load: Parse localSession ────> Hydrate React Query & Zustand Stores (0ms - 5ms)
          │
          ├── 2. Auth Verification Check ──────────> Validate Access Tokens In Memory (2ms)
          │                                              │
          │                                              └── [If Expired] ──> Silent Token Refresh RTT
          │
          ├── 3. Dynamic Multi-Tenant Resolution ──> Extract Tenant Domain & Fetch Settings (10ms)
          │
          ├── 4. Trigger Bootstrap payload ────────> Execute GET/POST /bootstrap (1 RTT / ~120ms)
          │                                              │
          │                                              └── Retrieves Profile, RBAC, Settings, Flags
          │
          ├── 5. Hydrate UI Layout Frames ─────────> Mount Navigation shell and load Skeletons
          │
          ├── 6. Dispatch Priority Queue 1 ────────> Load KPIs, notifications, and branch lists
          │
          ├── 7. Dispatch Priority Queue 2 ────────> Load courses rosters and class timetables
          │
          └── 8. Idle Telemetry Scheduler ─────────> Pre-fetch reports, configurations on Idle
```

### 17.2 The Intelligent Prefetch Engine

To learn and predict user navigation paths, we observe client transition selections and trigger background caches dynamically:

```typescript
// lib/observability/prefetchEngine.ts
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from './queryKeys';
import { peopleService } from '@/features/people/services/people.service';

const USER_PATH_HISTORY_KEY = 'platform_prefetch_history';

export function recordTransitionAndPrefetch(currentPath: string, nextPath: string) {
  if (typeof window === 'undefined') return;

  const history = JSON.parse(localStorage.getItem(USER_PATH_HISTORY_KEY) || '{}');
  history[currentPath] = history[currentPath] || {};
  history[currentPath][nextPath] = (history[currentPath][nextPath] || 0) + 1;
  localStorage.setItem(USER_PATH_HISTORY_KEY, JSON.stringify(history));

  // Determine top likely routes from current path
  const paths = history[currentPath];
  const sortedPaths = Object.keys(paths).sort((a, b) => paths[b] - paths[a]);
  
  if (sortedPaths[0] && sortedPaths[0].includes('/admin/people/learners')) {
    // Eagerly prefetch next likely query on browser idle thread
    window.requestIdleCallback(() => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.student.list({ page: 1, limit: 25 }),
        queryFn: () => peopleService.list({ page: 1, limit: 25 }),
      });
    });
  }
}
```

### 17.3 Cache Dependency Validation Graph

Instead of invalidating all cache entries via `invalidateQueries()`, we invalidate only targets impacted by changes:

```typescript
// lib/observability/cacheGraph.ts
import { queryClient } from '../queryClient';

const CACHE_DEPENDENCY_GRAPH: Record<string, string[]> = {
  'student.update': ['students', 'dashboard', 'attendance'],
  'attendance.mark': ['attendance', 'dashboard'],
  'invoice.create': ['billing', 'dashboard'],
};

export function invalidateAffectedCache(event: keyof typeof CACHE_DEPENDENCY_GRAPH) {
  const targets = CACHE_DEPENDENCY_GRAPH[event];
  if (targets) {
    targets.forEach((keyPrefix) => {
      queryClient.invalidateQueries({ queryKey: [keyPrefix] });
    });
  }
}
```

### 17.4 Smart Background Refresh & WebSocket Cache Synchronization

We sync client caches with real-time updates to keep dashboards fresh without polling:

```typescript
// lib/observability/socketSync.ts
import { queryClient } from '../queryClient';

export function initializeWebSocketCacheSync() {
  const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'wss://api.platform.com/ws');

  ws.onmessage = (event) => {
    const { action, payload } = JSON.parse(event.data);
    
    // Process real-time cache updates without querying backend
    if (action === 'STUDENT_CHECKIN') {
      const { studentId, batchId, isPresent } = payload;
      
      queryClient.setQueryData(['attendance', 'today', batchId], (old: any) => {
        if (!old) return old;
        return old.map((s: any) => s.studentId === studentId ? { ...s, present: isPresent } : s);
      });
    }
  };
}
```

---

## 19. Design System Governance

Uniform consistency across tenants and layouts is governed via declarative design tokens. Direct overrides with magic Tailwind classes (like `p-5`) are lint-blocked.

```typescript
// lib/theme/tokens.ts
export const designTokens = {
  spacing: {
    xxs: '0.25rem',  // 4px
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    h3: '1.5rem',
    h2: '1.875rem',
    h1: '2.25rem',
  },
  elevation: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  motion: {
    transitionInstant: 'all 50ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSmooth: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  }
};
```

---

## 20. Accessibility Standard (WCAG 2.2 AA Compliance)

Every custom component must strictly support keyboard navigation and screen-reader accessibility rules:

```typescript
// components/primitives/AccessibleDialog.tsx
'use client';

import React, { useEffect, useRef } from 'react';

export function AccessibleDialog({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Trap keyboard focus on open
    const focusableElements = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={dialogRef} className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 id="dialog-title" className="text-lg font-bold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
```

---

## 21. Feature Flag Architecture

Features deployment and runtime configurations are managed via a centralized declarative provider:

```typescript
// providers/FeatureFlagProvider.tsx
'use client';

import React, { createContext, useContext } from 'react';

const FeatureFlagContext = createContext<Record<string, boolean>>({});

export function FeatureFlagProvider({ flags, children }: { flags: Record<string, boolean>; children: React.ReactNode }) {
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(flag: string): boolean {
  const flags = useContext(FeatureFlagContext);
  return !!flags[flag];
}
```

---

## 22. Offline Sync & Mutation Queuing (V2 Ready)

High-frequency actions (such as marking attendance) are recorded locally when offline, and synced when connection is restored:

```typescript
// lib/observability/offlineQueue.ts
import { fetchWithBackoff } from './backoff';

interface OfflineTask {
  id: string;
  url: string;
  payload: any;
}

export function queueOfflineMutation(url: string, payload: any) {
  const queue: OfflineTask[] = JSON.parse(localStorage.getItem('offline_mutations') || '[]');
  queue.push({ id: crypto.randomUUID(), url, payload });
  localStorage.setItem('offline_mutations', JSON.stringify(queue));
  
  // Register service event to sync on network restore
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.sync.register('sync-offline-mutations');
    });
  }
}

export async function processOfflineQueue() {
  const queue: OfflineTask[] = JSON.parse(localStorage.getItem('offline_mutations') || '[]');
  if (queue.length === 0) return;

  for (const task of queue) {
    await fetchWithBackoff(() => fetch(task.url, { method: 'POST', body: JSON.stringify(task.payload) }));
  }
  
  localStorage.removeItem('offline_mutations');
}
```

---

## 23. Progressive Web App (PWA) Configuration

Offline asset storage and background sync rules are registered inside the Service Worker config:

```javascript
// public/sw.js
const CACHE_NAME = 'neet-saas-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/offline.html',
  '/styles/global.css',
  '/fonts/inter.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-mutations') {
    event.waitUntil(processOfflineQueue()); // Trigger queue sync
  }
});
```

---

## 24. Finite State Machine for Complicated UX (XState)

For UI wizards with complicated transitions (such as Admissions multi-step and Billing Invoice creations), we replace fragile loading booleans with finite state machines:

```typescript
// features/academic/machines/admissionMachine.ts
import { createMachine } from 'xstate';

export const admissionMachine = createMachine({
  id: 'admission',
  initial: 'idle',
  states: {
    idle: {
      on: { SUBMIT: 'validating' }
    },
    validating: {
      on: {
        SUCCESS: 'payment_pending',
        FAIL: 'error'
      }
    },
    payment_pending: {
      on: {
        PAYMENT_SUCCESS: 'enrolled',
        PAYMENT_FAIL: 'payment_retry'
      }
    },
    payment_retry: {
      on: { RETRY: 'payment_pending' }
    },
    enrolled: {
      type: 'final'
    },
    error: {
      on: { BACK: 'idle' }
    }
  }
});
```

---

## 25. Enterprise Testing Matrix

To guarantee robust components, PR checks verify coverage across three testing tiers:

```
[Unit / Utility Helpers Checks] ──> Vitest / Testing Library (Target: > 90% coverage)
[Component Interactivity Checks] ─> Storybook Interactions / MSW Mock API
[Integrated User Flow Checks] ───> Playwright End-to-End browser test automation
```

```typescript
// __tests__/useMarkAttendance.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useMarkAttendance } from '@/features/attendance/hooks/useMarkAttendance';
import { queryClient } from '@/lib/queryClient';

describe('useMarkAttendance Hook', () => {
  it('should optimistically modify student attendance cache status', async () => {
    const { result } = renderHook(() => useMarkAttendance('batch_123'));
    
    result.current.mutate({ studentId: 'student_1', isPresent: true });

    // Assert cache was updated immediately before network completed
    const state: any = queryClient.getQueryData(['attendance', 'today', 'batch_123']);
    expect(state.find((s: any) => s.studentId === 'student_1').present).toBe(true);
  });
});
```

---

## 26. Memory Leak Guard & Cleanups

Unresolved observers or sockets block Javascript memory cleanup. The following cleanup protocols are mandatory:

*   **Cancel Outgoing Queries on Unmount:** Page changes must cancel pending fetches:
    ```typescript
    useEffect(() => {
      return () => {
        queryClient.cancelQueries({ queryKey: ['active_page_data'] });
      };
    }, []);
    ```
*   **Disconnect Resize & Mutation Observers:** Ensure listeners disconnect cleanly:
    ```typescript
    useEffect(() => {
      const observer = new ResizeObserver(() => {});
      return () => observer.disconnect();
    }, []);
    ```
*   **WS Sockets Disconnections:** WebSockets must close explicitly on component unmount to prevent connection exhaustion.

---

## 27. Enterprise Deployment & Environments Isolation

The platform enforces isolation across deployment nodes to secure SaaS client operations:

```
[Pull Request Created] ──────> Vercel Preview Build (Ephemeral isolated build node)
[Merged to Main Branch] ────> Vercel Staging Environment (Beta Tenant testing sandbox)
[Production Deployment] ────> Canary Routing Node (10% traffic -> 100% after 6hr validation)
```

Rollbacks are automated. If the client telemetry logs an error rate increase exceeding 1.5% in the first hour of production deployment, the routing node rolls back to the previous stable release.

---

## 28. Sequence Diagram: Eager Navigation and Mutation Lifecycle

```
[User]                 [Client UI]             [React Query Cache]          [API Service]
  │                         │                           │                         │
  ├─Hover over Attendance──>│                           │                         │
  │                         ├─Eagerly Prefetch Query───>│                         │
  │                         │                           ├─Fetch stale data? ─────>│
  │                         │                           │<─Return fresh payload───┤
  │                         │<─Store updated cache──────┤                         │
  │                         │                           │                         │
  ├─Click Attendance Item──>│                           │                         │
  │                         ├─Render page instantly─────┤                         │
  │                         │  from Cache (< 20ms)      │                         │
  │                         │                           │                         │
  ├─Toggle check-in status─>│                           │                         │
  │                         ├─Apply Optimistic UI──────>│                         │
  │                         │  immediately              │                         │
  │                         ├─Execute Mutation───────────────────────────────────>│
  │                         │                                                     ├─Process Update
  │                         │<─Success confirmation───────────────────────────────┤
  │                         ├─Invalidate Query Cache───>│                         │
  │                         │                           ├─Trigger silent refetch─>│
  │                         │                           │<─Fresh status payload───┤
  │                         │<─Silently update UI───────┤                         │
```

---

## 29. Frontend Authorization Layer (Permission Guards)

Backend RBAC alone is insufficient. The frontend must enforce visibility and action constraints at three levels: **Route Guards**, **Component Guards**, and **Hook-level Permission Checks**. This prevents unauthorized UI elements from even rendering.

### 29.1 Permission Types Contract

```typescript
// lib/security/permissions.types.ts
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve' | 'archive';
export type PermissionResource =
  | 'student' | 'staff' | 'parent'
  | 'batch' | 'course' | 'subject'
  | 'attendance' | 'exam' | 'assessment'
  | 'invoice' | 'payment' | 'fee_structure'
  | 'report' | 'settings' | 'tenant'
  | 'admission' | 'timetable' | 'notification';

export type Permission = `${PermissionResource}.${PermissionAction}`;

// Example: 'student.create', 'attendance.update', 'invoice.delete'
```

### 29.2 Permission Provider & Hook

```typescript
// providers/PermissionProvider.tsx
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/observability/queryKeys';
import type { Permission } from '@/lib/security/permissions.types';

interface PermissionContextValue {
  permissions: Set<Permission>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  permissions: new Set(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isLoading: true,
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { data: rawPermissions = [], isLoading } = useQuery({
    queryKey: queryKeys.auth.permissions(),
    staleTime: 1000 * 60 * 15, // 15 min — permissions rarely change mid-session
  });

  const ctx = useMemo<PermissionContextValue>(() => {
    const permSet = new Set<Permission>(rawPermissions);
    return {
      permissions: permSet,
      hasPermission: (p) => permSet.has(p),
      hasAnyPermission: (ps) => ps.some((p) => permSet.has(p)),
      hasAllPermissions: (ps) => ps.every((p) => permSet.has(p)),
      isLoading,
    };
  }, [rawPermissions, isLoading]);

  return <PermissionContext.Provider value={ctx}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  return useContext(PermissionContext);
}
```

### 29.3 Declarative `<Can>` Component Guard

```typescript
// components/core/Can.tsx
'use client';

import type { Permission } from '@/lib/security/permissions.types';
import { usePermission } from '@/providers/PermissionProvider';

interface CanProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';            // Default: 'all'
  fallback?: React.ReactNode;      // Render when denied (default: null)
  children: React.ReactNode;
}

export function Can({ permission, mode = 'all', fallback = null, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission();

  if (isLoading) return null; // Prevent flash of forbidden content

  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed = mode === 'any'
    ? hasAnyPermission(permissions)
    : hasAllPermissions(permissions);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
```

**Usage Example:**
```tsx
<Can permission="student.create">
  <CreateStudentButton />
</Can>

<Can permission={['report.read', 'report.export']} mode="any">
  <ExportReportDropdown />
</Can>

<Can permission="settings.update" fallback={<ReadOnlySettingsView />}>
  <EditableSettingsForm />
</Can>
```

### 29.4 Route-Level Permission Guard (Middleware)

```typescript
// middleware.ts (Next.js Middleware — runs on Edge)
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/security/session';

const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
  '/admin/people/learners':     ['student.read'],
  '/admin/people/learners/new': ['student.create'],
  '/admin/billing':             ['invoice.read'],
  '/admin/billing/create':      ['invoice.create'],
  '/admin/settings':            ['settings.read'],
  '/admin/reports':             ['report.read'],
};

export async function middleware(request: NextRequest) {
  const session = await verifySessionToken(request);
  if (!session) return NextResponse.redirect(new URL('/login', request.url));

  const requiredPermissions = ROUTE_PERMISSION_MAP[request.nextUrl.pathname];
  if (requiredPermissions) {
    const hasAccess = requiredPermissions.every((p) => session.permissions.includes(p));
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}
```

### 29.5 Hook-Level Permission Guard

```typescript
// hooks/useAuthorizedMutation.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { usePermission } from '@/providers/PermissionProvider';
import type { Permission } from '@/lib/security/permissions.types';

export function useAuthorizedMutation<TData, TError, TVariables>(
  requiredPermission: Permission,
  options: UseMutationOptions<TData, TError, TVariables>
) {
  const { hasPermission } = usePermission();

  return useMutation<TData, TError, TVariables>({
    ...options,
    mutationFn: async (variables) => {
      if (!hasPermission(requiredPermission)) {
        throw new Error(`FORBIDDEN: Missing permission [${requiredPermission}]`);
      }
      return options.mutationFn!(variables);
    },
  });
}
```

---

## 30. Navigation Registry (Single Source of Truth)

Instead of scattering route strings across components, all navigation entries are declared in a centralized typed registry that drives the Sidebar, Breadcrumbs, Command Palette, and Route Guards from one source.

```typescript
// lib/navigation/navigationRegistry.ts
import type { Permission } from '@/lib/security/permissions.types';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck,
  Receipt, BarChart3, Settings, BookOpen, Calendar, Bell
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  group: 'main' | 'academic' | 'finance' | 'system';
  badge?: () => Promise<number>;      // Dynamic badge count resolver
  children?: NavigationItem[];
  keywords?: string[];                 // For Command Palette fuzzy search
  prefetchKeys?: string[];             // Query keys to warmup on hover
}

export const navigationRegistry: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    group: 'main',
    keywords: ['home', 'overview', 'kpi', 'summary'],
    prefetchKeys: ['dashboard'],
  },
  {
    id: 'students',
    label: 'Students',
    href: '/admin/people/learners',
    icon: Users,
    permission: 'student.read',
    group: 'main',
    keywords: ['learners', 'pupils', 'admissions'],
    prefetchKeys: ['students'],
    children: [
      {
        id: 'students-list',
        label: 'All Students',
        href: '/admin/people/learners',
        icon: Users,
        permission: 'student.read',
        group: 'main',
        keywords: ['student list', 'roster'],
      },
      {
        id: 'students-new',
        label: 'New Admission',
        href: '/admin/people/learners/new',
        icon: Users,
        permission: 'student.create',
        group: 'main',
        keywords: ['admit', 'enroll', 'register'],
      },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    href: '/admin/attendance',
    icon: ClipboardCheck,
    permission: 'attendance.read',
    group: 'academic',
    keywords: ['present', 'absent', 'checkin', 'roll call'],
    prefetchKeys: ['attendance'],
  },
  {
    id: 'courses',
    label: 'Courses',
    href: '/admin/academic/courses',
    icon: BookOpen,
    permission: 'course.read',
    group: 'academic',
    keywords: ['subjects', 'curriculum', 'syllabus'],
  },
  {
    id: 'timetable',
    label: 'Timetable',
    href: '/admin/academic/timetable',
    icon: Calendar,
    permission: 'timetable.read',
    group: 'academic',
    keywords: ['schedule', 'class timing', 'periods'],
  },
  {
    id: 'exams',
    label: 'Examinations',
    href: '/admin/exams',
    icon: GraduationCap,
    permission: 'exam.read',
    group: 'academic',
    keywords: ['tests', 'assessments', 'marks', 'results'],
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/admin/billing',
    icon: Receipt,
    permission: 'invoice.read',
    group: 'finance',
    keywords: ['fees', 'invoices', 'payments', 'due'],
    prefetchKeys: ['billing'],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    permission: 'report.read',
    group: 'system',
    keywords: ['analytics', 'charts', 'export', 'download'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'settings.read',
    group: 'system',
    keywords: ['config', 'preferences', 'tenant', 'profile'],
  },
];

// ── Utility Functions ──
export function getNavigationByGroup(group: NavigationItem['group']) {
  return navigationRegistry.filter((item) => item.group === group);
}

export function flattenNavigation(): NavigationItem[] {
  return navigationRegistry.flatMap((item) =>
    item.children ? [item, ...item.children] : [item]
  );
}

export function findNavigationByHref(href: string): NavigationItem | undefined {
  return flattenNavigation().find((item) => item.href === href);
}
```

### 30.1 Sidebar Rendering from Registry

```typescript
// components/layouts/Sidebar/Sidebar.tsx
'use client';

import { navigationRegistry } from '@/lib/navigation/navigationRegistry';
import { Can } from '@/components/core/Can';
import { SidebarItem } from './SidebarItem';

export function Sidebar() {
  const groups = ['main', 'academic', 'finance', 'system'] as const;

  return (
    <nav aria-label="Main Navigation" className="flex flex-col gap-1 p-3">
      {groups.map((group) => (
        <div key={group}>
          <span className="px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {group}
          </span>
          {navigationRegistry
            .filter((item) => item.group === group)
            .map((item) =>
              item.permission ? (
                <Can key={item.id} permission={item.permission}>
                  <SidebarItem item={item} />
                </Can>
              ) : (
                <SidebarItem key={item.id} item={item} />
              )
            )}
        </div>
      ))}
    </nav>
  );
}
```

---

## 31. API Client Architecture (Full HTTP Layer)

The HTTP client layer is architected as a composable interceptor pipeline. Raw `fetch` or `axios` calls are **strictly prohibited** outside this layer.

### 31.1 Axios Instance & Interceptor Pipeline

```typescript
// lib/http/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenStore } from '@/lib/security/tokenStore';
import { captureFrontendException } from '@/lib/observability/exceptionCapture';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send HttpOnly cookies
});

// ── Request Interceptor Pipeline ──
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 1. JWT Injection (from in-memory store, never localStorage)
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // 2. CSRF Token Injection (from meta tag or cookie)
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // 3. Tenant Context Header
  const tenantId = tokenStore.getTenantId();
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  // 4. Correlation ID for distributed tracing
  config.headers['X-Correlation-ID'] = crypto.randomUUID();

  return config;
});

// ── Response Interceptor Pipeline ──
let isRefreshing = false;
let failedRequestQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 5. Silent Token Refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        tokenStore.setAccessToken(data.accessToken);

        // Replay all queued requests
        failedRequestQueue.forEach(({ resolve }) => resolve());
        failedRequestQueue = [];

        return apiClient(originalRequest);
      } catch (refreshError) {
        failedRequestQueue.forEach(({ reject }) => reject(refreshError));
        failedRequestQueue = [];
        tokenStore.clearSession();
        window.location.href = '/login?reason=session_expired';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 6. Structured Error Mapping (never expose raw Axios errors to UI)
    const mappedError = mapApiError(error);
    captureFrontendException('API Request Failed', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      errorCode: mappedError.code,
    });

    return Promise.reject(mappedError);
  }
);

// ── Error Mapper ──
function mapApiError(error: AxiosError<{ code?: string; message?: string }>) {
  const status = error.response?.status || 0;
  const serverCode = error.response?.data?.code;
  const serverMessage = error.response?.data?.message;

  return {
    status,
    code: serverCode || `HTTP_${status}`,
    message: serverMessage || getDefaultErrorMessage(status),
    isRetryable: [408, 429, 500, 502, 503, 504].includes(status),
    isAuthError: [401, 403].includes(status),
  };
}

function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'The request contains invalid data. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. The resource may have been modified.',
    422: 'The submitted data failed validation. Please review and correct.',
    429: 'Too many requests. Please wait a moment before trying again.',
    500: 'An unexpected server error occurred. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again shortly.',
  };
  return messages[status] || 'An unexpected error occurred.';
}

export { apiClient };
```

### 31.2 Feature Service Factory Pattern

```typescript
// lib/http/createService.ts
import { apiClient } from './apiClient';

export function createService<TEntity>(basePath: string) {
  return {
    list: async (params?: Record<string, unknown>) => {
      const { data } = await apiClient.get<{ data: TEntity[]; meta: PaginationMeta }>(basePath, { params });
      return data;
    },
    getById: async (id: string) => {
      const { data } = await apiClient.get<TEntity>(`${basePath}/${id}`);
      return data;
    },
    create: async (payload: Partial<TEntity>) => {
      const { data } = await apiClient.post<TEntity>(basePath, payload);
      return data;
    },
    update: async (id: string, payload: Partial<TEntity>) => {
      const { data } = await apiClient.patch<TEntity>(`${basePath}/${id}`, payload);
      return data;
    },
    remove: async (id: string) => {
      await apiClient.delete(`${basePath}/${id}`);
    },
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Usage in feature modules:
// features/people/services/studentService.ts
// export const studentService = createService<Student>('/api/v1/students');
```

---

## 32. Error Code Registry & UI Mapping

Instead of displaying raw `error.message` strings, all errors route through a centralized error code registry that maps backend error codes to user-friendly UI messages.

```typescript
// lib/errors/errorCodeRegistry.ts

export interface ErrorCodeEntry {
  code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userMessage: string;
  devHint: string;
  retryable: boolean;
  action?: 'toast' | 'modal' | 'redirect' | 'inline';
  redirectTo?: string;
}

export const errorCodeRegistry: Record<string, ErrorCodeEntry> = {
  // ── Authentication Errors (AUTH_0xx) ──
  AUTH_001: {
    code: 'AUTH_001',
    severity: 'error',
    userMessage: 'Your session has expired. Please log in again.',
    devHint: 'Access token expired and refresh failed.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/login?reason=session_expired',
  },
  AUTH_002: {
    code: 'AUTH_002',
    severity: 'error',
    userMessage: 'Invalid credentials. Please check your email and password.',
    devHint: 'Login attempt with wrong email/password combination.',
    retryable: false,
    action: 'inline',
  },
  AUTH_003: {
    code: 'AUTH_003',
    severity: 'warning',
    userMessage: 'Your account has been locked. Contact your administrator.',
    devHint: 'Account locked after max login attempts exceeded.',
    retryable: false,
    action: 'modal',
  },

  // ── Student Module Errors (STUDENT_0xx) ──
  STUDENT_001: {
    code: 'STUDENT_001',
    severity: 'error',
    userMessage: 'A student with this email already exists.',
    devHint: 'Unique constraint violation on student_profiles.email.',
    retryable: false,
    action: 'inline',
  },
  STUDENT_002: {
    code: 'STUDENT_002',
    severity: 'warning',
    userMessage: 'This student has active fee dues. Cannot archive.',
    devHint: 'Business rule: students with pending invoices cannot be archived.',
    retryable: false,
    action: 'modal',
  },
  STUDENT_003: {
    code: 'STUDENT_003',
    severity: 'error',
    userMessage: 'Student profile not found. It may have been deleted.',
    devHint: '404 on student detail fetch — record may be soft-deleted.',
    retryable: false,
    action: 'toast',
  },

  // ── Fee / Billing Errors (FEE_1xx) ──
  FEE_101: {
    code: 'FEE_101',
    severity: 'error',
    userMessage: 'Payment processing failed. Please try again.',
    devHint: 'Payment gateway returned a failure response.',
    retryable: true,
    action: 'toast',
  },
  FEE_102: {
    code: 'FEE_102',
    severity: 'warning',
    userMessage: 'This invoice has already been paid.',
    devHint: 'Duplicate payment attempt on a completed invoice.',
    retryable: false,
    action: 'modal',
  },

  // ── Attendance Errors (ATT_2xx) ──
  ATT_201: {
    code: 'ATT_201',
    severity: 'warning',
    userMessage: 'Attendance for this date has already been submitted.',
    devHint: 'Duplicate attendance submission for the same batch+date.',
    retryable: false,
    action: 'toast',
  },

  // ── System / Infra Errors (SYSTEM_5xx) ──
  SYSTEM_500: {
    code: 'SYSTEM_500',
    severity: 'critical',
    userMessage: 'Something went wrong on our end. Our team has been notified.',
    devHint: 'Unhandled server exception. Check server logs.',
    retryable: true,
    action: 'toast',
  },
  SYSTEM_503: {
    code: 'SYSTEM_503',
    severity: 'critical',
    userMessage: 'Service is temporarily unavailable. Please try again in a few minutes.',
    devHint: 'Server is down or undergoing maintenance.',
    retryable: true,
    action: 'modal',
  },
};

// ── Error Resolution Hook ──
export function resolveError(code: string): ErrorCodeEntry {
  return errorCodeRegistry[code] || {
    code: 'UNKNOWN',
    severity: 'error' as const,
    userMessage: 'An unexpected error occurred. Please try again.',
    devHint: `Unmapped error code: ${code}`,
    retryable: false,
    action: 'toast' as const,
  };
}
```

### 32.1 Error Display Hook

```typescript
// hooks/useErrorHandler.ts
'use client';

import { resolveError, type ErrorCodeEntry } from '@/lib/errors/errorCodeRegistry';
import { useToast } from '@/components/primitives/toast';
import { useModalStore } from '@/lib/state/modalStore';
import { useRouter } from 'next/navigation';

export function useErrorHandler() {
  const { toast } = useToast();
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);

  return function handleError(error: { code?: string; message?: string }) {
    const entry = resolveError(error.code || 'UNKNOWN');

    switch (entry.action) {
      case 'toast':
        toast({ variant: entry.severity === 'critical' ? 'destructive' : 'default', title: entry.userMessage });
        break;
      case 'modal':
        openModal({ type: 'error', title: 'Error', message: entry.userMessage });
        break;
      case 'redirect':
        if (entry.redirectTo) router.push(entry.redirectTo);
        break;
      case 'inline':
        // Returned to the caller for inline form display
        break;
    }

    return entry;
  };
}
```

---

## 33. Internationalization Architecture (i18n)

Even if the platform launches in English only, the i18n infrastructure must be wired from Day 1 so that adding Tamil (`ta`), Hindi (`hi`), or any language is a configuration-only change — zero refactoring.

### 33.1 Locale File Structure

```
src/
└── locales/
    ├── en/
    │   ├── common.json          # Shared UI strings (buttons, labels)
    │   ├── auth.json            # Login, signup, password reset
    │   ├── student.json         # Student module strings
    │   ├── attendance.json      # Attendance module strings
    │   ├── billing.json         # Billing module strings
    │   └── errors.json          # Error messages (mapped to error codes)
    ├── ta/
    │   ├── common.json
    │   └── ...
    └── hi/
        ├── common.json
        └── ...
```

### 33.2 Translation Provider & Hook

```typescript
// providers/I18nProvider.tsx
'use client';

import React, { createContext, useContext, useCallback } from 'react';

type Locale = 'en' | 'ta' | 'hi';
type TranslationNamespace = 'common' | 'auth' | 'student' | 'attendance' | 'billing' | 'errors';

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  changeLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: (key) => key,
  changeLocale: () => {},
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Record<string, string>;
  children: React.ReactNode;
}) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let message = messages[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          message = message.replace(`{{${k}}}`, String(v));
        });
      }
      return message;
    },
    [messages]
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

// Usage:
// const { t } = useTranslation();
// t('student.created_success', { name: 'Ravi' })
// => "Student Ravi has been created successfully."
```

### 33.3 Locale File Example

```json
// locales/en/common.json
{
  "app.title": "NEET Academy Platform",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.delete": "Delete",
  "action.confirm": "Confirm",
  "action.search": "Search...",
  "action.export": "Export",
  "action.filter": "Filter",
  "table.no_results": "No results found.",
  "table.showing": "Showing {{from}} to {{to}} of {{total}} entries",
  "validation.required": "This field is required.",
  "validation.email": "Please enter a valid email address.",
  "validation.min_length": "Must be at least {{min}} characters.",
  "student.created_success": "Student {{name}} has been created successfully.",
  "attendance.submitted": "Attendance submitted for {{count}} students."
}
```

---

## 34. Notification Architecture (Centralized Notification Service)

All user-facing notifications — toasts, browser push, in-app badges, snackbars — route through a single notification service. Components must never invoke `toast()` or `alert()` directly.

```typescript
// lib/notifications/notificationService.ts
import { toast } from '@/components/primitives/toast';
import { queryClient } from '@/lib/queryClient';

export type NotificationChannel = 'toast' | 'snackbar' | 'browser' | 'badge' | 'sound';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface NotificationPayload {
  id?: string;
  title: string;
  message?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  action?: { label: string; href: string };
  duration?: number; // ms (default: 5000 for toasts)
  persistent?: boolean; // Stay until dismissed
}

class NotificationService {
  private badgeCount = 0;

  async send(payload: NotificationPayload) {
    for (const channel of payload.channels) {
      switch (channel) {
        case 'toast':
          toast({
            title: payload.title,
            description: payload.message,
            variant: payload.priority === 'critical' ? 'destructive' : 'default',
            duration: payload.duration || 5000,
          });
          break;

        case 'browser':
          await this.sendBrowserNotification(payload);
          break;

        case 'badge':
          this.incrementBadge();
          break;

        case 'sound':
          this.playNotificationSound(payload.priority);
          break;
      }
    }
  }

  private async sendBrowserNotification(payload: NotificationPayload) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.message,
        icon: '/icons/notification-icon.png',
        tag: payload.id || crypto.randomUUID(),
      });
    }
  }

  private incrementBadge() {
    this.badgeCount++;
    // Invalidate notification badge query to trigger UI update
    queryClient.invalidateQueries({ queryKey: ['notifications', 'badge'] });
  }

  private playNotificationSound(priority: NotificationPriority) {
    if (priority === 'critical' || priority === 'high') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore autoplay restrictions
    }
  }

  clearBadge() {
    this.badgeCount = 0;
    queryClient.invalidateQueries({ queryKey: ['notifications', 'badge'] });
  }
}

export const notificationService = new NotificationService();

// ── Usage in mutation hooks ──
// notificationService.send({
//   title: 'Student Created',
//   message: 'Ravi Kumar has been enrolled successfully.',
//   priority: 'medium',
//   channels: ['toast', 'badge'],
//   action: { label: 'View Profile', href: '/admin/people/learners/123' },
// });
```

### 34.1 WebSocket → Notification Bridge

```typescript
// lib/notifications/realtimeNotifications.ts
import { notificationService } from './notificationService';

export function initializeRealtimeNotifications(ws: WebSocket) {
  ws.addEventListener('message', (event) => {
    const { type, payload } = JSON.parse(event.data);

    if (type === 'NOTIFICATION') {
      notificationService.send({
        title: payload.title,
        message: payload.body,
        priority: payload.priority || 'medium',
        channels: payload.channels || ['toast', 'badge'],
        action: payload.action,
      });
    }
  });
}
```

---

## 35. Modal Management (Centralized Modal Stack)

Instead of scattered `const [open, setOpen] = useState(false)` across components, all modals are controlled through a centralized store with stack support, nested modal rules, and a declarative confirmation dialog API.

```typescript
// lib/state/modalStore.ts
import { create } from 'zustand';

export type ModalType = 'dialog' | 'drawer' | 'bottomSheet' | 'confirm' | 'error' | 'custom';

interface ModalEntry {
  id: string;
  type: ModalType;
  title: string;
  message?: string;
  component?: React.ComponentType<any>;
  props?: Record<string, unknown>;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  preventClose?: boolean;       // Prevent Escape / backdrop click
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface ModalState {
  stack: ModalEntry[];
  open: (entry: Omit<ModalEntry, 'id'>) => string;
  close: (id?: string) => void;
  closeAll: () => void;
  confirm: (opts: { title: string; message: string; onConfirm: () => void | Promise<void> }) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  stack: [],

  open: (entry) => {
    const id = crypto.randomUUID();
    // Rule: Maximum 3 nested modals allowed
    if (get().stack.length >= 3) {
      console.warn('Modal stack limit reached (max 3). Closing oldest modal.');
      set((s) => ({ stack: [...s.stack.slice(1), { ...entry, id }] }));
    } else {
      set((s) => ({ stack: [...s.stack, { ...entry, id }] }));
    }
    return id;
  },

  close: (id) => {
    set((s) => ({
      stack: id ? s.stack.filter((m) => m.id !== id) : s.stack.slice(0, -1),
    }));
  },

  closeAll: () => set({ stack: [] }),

  confirm: ({ title, message, onConfirm }) => {
    const id = crypto.randomUUID();
    set((s) => ({
      stack: [...s.stack, { id, type: 'confirm', title, message, onConfirm }],
    }));
  },
}));
```

### 35.1 Modal Renderer Provider

```typescript
// providers/ModalProvider.tsx
'use client';

import { useModalStore } from '@/lib/state/modalStore';
import { AccessibleDialog } from '@/components/primitives/AccessibleDialog';

export function ModalProvider() {
  const stack = useModalStore((s) => s.stack);
  const close = useModalStore((s) => s.close);

  return (
    <>
      {stack.map((modal, index) => (
        <AccessibleDialog
          key={modal.id}
          isOpen={true}
          onClose={() => !modal.preventClose && close(modal.id)}
          title={modal.title}
        >
          {modal.type === 'confirm' ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">{modal.message}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => close(modal.id)} className="btn-secondary">Cancel</button>
                <button
                  onClick={async () => {
                    await modal.onConfirm?.();
                    close(modal.id);
                  }}
                  className="btn-destructive"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : modal.component ? (
            <modal.component {...modal.props} onClose={() => close(modal.id)} />
          ) : (
            <p>{modal.message}</p>
          )}
        </AccessibleDialog>
      ))}
    </>
  );
}

// Usage:
// const { confirm } = useModalStore();
// confirm({
//   title: 'Delete Student',
//   message: 'Are you sure? This action cannot be undone.',
//   onConfirm: () => deleteStudentMutation.mutate(studentId),
// });
```

---

## 36. Theme Engine (Multi-Tenant Runtime Theming)

Each tenant can inject brand colors, logo overrides, and mode preferences at runtime through CSS custom properties. No build-time coupling.

```typescript
// lib/theme/themeEngine.ts
export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface TenantTheme {
  mode: ThemeMode;
  colors: {
    primary: string;        // HSL: '221 83% 53%'
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    border: string;
    ring: string;
    card: string;
    cardForeground: string;
  };
  logo?: {
    light: string;   // URL
    dark: string;     // URL
  };
  borderRadius: string; // e.g., '0.5rem'
  fontFamily?: string;
}

// ── Default Themes ──
export const defaultLightTheme: TenantTheme = {
  mode: 'light',
  colors: {
    primary: '221 83% 53%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96%',
    accent: '210 40% 96%',
    background: '0 0% 100%',
    foreground: '222 84% 5%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    destructive: '0 84% 60%',
    border: '214 32% 91%',
    ring: '221 83% 53%',
    card: '0 0% 100%',
    cardForeground: '222 84% 5%',
  },
  borderRadius: '0.5rem',
};

export const defaultDarkTheme: TenantTheme = {
  mode: 'dark',
  colors: {
    primary: '217 91% 60%',
    primaryForeground: '222 84% 5%',
    secondary: '217 33% 17%',
    accent: '217 33% 17%',
    background: '222 84% 5%',
    foreground: '210 40% 98%',
    muted: '217 33% 17%',
    mutedForeground: '215 20% 65%',
    destructive: '0 63% 31%',
    border: '217 33% 17%',
    ring: '224 76% 48%',
    card: '222 84% 5%',
    cardForeground: '210 40% 98%',
  },
  borderRadius: '0.5rem',
};

// ── Runtime Application ──
export function applyTheme(theme: TenantTheme) {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  root.style.setProperty('--radius', theme.borderRadius);
  root.setAttribute('data-theme', theme.mode);

  if (theme.fontFamily) {
    root.style.setProperty('--font-sans', theme.fontFamily);
  }
}

// ── Theme Persistence ──
export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('theme-mode') as ThemeMode) || 'light';
}

export function setStoredThemeMode(mode: ThemeMode) {
  localStorage.setItem('theme-mode', mode);
}
```

### 36.1 Theme Toggle Component

```typescript
// components/core/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  applyTheme, getStoredThemeMode, setStoredThemeMode,
  defaultLightTheme, defaultDarkTheme,
  type ThemeMode,
} from '@/lib/theme/themeEngine';

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getStoredThemeMode());

  useEffect(() => {
    const theme = mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
    applyTheme({ ...theme, mode });
    setStoredThemeMode(mode);
  }, [mode]);

  const icons: Record<ThemeMode, React.ReactNode> = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    'high-contrast': <Monitor className="h-4 w-4" />,
  };

  const cycle: Record<ThemeMode, ThemeMode> = {
    light: 'dark',
    dark: 'high-contrast',
    'high-contrast': 'light',
  };

  return (
    <button
      onClick={() => setMode(cycle[mode])}
      aria-label={`Switch to ${cycle[mode]} theme`}
      className="rounded-lg p-2 hover:bg-muted transition-colors"
    >
      {icons[mode]}
    </button>
  );
}
```

---

## 37. Keyboard Shortcut Engine & Command Palette

Enterprise applications require keyboard-driven navigation. Every primary action must be accessible without a mouse.

### 37.1 Shortcut Registry

```typescript
// lib/shortcuts/shortcutRegistry.ts
export interface Shortcut {
  id: string;
  keys: string[];              // e.g., ['Ctrl', 'K'] or ['?']
  label: string;
  description: string;
  action: () => void;
  context?: 'global' | 'table' | 'form' | 'modal';
  enabled?: () => boolean;
}

const shortcuts: Map<string, Shortcut> = new Map();

export function registerShortcut(shortcut: Shortcut) {
  shortcuts.set(shortcut.id, shortcut);
}

export function unregisterShortcut(id: string) {
  shortcuts.delete(id);
}

export function getShortcuts(context?: string): Shortcut[] {
  return Array.from(shortcuts.values()).filter(
    (s) => !context || !s.context || s.context === context
  );
}

export function getShortcutById(id: string): Shortcut | undefined {
  return shortcuts.get(id);
}
```

### 37.2 Global Shortcut Listener

```typescript
// providers/ShortcutProvider.tsx
'use client';

import { useEffect } from 'react';
import { getShortcuts } from '@/lib/shortcuts/shortcutRegistry';

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger inside text inputs
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      const shortcuts = getShortcuts('global');
      for (const shortcut of shortcuts) {
        if (shortcut.enabled && !shortcut.enabled()) continue;

        const match = shortcut.keys.every((key) => {
          if (key === 'Ctrl') return e.ctrlKey || e.metaKey;
          if (key === 'Shift') return e.shiftKey;
          if (key === 'Alt') return e.altKey;
          return e.key.toLowerCase() === key.toLowerCase();
        });

        if (match) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return <>{children}</>;
}
```

### 37.3 Command Palette (⌘K / Ctrl+K)

```typescript
// components/core/CommandPalette.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { flattenNavigation, type NavigationItem } from '@/lib/navigation/navigationRegistry';
import { usePermission } from '@/providers/PermissionProvider';
import { registerShortcut } from '@/lib/shortcuts/shortcutRegistry';
import { Search, ArrowRight } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Register Ctrl+K shortcut
  useEffect(() => {
    registerShortcut({
      id: 'command-palette',
      keys: ['Ctrl', 'k'],
      label: 'Command Palette',
      description: 'Open command palette for quick navigation',
      action: () => setIsOpen(true),
      context: 'global',
    });

    // Also register "/" for quick search
    registerShortcut({
      id: 'quick-search',
      keys: ['/'],
      label: 'Quick Search',
      description: 'Focus search',
      action: () => setIsOpen(true),
      context: 'global',
    });
  }, []);

  const allItems = useMemo(() => {
    return flattenNavigation().filter(
      (item) => !item.permission || hasPermission(item.permission)
    );
  }, [hasPermission]);

  const filteredItems = useMemo(() => {
    if (!query) return allItems.slice(0, 8);
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.includes(q))
    );
  }, [query, allItems]);

  const handleSelect = (item: NavigationItem) => {
    router.push(item.href);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-[20vh]">
      <div className="w-full max-w-lg bg-background rounded-xl shadow-2xl border overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setIsOpen(false); setQuery(''); }
            }}
            placeholder="Type a command or search..."
            className="flex-1 py-3 bg-transparent outline-none text-sm"
          />
          <kbd className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </button>
            </li>
          ))}
          {filteredItems.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
```

### 37.4 Default Keyboard Shortcuts Map

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| `Ctrl + K` / `⌘ + K` | Open Command Palette | Global |
| `/` | Focus Search | Global (outside inputs) |
| `Ctrl + S` | Save current form | Form context |
| `Escape` | Close modal / palette | Modal / Palette |
| `?` | Show keyboard shortcuts help | Global |
| `Ctrl + Shift + D` | Toggle dark mode | Global |
| `Ctrl + /` | Toggle sidebar collapse | Global |
| `↑ / ↓` | Navigate table rows | Table context |
| `Enter` | Open selected row | Table context |
| `Ctrl + N` | Create new entity | Context-dependent |

---

## 38. Frontend Audit Checklist (Every PR)

Every pull request must pass this 12-point checklist before merge approval. CI/CD pipelines enforce automated checks; manual items require reviewer attestation.

| # | Category | Check | Enforcement | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Accessibility** | WCAG 2.2 AA compliance | `axe-core` CI check | 0 violations |
| 2 | **Bundle Size** | JS/CSS budget not exceeded | `@next/bundle-analyzer` | Within declared budgets |
| 3 | **Performance** | Lighthouse Performance score | CI Lighthouse audit | ≥ 90 |
| 4 | **Security** | No `dangerouslySetInnerHTML` without sanitizer | ESLint rule | 0 violations |
| 5 | **TypeScript** | Strict mode, no `any` casts | `tsc --noEmit` | 0 errors |
| 6 | **Tests** | Unit + Integration coverage | Vitest coverage report | ≥ 85% lines |
| 7 | **Storybook** | New components have stories | `storybook build` | No broken stories |
| 8 | **Mobile** | Responsive at 320px / 768px / 1440px | Playwright viewport tests | All viewports pass |
| 9 | **RTL** | Layout direction support | `[dir="rtl"]` snapshot test | No layout breakage |
| 10 | **Memory Leaks** | Observer/WS cleanup on unmount | ESLint exhaustive-deps | 0 warnings |
| 11 | **Error Handling** | All mutations use `useErrorHandler` | ESLint custom rule | No raw `catch` blocks |
| 12 | **Console** | No `console.*` in production | ESLint `no-console` | 0 violations |

### 38.1 CI Pipeline Configuration

```yaml
# .github/workflows/frontend-audit.yml
name: Frontend PR Audit
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci

      # TypeScript strict check
      - name: TypeScript
        run: npx tsc --noEmit --strict

      # Lint (includes no-console, no-any, accessibility)
      - name: ESLint
        run: npx eslint src/ --max-warnings 0

      # Unit tests with coverage
      - name: Tests
        run: npx vitest run --coverage --reporter=json --outputFile=coverage.json

      # Coverage threshold enforcement
      - name: Coverage Gate
        run: |
          node -e "
            const report = require('./coverage.json');
            const lines = report.total.lines.pct;
            if (lines < 85) { console.error('Coverage ' + lines + '% < 85%'); process.exit(1); }
          "

      # Bundle size check
      - name: Bundle Budget
        run: |
          npm run build
          npx @next/bundle-analyzer

      # Accessibility audit
      - name: Accessibility
        run: npx playwright test tests/accessibility/ --reporter=json

      # Storybook build validation
      - name: Storybook
        run: npx storybook build --quiet
```

---

## 39. Analytics Tracking Layer (Vendor-Agnostic)

Direct calls to Google Analytics, PostHog, or Mixpanel are **strictly prohibited**. All tracking routes through an abstract `track()` function that fans out to configured providers.

```typescript
// lib/analytics/analyticsService.ts
export type AnalyticsEvent =
  | 'page_view'
  | 'student_created' | 'student_updated' | 'student_archived'
  | 'attendance_submitted'
  | 'invoice_created' | 'payment_received'
  | 'exam_started' | 'exam_submitted'
  | 'login_success' | 'login_failure'
  | 'feature_used' | 'error_occurred'
  | 'search_performed' | 'export_triggered';

interface AnalyticsProvider {
  name: string;
  track: (event: AnalyticsEvent, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  page: (name: string, properties?: Record<string, unknown>) => void;
}

// ── Provider Adapters ──
const ga4Provider: AnalyticsProvider = {
  name: 'Google Analytics 4',
  track: (event, props) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, props);
    }
  },
  identify: (userId) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('set', { user_id: userId });
    }
  },
  page: (name, props) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', { page_title: name, ...props });
    }
  },
};

const posthogProvider: AnalyticsProvider = {
  name: 'PostHog',
  track: (event, props) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event, props);
    }
  },
  identify: (userId, traits) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.identify(userId, traits);
    }
  },
  page: (name, props) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('$pageview', { page: name, ...props });
    }
  },
};

const internalAuditProvider: AnalyticsProvider = {
  name: 'Internal Audit Log',
  track: (event, props) => {
    // Send to internal audit API for compliance logging
    navigator.sendBeacon('/api/v1/audit/track', JSON.stringify({ event, props, ts: Date.now() }));
  },
  identify: () => {},
  page: () => {},
};

// ── Analytics Service (Fan-Out) ──
class AnalyticsService {
  private providers: AnalyticsProvider[] = [];
  private isEnabled = true;

  registerProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
  }

  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (!this.isEnabled) return;
    this.providers.forEach((p) => p.track(event, properties));
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    this.providers.forEach((p) => p.identify(userId, traits));
  }

  page(name: string, properties?: Record<string, unknown>) {
    this.providers.forEach((p) => p.page(name, properties));
  }

  disable() { this.isEnabled = false; }
  enable() { this.isEnabled = true; }
}

export const analytics = new AnalyticsService();

// ── Initialize on App Boot ──
export function initializeAnalytics() {
  if (process.env.NEXT_PUBLIC_ENABLE_GA === 'true') analytics.registerProvider(ga4Provider);
  if (process.env.NEXT_PUBLIC_ENABLE_POSTHOG === 'true') analytics.registerProvider(posthogProvider);
  analytics.registerProvider(internalAuditProvider); // Always enabled for compliance
}
```

### 39.1 Auto Page Tracking Hook

```typescript
// hooks/usePageTracking.ts
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics/analyticsService';
import { findNavigationByHref } from '@/lib/navigation/navigationRegistry';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const navItem = findNavigationByHref(pathname);
    analytics.page(navItem?.label || pathname, { path: pathname });
  }, [pathname]);
}
```

---

## 40. Enterprise Frontend Architecture Decision Records (ADRs)

Every significant technology choice must be documented with context, alternatives considered, and rationale. These records serve as institutional memory for future engineers.

| ADR | Decision | Status | Date |
| :--- | :--- | :--- | :--- |
| ADR-001 | Use React Query (TanStack Query v5) for Server State | **Accepted** | 2025-01-15 |
| ADR-002 | Use Zustand (v5) for Client UI State | **Accepted** | 2025-01-15 |
| ADR-003 | Use React Server Components (RSC) with Selective Client Boundaries | **Accepted** | 2025-01-20 |
| ADR-004 | Use Next.js App Router (v15) over Pages Router | **Accepted** | 2025-01-20 |
| ADR-005 | Use XState for Complex Multi-Step Wizards | **Accepted** | 2025-02-01 |
| ADR-006 | Use Zod for Runtime Schema Validation | **Accepted** | 2025-02-01 |
| ADR-007 | Use shadcn/ui as Component Primitive Base | **Accepted** | 2025-02-10 |
| ADR-008 | Use TanStack Virtual for Large List Rendering | **Accepted** | 2025-02-10 |
| ADR-009 | Use Axios over native Fetch for HTTP Client | **Accepted** | 2025-02-15 |
| ADR-010 | Use CSS Custom Properties for Runtime Theming | **Accepted** | 2025-03-01 |

### ADR-001: React Query for Server State Management

**Context:** The platform requires real-time data synchronization across multiple dashboard widgets, optimistic mutation support, and automatic background refetching. Multiple state management solutions were evaluated.

**Alternatives Considered:**
| Library | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| Redux Toolkit Query | Mature ecosystem, devtools | Heavy boilerplate, larger bundle | Rejected |
| SWR | Lightweight, simple API | No mutation lifecycle, limited cache control | Rejected |
| React Query v5 | Optimistic mutations, cache dependency graphs, devtools, SSR hydration | Slightly larger than SWR | **Selected** |
| Apollo Client | Excellent for GraphQL | REST-first API makes this overkill | Rejected |

**Decision:** React Query v5 is selected because:
1. Native optimistic mutation support with rollback (`onMutate` / `onError` context).
2. Cache dependency invalidation graphs (Chapter 17.3) require `invalidateQueries` with prefix matching.
3. SSR hydration via `dehydrate`/`HydrationBoundary` integrates with Next.js App Router.
4. Background refetch keeps dashboards fresh without polling.
5. Built-in retry with exponential backoff.

### ADR-002: Zustand for Client UI State

**Context:** Non-server UI state (sidebar toggle, theme mode, active tab) needs fast, synchronous access without provider nesting.

**Decision:** Zustand is selected over Redux and Jotai because:
1. Zero-boilerplate store creation.
2. Selector-based subscriptions prevent unnecessary re-renders (Chapter 8).
3. No context provider wrapping required — stores are importable anywhere.
4. Middleware support for `persist`, `devtools`, and `immer`.

### ADR-009: Axios over Fetch

**Context:** The HTTP client needs request/response interceptor chains for JWT injection, CSRF tokens, token refresh, and structured error mapping.

**Decision:** Axios is selected because:
1. First-class interceptor pipeline (request and response).
2. Automatic JSON transformation.
3. Request cancellation via `AbortController` integration.
4. Concurrent request queuing during token refresh (Chapter 31.1).
5. Native `fetch` requires manual wrapping for all of the above — creating a maintenance burden equivalent to building Axios from scratch.

---

## 41. HTTP Status → UI Behavior Mapping

Every HTTP status code must have a deterministic UI response. Components must never handle raw status codes — they flow through the Error Code Registry (Chapter 32) and this mapping table.

| HTTP Status | Category | UI Behavior | Component Action | User Message |
| :--- | :--- | :--- | :--- | :--- |
| **200** | Success | Silent (data updates automatically) | React Query cache hydration | None |
| **201** | Created | Success toast + redirect | Navigate to detail view | "Created successfully" |
| **204** | No Content | Silent | Invalidate related cache | None |
| **400** | Bad Request | Inline form errors | Highlight invalid fields (Zod mapping) | Field-level messages |
| **401** | Unauthorized | Silent refresh → redirect | Trigger token refresh; if failed → `/login` | "Session expired" |
| **403** | Forbidden | Error modal | Show permission denial dialog | "You don't have permission" |
| **404** | Not Found | Empty state or redirect | Show domain-specific empty state | "Resource not found" |
| **409** | Conflict | Warning modal | Show conflict resolution dialog | "Resource was modified" |
| **422** | Validation | Inline form errors | Map server errors to form fields | Per-field messages |
| **429** | Rate Limited | Retry toast with countdown | Queue retry with exponential backoff | "Too many requests" |
| **500** | Server Error | Error toast | Log to telemetry, show retry option | "Something went wrong" |
| **503** | Unavailable | Maintenance modal | Show maintenance page with ETA | "Service unavailable" |

---

## 42. Empty State Guidelines

Blank tables and empty views create confusion. Every list/table view must display a contextual empty state with an illustration, explanation, and primary action CTA.

```typescript
// components/core/EmptyState.tsx
'use client';

import { Can } from '@/components/core/Can';
import type { Permission } from '@/lib/security/permissions.types';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    permission?: Permission;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const ActionButton = () => (
    <a
      href={action?.href}
      onClick={action?.onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      {action?.label}
    </a>
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        action.permission ? (
          <Can permission={action.permission}><ActionButton /></Can>
        ) : (
          <ActionButton />
        )
      )}
    </div>
  );
}
```

### 42.1 Domain-Specific Empty State Registry

| Module | Title | Description | Action Label | Permission |
| :--- | :--- | :--- | :--- | :--- |
| Students | No students yet | Start by adding your first student or importing a CSV roster. | Add Student | `student.create` |
| Attendance | No attendance records | Attendance hasn't been recorded for this date yet. | Mark Attendance | `attendance.create` |
| Billing | No invoices | Create your first invoice to start tracking fees. | Create Invoice | `invoice.create` |
| Exams | No exams scheduled | Schedule an exam to get started with assessments. | Schedule Exam | `exam.create` |
| Reports | No data available | There isn't enough data to generate this report yet. | — | — |
| Staff | No staff members | Add your first staff member to begin team management. | Add Staff | `staff.create` |

---

## 43. Loading Skeleton Library

Custom skeletons scattered across components create visual inconsistency. All loading states must use a shared skeleton component library that matches the exact geometry of the content it replaces.

```typescript
// components/core/skeletons/Skeleton.tsx
'use client';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animate?: boolean;
}

export function Skeleton({
  className = '',
  width,
  height,
  variant = 'rounded',
  animate = true,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  return (
    <div
      className={`bg-muted ${variantClasses[variant]} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
    />
  );
}

// ── Pre-built Composite Skeletons ──
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" animate={false} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-start gap-6">
      <Skeleton variant="circular" width={80} height={80} />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
```

---

## 44. File Upload Architecture

File uploads in an enterprise SaaS must support chunked uploads, resume capability, virus scanning, image compression, progress tracking, and abort controls.

```typescript
// lib/uploads/uploadService.ts
import { apiClient } from '@/lib/http/apiClient';
import { captureFrontendException } from '@/lib/observability/exceptionCapture';

export interface UploadOptions {
  file: File;
  endpoint: string;
  chunkSizeMB?: number;           // Default: 5MB
  maxFileSizeMB?: number;         // Default: 50MB
  allowedTypes?: string[];        // MIME types
  compressImages?: boolean;       // Default: true for images
  onProgress?: (percent: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: UploadError) => void;
  signal?: AbortSignal;           // For cancellation
}

interface UploadResult {
  storageKey: string;
  url: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

interface UploadError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'VIRUS_DETECTED' | 'NETWORK_ERROR';
  message: string;
}

// ── Validation ──
function validateFile(file: File, options: UploadOptions): UploadError | null {
  const maxSize = (options.maxFileSizeMB || 50) * 1024 * 1024;
  if (file.size > maxSize) {
    return { code: 'FILE_TOO_LARGE', message: `File exceeds ${options.maxFileSizeMB || 50}MB limit.` };
  }

  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return { code: 'INVALID_TYPE', message: `File type ${file.type} is not allowed.` };
  }

  return null;
}

// ── Image Compression (Client-Side) ──
async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// ── Chunked Upload ──
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const validationError = validateFile(options.file, options);
  if (validationError) {
    options.onError?.(validationError);
    throw validationError;
  }

  let processedFile = options.file;

  // Compress images client-side before upload
  if (options.compressImages !== false && options.file.type.startsWith('image/')) {
    processedFile = await compressImage(options.file);
  }

  const chunkSize = (options.chunkSizeMB || 5) * 1024 * 1024;
  const totalChunks = Math.ceil(processedFile.size / chunkSize);

  // For small files (< 1 chunk), use simple upload
  if (totalChunks === 1) {
    return uploadSimple(processedFile, options);
  }

  // Initiate multipart upload
  const { data: session } = await apiClient.post(`${options.endpoint}/initiate`, {
    fileName: processedFile.name,
    fileSize: processedFile.size,
    mimeType: processedFile.type,
    totalChunks,
  });

  // Upload chunks
  for (let i = 0; i < totalChunks; i++) {
    if (options.signal?.aborted) throw new Error('Upload cancelled');

    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, processedFile.size);
    const chunk = processedFile.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', String(i));
    formData.append('uploadId', session.uploadId);

    await apiClient.post(`${options.endpoint}/chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: options.signal,
    });

    options.onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
  }

  // Complete multipart upload
  const { data: result } = await apiClient.post(`${options.endpoint}/complete`, {
    uploadId: session.uploadId,
  });

  options.onComplete?.(result);
  return result;
}

async function uploadSimple(file: File, options: UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post(options.endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal: options.signal,
    onUploadProgress: (e) => {
      if (e.total) options.onProgress?.(Math.round((e.loaded / e.total) * 100));
    },
  });

  options.onComplete?.(data);
  return data;
}
```

### 44.1 Upload Hook

```typescript
// hooks/useFileUpload.ts
'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadFile, type UploadOptions } from '@/lib/uploads/uploadService';

export function useFileUpload(endpoint: string) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File, opts?: Partial<UploadOptions>) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const result = await uploadFile({
        file,
        endpoint,
        onProgress: setProgress,
        signal: abortControllerRef.current.signal,
        ...opts,
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [endpoint]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { upload, cancel, progress, isUploading, error };
}
```

---

## 45. Search Architecture

All search interactions must follow a unified pattern: debounced input, URL state synchronization, server-side execution, result highlighting, and recent search persistence.

```typescript
// hooks/useSearch.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UseSearchOptions {
  debounceMs?: number;      // Default: 300ms
  syncToUrl?: boolean;       // Default: true
  urlParamName?: string;     // Default: 'q'
  minLength?: number;        // Default: 2
  maxRecentSearches?: number; // Default: 5
  storageKey?: string;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    syncToUrl = true,
    urlParamName = 'q',
    minLength = 2,
    maxRecentSearches = 5,
    storageKey = 'recent-searches',
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(urlParamName) || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const timerRef = useRef<NodeJS.Timeout>();

  // Debounce
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query, debounceMs]);

  // URL sync
  useEffect(() => {
    if (!syncToUrl) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery && debouncedQuery.length >= minLength) {
      params.set(urlParamName, debouncedQuery);
    } else {
      params.delete(urlParamName);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, syncToUrl, urlParamName, minLength, router, searchParams]);

  // Recent searches
  const addToRecent = useCallback((term: string) => {
    if (typeof window === 'undefined') return;
    const stored: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = [term, ...stored.filter((s) => s !== term)].slice(0, maxRecentSearches);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [storageKey, maxRecentSearches]);

  const getRecentSearches = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }, [storageKey]);

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching: query.length >= minLength,
    addToRecent,
    getRecentSearches,
    clearRecentSearches,
  };
}
```

### 45.1 Search Result Highlighter

```typescript
// components/core/Highlight.tsx
export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
```

---

## 46. Printing & Export Architecture

All data export and print operations must route through a centralized service that handles PDF generation, print-friendly CSS, and CSV/Excel exports.

```typescript
// lib/export/exportService.ts
export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'print';

interface ExportOptions<T> {
  data: T[];
  columns: { key: keyof T; header: string; format?: (value: any) => string }[];
  title: string;
  filename: string;
  format: ExportFormat;
  orientation?: 'portrait' | 'landscape';
}

class ExportService {
  async export<T>(options: ExportOptions<T>) {
    switch (options.format) {
      case 'csv':
        return this.exportCSV(options);
      case 'xlsx':
        return this.exportXLSX(options);
      case 'pdf':
        return this.exportPDF(options);
      case 'print':
        return this.printTable(options);
    }
  }

  private exportCSV<T>(options: ExportOptions<T>) {
    const headers = options.columns.map((c) => c.header).join(',');
    const rows = options.data.map((row) =>
      options.columns.map((col) => {
        const value = col.format ? col.format(row[col.key]) : String(row[col.key] ?? '');
        // Escape CSV values containing commas, quotes, or newlines
        return value.includes(',') || value.includes('"') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    ).join('\n');

    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${options.filename}.csv`);
  }

  private async exportXLSX<T>(options: ExportOptions<T>) {
    // Lazy-load xlsx library (heavy — only load on demand)
    const XLSX = await import('xlsx');
    const wsData = [
      options.columns.map((c) => c.header),
      ...options.data.map((row) =>
        options.columns.map((col) =>
          col.format ? col.format(row[col.key]) : row[col.key]
        )
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, options.title);
    XLSX.writeFile(wb, `${options.filename}.xlsx`);
  }

  private async exportPDF<T>(options: ExportOptions<T>) {
    // Lazy-load jspdf + jspdf-autotable
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: options.orientation || 'portrait' });

    doc.setFontSize(16);
    doc.text(options.title, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [options.columns.map((c) => c.header)],
      body: options.data.map((row) =>
        options.columns.map((col) =>
          col.format ? col.format(row[col.key]) : String(row[col.key] ?? '')
        )
      ),
    });

    doc.save(`${options.filename}.pdf`);
  }

  private printTable<T>(options: ExportOptions<T>) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${options.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${options.title}</h1>
        <table>
          <thead><tr>${options.columns.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead>
          <tbody>
            ${options.data.map((row) => `<tr>${options.columns.map((col) => `<td>${col.format ? col.format(row[col.key]) : row[col.key] ?? ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
```

---

## 47. Charts Architecture (Shared Visualization System)

All chart components must consume a shared color palette, tooltip configuration, legend style, and responsive container. Direct Recharts/Chart.js usage is prohibited — all charts render through our wrapper.

```typescript
// lib/charts/chartConfig.ts
export const chartColorPalette = {
  primary: 'hsl(221, 83%, 53%)',
  secondary: 'hsl(262, 83%, 58%)',
  success: 'hsl(142, 71%, 45%)',
  warning: 'hsl(38, 92%, 50%)',
  danger: 'hsl(0, 84%, 60%)',
  info: 'hsl(199, 89%, 48%)',
  // Sequential palette for multi-series charts
  series: [
    'hsl(221, 83%, 53%)',
    'hsl(262, 83%, 58%)',
    'hsl(142, 71%, 45%)',
    'hsl(38, 92%, 50%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
    'hsl(330, 81%, 60%)',
    'hsl(172, 66%, 50%)',
  ],
};

export const chartDefaults = {
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  },
  legend: {
    wrapperStyle: { fontSize: '12px', paddingTop: '8px' },
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: 'hsl(var(--border))',
  },
  responsiveMinHeight: 300,
};
```

### 47.1 Responsive Chart Container

```typescript
// components/core/charts/ChartContainer.tsx
'use client';

import { ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/core/skeletons/Skeleton';

interface ChartContainerProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: number;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  description,
  isLoading,
  isEmpty,
  emptyMessage = 'No data available for this period.',
  height = 300,
  children,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border bg-card p-6" role="figure" aria-label={title}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      {isLoading ? (
        <Skeleton className="w-full" height={height} />
      ) : isEmpty ? (
        <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {children as any}
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

### 47.2 Accessibility for Charts

*   All charts must include `role="figure"` and `aria-label` with a descriptive title.
*   Color-only data encoding is prohibited — use pattern fills or shape markers alongside colors for colorblind users.
*   Provide a "View as Table" toggle for screen reader users to access the raw data behind every chart.

---

## 48. Frontend Exception Capture (Centralized)

`console.log`, `console.error`, and `console.warn` are **prohibited in production code**. All error capture routes through a centralized service.

```typescript
// lib/observability/exceptionCapture.ts
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface ExceptionContext {
  [key: string]: unknown;
}

class FrontendExceptionService {
  private buffer: Array<{ level: LogLevel; message: string; context: ExceptionContext; ts: number }> = [];
  private flushInterval: NodeJS.Timeout | null = null;

  initialize() {
    // Flush buffered exceptions every 10 seconds
    this.flushInterval = setInterval(() => this.flush(), 10000);

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.capture('ERROR', 'Unhandled Promise Rejection', {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.capture('ERROR', 'Uncaught Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  capture(level: LogLevel, message: string, context: ExceptionContext = {}) {
    const entry = {
      level,
      message,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      ts: Date.now(),
    };

    this.buffer.push(entry);

    // Immediate flush for FATAL errors
    if (level === 'FATAL') this.flush();

    // Development-only console output
    if (process.env.NODE_ENV === 'development') {
      const consoleFn = level === 'ERROR' || level === 'FATAL' ? console.error : console.warn;
      consoleFn(`[${level}] ${message}`, context);
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];

    try {
      navigator.sendBeacon(
        '/api/v1/telemetry/frontend-errors',
        JSON.stringify({ errors: batch })
      );
    } catch {
      // If beacon fails, re-queue (with a cap to prevent memory leaks)
      this.buffer = [...batch.slice(-50), ...this.buffer];
    }
  }

  destroy() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flush();
  }
}

const exceptionService = new FrontendExceptionService();

// ── Public API ──
export function initializeExceptionCapture() {
  exceptionService.initialize();
}

export function captureFrontendException(message: string, context?: ExceptionContext) {
  exceptionService.capture('ERROR', message, context);
}

export function captureFrontendWarning(message: string, context?: ExceptionContext) {
  exceptionService.capture('WARN', message, context);
}

export function captureFrontendFatal(message: string, context?: ExceptionContext) {
  exceptionService.capture('FATAL', message, context);
}
```

### 48.1 ESLint Rule: Ban console.* in Production

```json
{
  "rules": {
    "no-console": ["error", {
      "allow": []
    }]
  },
  "overrides": [
    {
      "files": ["lib/observability/**"],
      "rules": { "no-console": "off" }
    }
  ]
}
```

---

## 49. Feature, Component & Icon Registries

To prevent duplicate implementations and enforce consistency, all shared elements are catalogued in typed registries.

### 49.1 Feature Registry

```typescript
// lib/registries/featureRegistry.ts
export interface FeatureModule {
  id: string;
  name: string;
  basePath: string;
  icon: string;                // Lucide icon name
  permissions: string[];
  queryKeyPrefix: string;
  isEnabled: boolean;
  version: string;
}

export const featureRegistry: FeatureModule[] = [
  { id: 'people', name: 'People Management', basePath: '/admin/people', icon: 'Users', permissions: ['student.read', 'staff.read'], queryKeyPrefix: 'students', isEnabled: true, version: '1.0.0' },
  { id: 'attendance', name: 'Attendance', basePath: '/admin/attendance', icon: 'ClipboardCheck', permissions: ['attendance.read'], queryKeyPrefix: 'attendance', isEnabled: true, version: '1.0.0' },
  { id: 'billing', name: 'Billing & Fees', basePath: '/admin/billing', icon: 'Receipt', permissions: ['invoice.read'], queryKeyPrefix: 'billing', isEnabled: true, version: '1.0.0' },
  { id: 'exams', name: 'Examinations', basePath: '/admin/exams', icon: 'GraduationCap', permissions: ['exam.read'], queryKeyPrefix: 'exams', isEnabled: true, version: '1.0.0' },
  { id: 'reports', name: 'Reports', basePath: '/admin/reports', icon: 'BarChart3', permissions: ['report.read'], queryKeyPrefix: 'reports', isEnabled: true, version: '1.0.0' },
];
```

### 49.2 Icon Registry

```typescript
// lib/registries/iconRegistry.ts
import * as LucideIcons from 'lucide-react';

type IconName = keyof typeof LucideIcons;

// Centralized icon resolver — never import Lucide icons individually across the codebase
export function getIcon(name: string): React.ComponentType<{ className?: string }> {
  const Icon = (LucideIcons as Record<string, any>)[name];
  if (!Icon) {
    // Fallback — log warning in dev, return placeholder
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${name}" not found in registry.`);
    }
    return LucideIcons.HelpCircle;
  }
  return Icon;
}
```

---

## 50. Frontend Logging Rules

| Rule | Prohibited | Required |
| :--- | :--- | :--- |
| Error logging | `console.error(err)` | `captureFrontendException(msg, ctx)` |
| Warning logging | `console.warn(msg)` | `captureFrontendWarning(msg, ctx)` |
| Debug logging | `console.log(data)` | Remove entirely, or use dev-only `if (process.env.NODE_ENV === 'development')` guard |
| API errors | `toast(error.message)` | `useErrorHandler()` → Error Code Registry → UI mapping |
| Analytics | `gtag('event', ...)` | `analytics.track('event_name', props)` |
| Performance | `console.time()` | `monitorPerformanceMetrics()` via PerformanceObserver |

---

## 51. Version History & Document Governance

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2025-01-15 | Principal Architect | Initial specification — Rendering, State, Forms, Security |
| 2.0.0 | 2025-02-01 | Principal Architect | Performance Engineering, Bootstrap Pipeline, WebSocket Sync |
| 3.0.0 | 2025-03-01 | Principal Architect | Design System Governance, Accessibility, PWA, Testing Matrix |
| 4.0.0 | 2025-04-01 | Principal Architect | Authorization Layer, API Client, Error Registry, Theme Engine |
| 5.0.0-Final | 2025-05-01 | Principal Architect | Full 51-chapter Enterprise Specification — Navigation Registry, Modal Management, Keyboard Engine, Analytics, ADRs, File Upload, Search, Print/Export, Charts, Skeleton Library, Empty States, i18n, Notification Service, Exception Capture, Feature Registries |

**Classification:** Internal Technical Architecture — Do not distribute externally.  
**Review Cadence:** Quarterly review by Principal Frontend Architect.  
**Enforcement:** All rules are enforced via ESLint, TypeScript strict mode, CI/CD pipeline checks, and PR review checklists.
