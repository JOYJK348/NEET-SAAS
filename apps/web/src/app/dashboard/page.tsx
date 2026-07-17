'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Download } from 'lucide-react';

import {
  platformStats,
  platformQuickActions,
  platformRecentActivity,
  platformFeatures,
  tenantStats,
  tenantQuickActions,
  todayClasses,
  recentAdmissions,
  feeSummary,
  upcomingMockTests,
  aiInsights,
  parentMessages,
  pendingTasks,
  performanceOverview,
} from '@/features/dashboard/mock/dashboard.mock';

function PlatformAdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Here&apos;s what&apos;s happening across the platform today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/platform-reports">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export Report
            </Link>
          </Button>
          <Button size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/institutes/new">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Create Tenant
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={cn('p-2 rounded-xl', stat.color)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {platformQuickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="group flex flex-col items-center p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#7C3AED]/50 hover:shadow-sm transition-all duration-150 hover:-translate-y-0.5 text-center"
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                    action.color,
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{action.name}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {platformRecentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
              <CardTitle className="text-lg font-semibold">Platform Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {platformFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    href={feature.href}
                    className="group flex flex-col p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] hover:border-[#7C3AED]/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-sm">{feature.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{feature.description}</p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TENANT ADMIN COMPONENT (PREMIUM SAAS)
// ==========================================

function TenantAdminDashboard() {
  const { user } = useAuth();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-5 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Academic Year 2026-2027</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-[#111827]">
            Good Morning 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-[#7C3AED]">Apex NEET Academy</span>
          </p>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E5E7EB]">
          <div className="text-right">
            <p className="text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.roleCode?.toLowerCase()?.replace('_', ' ')}
            </p>
          </div>
          <Avatar className="h-10 w-10 border border-[#E5E7EB]">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-[#7C3AED]/10 text-[#7C3AED] font-bold">
              {user?.firstName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* 2. KPI Cards (4 only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {tenantStats.map((stat, idx) => (
          <Card
            key={idx}
            className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.name}
              </span>
              <span className="text-xl">
                {stat.name === 'Students' && '👨‍🎓'}
                {stat.name === 'Active Batches' && '🏫'}
                {stat.name === 'Mock Tests' && '📝'}
                {stat.name === 'Fee Collection' && '💰'}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-[#111827]">{stat.value}</div>
              <p
                className={cn(
                  'text-xs mt-1',
                  stat.name === 'Students'
                    ? 'text-[#22C55E] font-medium'
                    : stat.name === 'Mock Tests'
                      ? 'text-indigo-600 font-medium'
                      : 'text-muted-foreground',
                )}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Quick Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tenantQuickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="group flex flex-col items-center justify-center p-4 rounded-xl border border-[#E5E7EB] bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50 hover:shadow-sm text-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                    action.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-[#111827]">{action.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Responsive coordinates to stack correctly on mobile but layout cleanly on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 4. Today's Classes */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-start-3 lg:row-start-1 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Today&apos;s Classes
            </h2>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
          <div className="space-y-3">
            {todayClasses.map((cls, idx) => (
              <div
                key={idx}
                className={cn('flex items-center justify-between p-3 rounded-xl border', cls.color)}
              >
                <div>
                  <p className="text-xs font-bold uppercase">{cls.time}</p>
                  <p className="text-sm font-bold mt-0.5">{cls.subject}</p>
                </div>
                <span className="text-xs font-medium opacity-90">{cls.topic}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 5. Recent Admissions */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-2 lg:col-start-1 lg:row-start-1 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Recent Admissions
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#7C3AED] hover:text-[#7C3AED]/80"
              asChild
            >
              <Link href="/dashboard/students">View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentAdmissions.map((student, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:border-[#7C3AED]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-100 text-xs font-bold text-[#111827]">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">{student.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {student.course} • {student.batch}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    student.statusColor,
                  )}
                >
                  {student.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* 6. Fee Summary */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-2 lg:col-start-1 lg:row-start-2 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Fee Collection Summary
            </h2>
          </div>
          <div className="space-y-4 pt-1">
            {Object.values(feeSummary).map((sum, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">{sum.label}</span>
                  <span className={cn('font-bold', sum.textClass)}>{sum.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', sum.color)}
                    style={{ width: `${sum.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 7. Upcoming Mock Tests */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-start-3 lg:row-start-2 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Upcoming Mock Tests
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingMockTests.map((test, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#111827]">{test.title}</h4>
                  <span className="text-[10px] font-bold uppercase text-[#7C3AED]">
                    {test.time}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{test.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 8. AI Insights */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-2 lg:col-start-1 lg:row-start-3 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              AI Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {aiInsights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div
                  key={idx}
                  className={cn('flex items-start gap-3 p-3 rounded-xl border', insight.color)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 9. Parent Communication */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-start-3 lg:row-start-4 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Today&apos;s Messages
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {parentMessages.map((item, idx) => (
              <div
                key={idx}
                className={cn('p-3 rounded-xl text-center border border-[#E5E7EB]', item.color)}
              >
                <p className="text-xl font-bold">{item.count}</p>
                <p className="text-[10px] font-semibold text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 10. Pending Tasks */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-start-3 lg:row-start-3 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Pending Tasks
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {pendingTasks.map((task, idx) => (
              <Link
                key={idx}
                href={task.url}
                className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] hover:border-[#7C3AED]/30 transition-all text-center block"
              >
                <p className="text-lg font-bold text-[#111827]">{task.count}</p>
                <p className="text-[10px] font-semibold text-muted-foreground mt-1">{task.name}</p>
              </Link>
            ))}
          </div>
        </Card>

        {/* 11. Performance Overview */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-2 lg:col-start-1 lg:row-start-4 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Performance Overview
            </h2>
          </div>
          <div className="space-y-4 pt-1">
            {performanceOverview.map((perf, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">{perf.label}</span>
                  <span className={cn('font-bold', perf.textClass)}>{perf.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', perf.color)}
                    style={{ width: `${perf.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// CONTAINER & EXPORT
// ==========================================

function DashboardContent() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.roleCode === 'PLATFORM_ADMIN';

  if (isPlatformAdmin) {
    return <PlatformAdminDashboard />;
  }

  return <TenantAdminDashboard />;
}

function DashboardPageContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
            <LoadingSpinner size="lg" />
          </div>
        </DashboardLayout>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
