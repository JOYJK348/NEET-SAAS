'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Download, Sparkles, Building2 } from 'lucide-react';

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
  const [data, setData] = useState<{
    stats: {
      totalStudents: number;
      totalBatches: number;
      totalExams: number;
      totalBranches: number;
      totalTutors: number;
    };
    recentAdmissions: Array<{
      name: string;
      course: string;
      batch: string;
      status: string;
      statusColor: string;
    }>;
    todayClasses: Array<{
      time: string;
      subject: string;
      topic: string;
      color: string;
    }>;
    upcomingMockTests: Array<{
      title: string;
      time: string;
      desc: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await api.get<any>('/tenant-dashboard/overview');
        setData(res);
      } catch (err) {
        console.error('Failed to load tenant overview stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const statsList = [
    {
      name: 'Students',
      value: loading ? '...' : (data?.stats.totalStudents ?? 0).toString(),
      change: 'Active enrolled',
      icon: '👨‍🎓',
    },
    {
      name: 'Active Batches',
      value: loading ? '...' : (data?.stats.totalBatches ?? 0).toString(),
      change: 'Running batches',
      icon: '🏫',
    },
    {
      name: 'Mock Tests',
      value: loading ? '...' : (data?.stats.totalExams ?? 0).toString(),
      change: 'Exams created',
      icon: '📝',
    },
    {
      name: 'Active Branches',
      value: loading ? '...' : (data?.stats.totalBranches ?? 0).toString(),
      change: 'Campus locations',
      icon: '🏢',
    },
  ];

  return (
    <div className="space-y-5 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* 1. Welcome Header - Clean Student-Style Header Banner */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Tenant Admin Dashboard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            Good Morning, {user?.firstName || 'Admin'}! 👋
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Welcome back to your Tenant Administration Portal
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-extrabold text-violet-200 tracking-wider">
              Academic Session
            </p>
            <p className="font-mono font-bold text-sm text-white">2026 – 2027</p>
          </div>
        </div>
      </div>

      {/* 2. Real-time KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statsList.map((stat, idx) => (
          <Card
            key={idx}
            className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.name}
              </span>
              <span className="text-xl">{stat.icon}</span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-[#111827]">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Main Grid: Responsive coordinates to stack correctly on mobile */}
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
            {!data?.todayClasses || data.todayClasses.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No scheduled classes today</p>
            ) : (
              data.todayClasses.map((cls, idx) => (
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
              ))
            )}
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
            {!data?.recentAdmissions || data.recentAdmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No student admissions recorded yet</p>
            ) : (
              data.recentAdmissions.map((student, idx) => (
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
              ))
            )}
          </div>
        </Card>

        {/* 6. Fee Summary */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-2 lg:col-start-1 lg:row-start-2 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2 flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Fee Collection Summary
            </h2>
            <span className="text-xs text-slate-400 font-medium">Academic Year 2026-27</span>
          </div>
          <div className="space-y-4 pt-1">
            {(!data?.stats.totalStudents || data.stats.totalStudents === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No fee structures or active student enrollments configured yet
              </div>
            ) : (
              [
                { label: 'Collected Fee', percentage: 0, textClass: 'text-emerald-600', color: 'bg-emerald-500' },
                { label: 'Pending Fee', percentage: 100, textClass: 'text-amber-600', color: 'bg-amber-500' },
                { label: 'Overdue Fee', percentage: 0, textClass: 'text-rose-600', color: 'bg-rose-500' },
              ].map((sum, idx) => (
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
              ))
            )}
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
            {!data?.upcomingMockTests || data.upcomingMockTests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No mock tests created yet</p>
            ) : (
              data.upcomingMockTests.map((test, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#111827]">{test.title}</h4>
                    <span className="text-[10px] font-bold uppercase text-[#7C3AED]">
                      {test.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{test.desc}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 8. AI Insights */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-2 lg:col-start-1 lg:row-start-3 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2 flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              AI Analytics & Insights
            </h2>
            <Sparkles className="w-4 h-4 text-violet-500" />
          </div>
          <div className="py-6 text-center text-xs text-slate-400">
            {data?.stats.totalStudents === 0
              ? 'AI Analytics will automatically activate once students complete exams and attendances'
              : 'Insights generating based on ongoing student performances...'}
          </div>
        </Card>

        {/* 9. Communication Center */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-start-3 lg:row-start-4 space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Today&apos;s Messages
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { label: 'SMS Sent', count: 0, color: 'bg-blue-50 text-blue-700' },
              { label: 'WhatsApp Pending', count: 0, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Emails Sent', count: 0, color: 'bg-purple-50 text-purple-700' },
              { label: 'Unread Replies', count: 0, color: 'bg-amber-50 text-amber-700' },
            ].map((item, idx) => (
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
            {[
              { name: 'Pending Admissions', count: 0, url: '/dashboard/admissions' },
              { name: 'Pending Evaluations', count: 0, url: '/dashboard/exams' },
            ].map((task, idx) => (
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
              Tenant Performance Overview
            </h2>
          </div>
          <div className="space-y-4 pt-1">
            {(!data?.stats.totalStudents || data.stats.totalStudents === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No exam or attendance data recorded yet to compute overall tenant performance
              </div>
            ) : (
              [
                { label: 'Average Score', percentage: 0, textClass: 'text-indigo-600', color: 'bg-indigo-500' },
                { label: 'Attendance Rate', percentage: 0, textClass: 'text-emerald-600', color: 'bg-emerald-500' },
                { label: 'Syllabus Completion', percentage: 0, textClass: 'text-purple-600', color: 'bg-purple-500' },
              ].map((perf, idx) => (
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
              ))
            )}
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

function TutorRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/tutor');
    router.refresh();
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    </DashboardLayout>
  );
}

function DashboardPageContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.roleCode === 'TUTOR') {
      router.replace('/dashboard/tutor');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.roleCode === 'STUDENT') {
      router.replace('/dashboard/student');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.roleCode === 'PARENT') {
      router.replace('/dashboard/parent/academics');
    }
  }, [isLoading, isAuthenticated, user, router]);

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

  // TUTOR / STUDENT / PARENT users get redirected above; show loading while redirect is in progress
  if (user?.roleCode === 'TUTOR' || user?.roleCode === 'STUDENT' || user?.roleCode === 'PARENT') {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

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
