'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isMobile: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Header({ isMobile, setIsMobileOpen }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const roleCode = user?.roleCode || (user as any)?.role || 'GUEST';
  const normalizedRole = (roleCode || '').toUpperCase();
  const matchedKey = normalizedRole.startsWith('TENANT_ADMIN')
    ? 'TENANT_ADMIN'
    : normalizedRole.startsWith('SUPER_ADMIN')
      ? 'SUPER_ADMIN'
      : normalizedRole.startsWith('PLATFORM_ADMIN')
        ? 'PLATFORM_ADMIN'
        : normalizedRole.startsWith('TUTOR') || normalizedRole.startsWith('FACULTY')
          ? 'TUTOR'
          : normalizedRole.startsWith('STUDENT')
            ? 'STUDENT'
            : normalizedRole.startsWith('PARENT')
              ? 'PARENT'
              : roleCode;

  const roleConfig: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
    STUDENT: {
      label: 'Student',
      badgeClass: 'bg-blue-50 text-[#0052CC] border-blue-200',
      dotClass: 'bg-[#0052CC]',
    },
    PARENT: {
      label: 'Parent',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-600',
    },
    TUTOR: {
      label: 'Faculty / Tutor',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-600',
    },
    FACULTY: {
      label: 'Faculty / Tutor',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-600',
    },
    TENANT_ADMIN: {
      label: 'Tenant Admin',
      badgeClass: 'bg-blue-50 text-[#0052CC] border-blue-200',
      dotClass: 'bg-[#0052CC]',
    },
    SUPER_ADMIN: {
      label: 'Super Admin',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-600',
    },
    PLATFORM_ADMIN: {
      label: 'Platform Admin',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotClass: 'bg-indigo-600',
    },
  };

  const currentRoleInfo = roleConfig[matchedKey] || {
    label: 'Tenant Admin',
    badgeClass: 'bg-blue-50 text-[#0052CC] border-blue-200',
    dotClass: 'bg-[#0052CC]',
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

  const rawFullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'User Profile';

  const fullName =
    !rawFullName ||
    rawFullName.toLowerCase().startsWith('tenant_admin') ||
    rawFullName.toLowerCase().startsWith('admin_')
      ? 'Review Admin'
      : rawFullName;

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/90 backdrop-blur-md border-b border-blue-200/80 shadow-2xs transition-all duration-200 font-sans">
      <div className="flex h-full items-center justify-between px-4 lg:px-6 gap-4">
        {/* Left Section - Mobile Hamburger & Clean Brand Context */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-slate-700 hover:bg-white/80 border border-slate-200/80 shadow-2xs"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Clean Top Bar Header Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0052CC] flex items-center justify-center text-white shadow-2xs font-extrabold text-xs flex-shrink-0">
              ⚡
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-extrabold text-sm text-[#0B2447] tracking-tight hidden sm:inline">
                NEET Platform
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs font-black text-[#0052CC] bg-white px-3 py-1 rounded-xl border border-blue-200/80 shadow-2xs truncate">
                {activePageTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Notifications & User Pill */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Live Indicator Badge */}
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span>Academic Portal Live</span>
          </div>

          {/* Static Clean User Profile Pill (No Pop-up Dropdown) */}
          <div className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-white border border-blue-200/80 shadow-2xs select-none">
            <Avatar className="h-8 w-8 ring-2 ring-[#0052CC]/30">
              <AvatarImage src={user?.avatar || undefined} alt={fullName} />
              <AvatarFallback className="bg-[#0052CC] text-white font-extrabold text-xs">
                {fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="hidden sm:flex flex-col items-start text-left min-w-0 pr-1">
              <span className="text-xs font-black text-[#0B2447] truncate leading-snug max-w-[130px]">
                {fullName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
