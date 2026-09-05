'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES } from '@/lib/staleTimes';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Download,
  Sparkles,
  Building2,
  Video,
  PlayCircle,
  Film,
  BookOpen,
  FileText,
  FileCheck2,
  GraduationCap,
  CalendarCheck,
  Award,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';

import {
  platformStats,
  platformQuickActions,
  platformRecentActivity,
  platformFeatures,
} from '@/features/dashboard/mock/dashboard.mock';

function PlatformAdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-8 text-[#0F172A] font-sans">
      {/* Top Welcome & Enrolled Institution Header */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[#0052CC] shrink-0 shadow-2xs">
            <AvatarImage src={user?.avatar || undefined} alt={user?.firstName || 'Admin'} />
            <AvatarFallback className="bg-[#0052CC] text-white font-extrabold text-sm sm:text-base">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-base font-extrabold text-[#0B2447] truncate">
                Welcome, {user?.firstName || 'User'}!
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                PLATFORM SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              <span className="font-semibold text-slate-700">NEET Platform Central Core</span>
              <span className="mx-1">•</span>
              <span>Master Control & Multi-Tenant Dashboard</span>
            </p>
          </div>
        </div>

        <div className="hidden xs:flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs font-bold rounded-xl border-slate-300"
          >
            <Link href="/dashboard/platform-reports">
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Export System Report</span>
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs"
          >
            <Link href="/dashboard/institutes/new">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Tenant</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 🔴 1. PRIORITY SLIM BANNER BAR: LIVE PLATFORM STATUS */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 text-slate-900 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs font-extrabold rounded-full flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              SYSTEM LIVE NOW
            </span>
            <span className="text-xs text-[#0052CC] bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full font-extrabold truncate">
              Multi-Tenant Cluster Node-01
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-extrabold text-[#0B2447] tracking-tight leading-snug">
            All Institute Services Operational & Multi-Tenant Database Synced
          </h2>

          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1 text-[#0052CC] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-[#0052CC]" />
              Active Tenants: {platformStats[0]?.value || '12'}
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs font-semibold">
              Uptime: 99.98%
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs font-bold text-slate-800">
              <Users className="w-3.5 h-3.5 text-[#0052CC]" />
              1,240 Total Students Online
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/institutes"
          className="w-full md:w-auto px-5 py-3 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-2xs flex items-center justify-center gap-2 shrink-0 transition-all hover:shadow-md cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-white" />
          <span>MANAGE INSTITUTES</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2 & 3. TWO-COLUMN: Platform Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ▶️ Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-50 text-[#0052CC]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-extrabold text-[#0052CC] uppercase tracking-wider">
                    ⚡ Real-time Audit Log
                  </span>
                  <h3 className="text-sm font-bold text-[#0B2447]">Recent Platform Activity</h3>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">Live Feed</span>
            </div>

            <div className="space-y-2.5">
              {platformRecentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-[#0052CC] flex items-center justify-center">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{activity.action}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{activity.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/dashboard/platform-reports"
            className="w-full py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors mt-3"
          >
            <span>View Complete Platform Activity Log</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 🎥 Platform Management Features */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">
                    🏢 Core System Controls
                  </span>
                  <h3 className="text-sm font-bold text-[#0B2447]">Platform Feature Modules</h3>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {platformFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    href={feature.href}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#0052CC]">
                          {feature.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 group-hover:bg-[#0052CC] group-hover:text-white transition-all">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center font-medium">
            ⚡ Super Admin Portal allows instant institute management & global configuration
            overrides.
          </p>
        </div>
      </div>

      {/* 📚 4. OVERVIEW KPI STAT CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {stat.name}
                </span>
                <div className={cn('p-1.5 rounded-lg', stat.color)}>
                  <Icon className="w-4 h-4 text-[#0052CC]" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#0B2447]">{stat.value}</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#0052CC] h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <p className="text-[11px] font-medium text-slate-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* 🎧 5. QUICK ACTIONS GRID */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0B2447]">
              ⚡ Quick Platform Operations Launcher
            </h3>
            <p className="text-xs text-slate-500">
              Access core admin actions and report generators in one click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platformQuickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="p-3.5 bg-blue-50/70 hover:bg-blue-100/80 rounded-xl border border-blue-200 flex flex-col items-center text-center space-y-1.5 transition-all group"
              >
                <Icon className="w-6 h-6 text-[#0052CC] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">{action.name}</span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Quick Access
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TENANT ADMIN COMPONENT (EXACT STUDENT DASHBOARD UI/UX)
// ==========================================

interface TenantDashboardOverviewResponse {
  stats: {
    totalStudents: number;
    totalBatches: number;
    totalExams: number;
    totalBranches: number;
    totalTutors: number;
    totalFeeCollected: number;
    feeCollectionPercentage: number;
    overallAttendancePercentage: number;
  };
  liveClassActive?: {
    id: string;
    title: string;
    subjectName: string;
    batchName: string;
    startTime: string;
    campusName: string;
    enrolledStudentsCount: number;
    status: string;
  } | null;
  runningBatches?: Array<{
    id: string;
    name: string;
    code: string;
    studentCount: number;
    courseName: string;
    progressPercentage: number;
  }>;
  recentRecordings?: Array<{
    id: string;
    title: string;
    subjectName: string;
    dateFormatted: string;
    durationMinutes: number;
    watchUrl: string;
  }>;
  feeSummary?: {
    totalFeeAssignments: number;
    paidFeeAssignments: number;
    pendingFeeAssignments: number;
    totalAmountCollected: number;
  };
  recentAdmissions: Array<{
    name: string;
    course: string;
    batch: string;
    status: string;
    statusColor: string;
  }>;
  upcomingMockTests: Array<{
    id: string;
    title: string;
    time: string;
    desc: string;
  }>;
}

function TenantAdminDashboard() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const { data, isLoading: loading } = useQuery<TenantDashboardOverviewResponse>({
    queryKey: queryKeys.dashboard.overview(tenantId),
    queryFn: ({ signal }) =>
      api.get<TenantDashboardOverviewResponse>('/tenant-dashboard/overview', { signal }),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
    enabled: !!user,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 16 ? 'Good Afternoon' : 'Good Evening';

  const liveClass = data?.liveClassActive;

  const adminName =
    user?.firstName &&
    (user.firstName.toLowerCase().startsWith('tenant_admin') ||
      user.firstName.toLowerCase().startsWith('admin_'))
      ? 'Review Admin'
      : user?.firstName || 'Admin';

  return (
    <div className="space-y-6 pb-8 text-[#0F172A] font-sans">
      {/* 1. Top Welcome & Enrolled College / Institute Header */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[#0052CC] shrink-0 shadow-2xs">
            <AvatarImage src={user?.avatar || undefined} alt={adminName} />
            <AvatarFallback className="bg-[#0052CC] text-white font-extrabold text-sm sm:text-base">
              {adminName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-base font-extrabold text-[#0B2447] truncate">
                {greeting}, {adminName}!
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                TENANT ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              <span className="font-semibold text-slate-700">
                {(() => {
                  const instName = (user as any)?.instituteName;
                  if (
                    !instName ||
                    instName.toLowerCase().startsWith('tenant_admin') ||
                    instName.toLowerCase().startsWith('tenant_') ||
                    instName.includes('_fa3a')
                  ) {
                    return 'NEET Coaching Academy';
                  }
                  return instName;
                })()}
              </span>
              <span className="mx-1">•</span>
              <span>AY 2026–2027 Session</span>
            </p>
          </div>
        </div>

        <Link
          href="/tenant-admin/branches"
          className="hidden xs:flex px-3 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs items-center gap-1.5 shrink-0 transition-all"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Campus Portal</span>
        </Link>
      </div>

      {/* 🔴 2. LIVE ACADEMIC SESSION BANNER */}
      {liveClass ? (
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 text-slate-900 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans animate-in fade-in duration-200">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-xs font-extrabold rounded-full flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                {liveClass.status === 'LIVE' ? 'LIVE CLASS ACTIVE NOW' : 'SCHEDULED SESSION TODAY'}
              </span>
              <span className="text-xs text-[#0052CC] bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full font-extrabold truncate">
                {liveClass.subjectName} ({liveClass.batchName})
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-[#0B2447] tracking-tight leading-snug">
              {liveClass.title}
            </h2>

            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-medium">
              <span className="inline-flex items-center gap-1 text-[#0052CC] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                {liveClass.startTime}
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Campus: {liveClass.campusName}
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs font-bold text-slate-800">
                <Users className="w-3.5 h-3.5 text-[#0052CC]" />
                {liveClass.enrolledStudentsCount} Enrolled Students
              </span>
            </div>
          </div>

          <Link
            href={`/dashboard/live/${liveClass.id}`}
            className="w-full md:w-auto px-5 py-3 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-2xs flex items-center justify-center gap-2 shrink-0 transition-all hover:shadow-md cursor-pointer"
          >
            <Video className="w-4 h-4 text-white" />
            <span>VIEW CLASS TIMETABLE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="w-full bg-gradient-to-r from-blue-50/60 to-slate-50 text-slate-900 p-4 sm:p-5 rounded-2xl shadow-2xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-[#0052CC] text-[10px] sm:text-xs font-extrabold rounded-full uppercase tracking-wider">
                LIVE TIMETABLE
              </span>
              <span className="text-xs text-slate-500 font-semibold">Real-time status</span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#0B2447]">
              No Live Class Currently Active
            </h2>
            <p className="text-xs text-slate-500">
              All live classes scheduled for today will automatically stream here when started by tutors.
            </p>
          </div>

          <Link
            href="/dashboard/timetable"
            className="w-full md:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0052CC] text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 shrink-0 transition-all"
          >
            <Video className="w-4 h-4" />
            <span>View Full Timetable</span>
          </Link>
        </div>
      )}



      {/* 📚 5. OVERVIEW KPI STAT CARDS (4 Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
            <BookOpen className="w-4 h-4 text-[#0052CC]" />
          </div>
          <p className="text-2xl font-extrabold text-[#0B2447]">
            {loading ? '...' : (data?.stats?.totalStudents ?? 0)}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0052CC] h-full rounded-full" style={{ width: '82%' }} />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Active Campus Admissions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Attendance Rate
            </span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            {loading ? '...' : `${data?.stats?.overallAttendancePercentage ?? 0}%`}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Real-time Attendance DB
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exams & Mocks
            </span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#0B2447]">
            {loading ? '...' : (data?.stats?.totalExams ?? 0)}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Scheduled Test Papers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Campuses
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">
            {loading ? '...' : (data?.stats?.totalBranches ?? 0)}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Target Session: 2026-27</p>
        </div>
      </div>

      {/* 🎧 6. SUBJECT & CURRICULUM PRACTICE SUITE LAUNCHER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0B2447]">
              🔬 NEET 4-Subject Curriculum Directory
            </h3>
            <p className="text-xs text-slate-500">
              Access Physics, Chemistry, Botany, and Zoology curriculum master data.
            </p>
          </div>
          <Link
            href="/tenant-admin/subjects"
            className="text-xs text-[#0052CC] font-bold hover:underline"
          >
            Manage Subjects
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/tenant-admin/subjects"
            className="p-3.5 bg-blue-50/70 hover:bg-blue-100/80 rounded-xl border border-blue-200 flex flex-col items-center text-center space-y-1.5 transition-all group"
          >
            <BookOpen className="w-6 h-6 text-[#0052CC] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Physics (P)</span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              180 Marks • 45 Qs
            </span>
          </Link>

          <Link
            href="/tenant-admin/subjects"
            className="p-3.5 bg-rose-50/70 hover:bg-rose-100/80 rounded-xl border border-rose-200 flex flex-col items-center text-center space-y-1.5 transition-all group"
          >
            <FileText className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Chemistry (C)</span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              180 Marks • 45 Qs
            </span>
          </Link>

          <Link
            href="/tenant-admin/subjects"
            className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 flex flex-col items-center text-center space-y-1.5 transition-all group"
          >
            <GraduationCap className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Botany (B)</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              180 Marks • 45 Qs
            </span>
          </Link>

          <Link
            href="/tenant-admin/subjects"
            className="p-3.5 bg-purple-50/70 hover:bg-purple-100/80 rounded-xl border border-purple-200 flex flex-col items-center text-center space-y-1.5 transition-all group"
          >
            <Award className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Zoology (Z)</span>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              180 Marks • 45 Qs
            </span>
          </Link>
        </div>
      </div>

      {/* 📝 7. THREE-COLUMN QUICK ACTION / SUPPORT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Admissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B2447] flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#0052CC]" /> Recent Student Admissions
            </h3>
            <Link
              href="/dashboard/students"
              className="text-xs text-[#0052CC] font-semibold hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {!data?.recentAdmissions || data.recentAdmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center font-medium">
                No student admissions recorded yet
              </p>
            ) : (
              data.recentAdmissions.slice(0, 2).map((st, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1"
                >
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                    {st.status}
                  </span>
                  <p className="text-xs font-bold text-slate-800">{st.name}</p>
                  <p className="text-[11px] text-slate-600">
                    {st.course} • {st.batch}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Mock Tests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B2447] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" /> Upcoming Mock Tests
            </h3>
            <Link
              href="/dashboard/exams"
              className="text-xs text-[#0052CC] font-semibold hover:underline"
            >
              Manage Exams
            </Link>
          </div>
          <div className="space-y-2">
            {!data?.upcomingMockTests || data.upcomingMockTests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center font-medium">
                No upcoming mock tests created
              </p>
            ) : (
              data.upcomingMockTests.slice(0, 2).map((t, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 space-y-1"
                >
                  <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">
                    {t.time}
                  </span>
                  <p className="text-xs font-bold text-slate-800">{t.title}</p>
                  <p className="text-[11px] text-slate-600">{t.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Support & Fee Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B2447] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-cyan-600" /> Fee & Billing Overview
            </h3>
            <Link
              href="/tenant-admin/fees"
              className="text-xs text-[#0052CC] font-semibold hover:underline"
            >
              View Billing
            </Link>
          </div>
          <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 space-y-1 text-[#0F172A]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider">
                Fee Collection Rate
              </span>
              <span className="text-xs font-extrabold text-cyan-900">
                {data?.stats?.feeCollectionPercentage ?? 0}%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              ₹{data?.stats?.totalFeeCollected?.toLocaleString() ?? 0} Collected
            </p>
            <p className="text-[11px] text-slate-600">
              {data?.feeSummary?.paidFeeAssignments ?? 0} of {data?.feeSummary?.totalFeeAssignments ?? 0} fee assignments paid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CONTAINER & EXPORT
// ==========================================

function DashboardSkeleton() {
  return (
    <div className="space-y-5 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen animate-pulse text-[#0F172A] font-sans">
      {/* 1. Welcome Banner Skeleton */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-5 border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-32 bg-blue-200/60 rounded-full" />
          </div>
          <div className="h-7 w-56 sm:w-72 bg-blue-300/40 rounded-lg" />
          <div className="h-3 w-48 bg-blue-200/50 rounded-full" />
        </div>
        <div className="h-10 w-36 bg-[#0052CC]/20 rounded-xl border border-blue-300/40 shrink-0" />
      </div>

      {/* 2. Live Class / Academic Session Banner Skeleton */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 bg-rose-100 rounded-full" />
            <div className="h-5 w-36 bg-blue-100 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 bg-slate-100 rounded-lg" />
            <div className="h-6 w-28 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="h-10 w-40 bg-[#0052CC]/80 rounded-xl shrink-0" />
      </div>

      {/* 3. KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded-full" />
              <div className="h-6 w-6 bg-blue-100 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded-md" />
            <div className="h-3 w-24 bg-slate-100 rounded-full" />
          </Card>
        ))}
      </div>

      {/* 4. Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded-full pb-2 border-b border-slate-100" />
          <div className="space-y-3">
            <div className="h-12 w-full bg-slate-50 rounded-xl" />
            <div className="h-12 w-full bg-slate-50 rounded-xl" />
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="h-4 w-40 bg-slate-200 rounded-full pb-2 border-b border-slate-100" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
                    <div className="h-2.5 w-36 bg-slate-100 rounded-full" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

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
    return <DashboardSkeleton />;
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
