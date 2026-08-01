'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isMobile: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Header({ isMobile, setIsMobileOpen }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const roleCode = user?.roleCode || (user as any)?.role || 'GUEST';

  const roleConfig: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
    STUDENT: {
      label: 'Student',
      badgeClass:
        'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/50',
      dotClass: 'bg-violet-500',
    },
    PARENT: {
      label: 'Parent',
      badgeClass:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
      dotClass: 'bg-emerald-500',
    },
    TUTOR: {
      label: 'Faculty / Tutor',
      badgeClass:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
      dotClass: 'bg-amber-500',
    },
    FACULTY: {
      label: 'Faculty / Tutor',
      badgeClass:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
      dotClass: 'bg-amber-500',
    },
    TENANT_ADMIN: {
      label: 'Admin',
      badgeClass:
        'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
      dotClass: 'bg-blue-500',
    },
    SUPER_ADMIN: {
      label: 'Super Admin',
      badgeClass:
        'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
      dotClass: 'bg-rose-500',
    },
    PLATFORM_ADMIN: {
      label: 'Platform Admin',
      badgeClass:
        'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
      dotClass: 'bg-indigo-500',
    },
  };

  const currentRoleInfo = roleConfig[roleCode] || {
    label: roleCode,
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
  };

  const lastSegment = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  const pageTitleMap: Record<string, string> = {
    overview: 'Overview',
    academics: 'Academics',
    timetable: 'Timetable',
    courses: 'My Courses',
    batches: 'My Batches',
    attendance: 'Attendance',
    exams: 'Examinations',
    curriculum: 'Curriculum Builder',
    branches: 'Campus Branches',
    'academic-years': 'Academic Years',
    parents: 'Parents Directory',
    students: 'Students Directory',
    tutors: 'Staff & Tutors',
    profile: 'My Profile',
    settings: 'Account Settings',
    fees: 'Fees & Billing',
    notifications: 'Notifications',
  };
  const activePageTitle =
    pageTitleMap[lastSegment] ||
    lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'User Profile';

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 transition-all duration-200">
      <div className="flex h-full items-center justify-between px-4 lg:px-7 gap-4">
        {/* Left Section - Mobile Hamburger & Clean Brand Context */}
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}

          {/* Clean Top Bar Header Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-violet-200 dark:shadow-none flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight hidden sm:inline">
                NEET Platform
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1 rounded-lg border border-violet-200/60 dark:border-violet-800/50 truncate">
                {activePageTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Notifications & User Pill */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 p-0 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Notifications
                </span>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full border border-violet-200/50">
                  All Caught Up
                </span>
              </div>
              <div className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No unread alerts
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  You are all up to date with your academic activities.
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Pill Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex items-center gap-2.5 p-1 pr-2.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 outline-none cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 ring-2 ring-violet-500/30 dark:ring-violet-400/20">
                    <AvatarImage src={user?.avatar || undefined} alt={fullName} />
                    <AvatarFallback className="bg-violet-600 text-white font-bold text-xs">
                      {fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900',
                      currentRoleInfo.dotClass,
                    )}
                  />
                </div>

                <div className="hidden sm:flex flex-col items-start text-left min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-snug max-w-[120px]">
                    {fullName}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wide leading-none">
                    {currentRoleInfo.label}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-60 p-1.5 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800"
            >
              {/* User Header in Dropdown */}
              <DropdownMenuLabel className="font-normal p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 mb-1 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || undefined} alt={fullName} />
                    <AvatarFallback className="bg-violet-600 text-white font-bold">
                      {fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || 'user@neetplatform.com'}
                    </p>
                    <div className="mt-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          currentRoleInfo.badgeClass,
                        )}
                      >
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full', currentRoleInfo.dotClass)}
                        />
                        {currentRoleInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

              <DropdownMenuItem
                asChild
                className="rounded-lg cursor-pointer py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Link href="/dashboard/profile" className="flex items-center gap-2.5">
                  <UserIcon className="h-4 w-4 text-violet-500" />
                  My Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="rounded-lg cursor-pointer py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Link href="/dashboard/settings" className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-blue-500" />
                  Account Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

              <DropdownMenuItem
                onClick={() => logout()}
                className="rounded-lg cursor-pointer py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/30 flex items-center gap-2.5"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
