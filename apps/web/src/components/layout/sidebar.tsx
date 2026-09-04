'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  GraduationCap,
  Target,
  Layers,
  BookMarked,
  Contact,
  Calendar,
  Clock,
  Video,
  FileText,
  Bookmark,
  PlayCircle,
  Shield,
  Sliders,
  BarChart,
  Bell,
  UserCheck,
  Volume2,
  FolderTree,
  ClipboardCheck,
} from 'lucide-react';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import { useAuth } from '@/providers/auth-provider';
import { useQueryClient } from '@tanstack/react-query';
import {
  studentDashboardKeys,
  studentDashboardApi,
} from '@/features/student-dashboard/api/student-dashboard.api';
import { api } from '@/lib/api';
import { STALE_TIMES } from '@/lib/staleTimes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChildSwitcher } from '@/features/parent-portal/components/ChildSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  isMobile: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  children?: NavItem[];
}

export function Sidebar({ isMobile, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    Organization: true,
    Academics: true,
    Schedule: true,
    Operations: true,
    Finance: true,
    Communication: true,
    Analytics: true,
    Settings: true,
  });
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    People: true,
    Courses: true,
    'Course Details': true,
    Curriculum: true,
    Learning: true,
  });

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const tutorNavigation = [
    {
      name: 'Overview',
      href: '/dashboard/tutor',
      icon: LayoutDashboard,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Timetable',
      href: '/dashboard/tutor/timetable',
      icon: Calendar,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Classes',
      href: '/dashboard/tutor/classes',
      icon: BookOpen,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Batches',
      href: '/dashboard/tutor/batches',
      icon: Layers,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Class Attendance',
      href: '/dashboard/tutor/attendance',
      icon: ClipboardCheck,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Exams & Evaluation',
      href: '/dashboard/tutor/exams',
      icon: FileText,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Recordings Library',
      href: '/dashboard/tutor/recordings',
      icon: Video,
      iconColor: 'text-[#0052CC]',
    },
  ];

  const studentNavigation = [
    {
      name: 'Dashboard Overview',
      href: '/dashboard/student',
      icon: LayoutDashboard,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Schedule',
      href: '/dashboard/student/timetable',
      icon: Clock,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Enrolled Courses',
      href: '/dashboard/student/courses',
      icon: BookOpen,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Exams & Mock Tests',
      href: '/dashboard/student/exams',
      icon: FileText,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Video Recordings',
      href: '/dashboard/student/recordings',
      icon: PlayCircle,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Question Papers (PYQ)',
      href: '/dashboard/student/pyq',
      icon: FileText,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Attendance',
      href: '/dashboard/student/attendance',
      icon: UserCheck,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Fees & Receipts',
      href: '/dashboard/student/fees',
      icon: DollarSign,
      iconColor: 'text-[#0052CC]',
    },
  ];

  const parentNavigation = [
    {
      name: 'Academic Progress',
      href: '/dashboard/parent/academics',
      icon: GraduationCap,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Student Attendance',
      href: '/dashboard/parent/attendance',
      icon: Calendar,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Exam Performance',
      href: '/dashboard/parent/exams',
      icon: FileText,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Enrolled Courses',
      href: '/dashboard/parent/courses',
      icon: BookOpen,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'Assigned Batches',
      href: '/dashboard/parent/batches',
      icon: Layers,
      iconColor: 'text-[#0052CC]',
    },
    {
      name: 'My Fee Account',
      href: '/dashboard/parent/fees',
      icon: DollarSign,
      iconColor: 'text-[#0052CC]',
    },
  ];

  const platformNavigation = [
    { name: 'Platform Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Institutes / Tenants', href: '/dashboard/institutes', icon: Building2 },
    { name: 'Platform Reports', href: '/dashboard/platform-reports', icon: BarChart },
  ];

  const tenantNavigation = [
    {
      category: 'Organization',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Branches & Campuses',
          href: '/tenant-admin/branches',
          icon: Building2,
        },
        {
          name: 'Academic Years',
          href: '/tenant-admin/academic-years',
          icon: Calendar,
        },

        {
          name: 'People & Accounts',
          href: '#',
          icon: Users,
          children: [
            {
              name: 'Students & Admissions',
              href: '/dashboard/students',
              icon: GraduationCap,
            },
            {
              name: 'Teachers & Faculty',
              href: '/dashboard/tutors',
              icon: Contact,
            },
            {
              name: 'Parents Directory',
              href: '/tenant-admin/parents',
              icon: Users,
            },
          ],
        },
      ],
    },
    {
      category: 'Academics',
      items: [
        {
          name: 'Courses & Master Subjects',
          href: '#',
          icon: BookOpen,
          children: [
            {
              name: 'Course Programs',
              href: '/tenant-admin/courses',
              icon: BookMarked,
            },
            {
              name: 'Curriculum & Subjects',
              href: '/tenant-admin/curriculum',
              icon: FolderTree,
            },
          ],
        },
        {
          name: 'Batches & Classrooms',
          href: '/dashboard/batches',
          icon: Layers,
        },
      ],
    },
    {
      category: 'Schedule',
      items: [
        {
          name: 'Class Timetable',
          href: '/dashboard/timetable',
          icon: Clock,
        },
      ],
    },
    {
      category: 'Operations',
      items: [
        {
          name: 'Student Attendance',
          href: '/dashboard/attendance',
          icon: UserCheck,
        },
        {
          name: 'Class Recordings',
          href: '/dashboard/recordings',
          icon: PlayCircle,
        },
        {
          name: 'Exams & Test Papers',
          href: '/dashboard/exams',
          icon: FileText,
        },

        {
          name: 'Question Bank & PYQ',
          href: '/dashboard/pyq',
          icon: FileText,
        },
      ],
    },
    {
      category: 'Finance',
      items: [
        {
          name: 'Fee Management',
          href: '/tenant-admin/fees',
          icon: DollarSign,
        },
      ],
    },
  ];

  const queryClient = useQueryClient();

  const handleLinkHover = (href: string) => {
    if (href && href !== '#') {
      router.prefetch(href);
      try {
        if (href === '/dashboard/student') {
          queryClient.prefetchQuery({
            queryKey: studentDashboardKeys.overview(),
            queryFn: () => studentDashboardApi.getOverview(),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/student/timetable' || href === '/dashboard/timetable') {
          queryClient.prefetchQuery({
            queryKey: studentDashboardKeys.timetable(),
            queryFn: () => studentDashboardApi.getTimetable(),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/student/courses') {
          queryClient.prefetchQuery({
            queryKey: studentDashboardKeys.courses(),
            queryFn: () => studentDashboardApi.getCourses(),
            staleTime: STALE_TIMES.MASTERS,
          });
        } else if (href === '/dashboard/student/exams' || href === '/dashboard/exams') {
          queryClient.prefetchQuery({
            queryKey: ['student-exams'],
            queryFn: ({ signal }) =>
              api.get('/offline-exams/student-exams', { signal, skipGlobalToast: true }),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/student/recordings' || href === '/dashboard/recordings') {
          queryClient.prefetchQuery({
            queryKey: ['student-recordings-all'],
            queryFn: ({ signal }) =>
              api.get('/recordings', {
                params: { page: 1, limit: 100 },
                signal,
                skipGlobalToast: true,
              }),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/student/pyq' || href === '/dashboard/pyq') {
          queryClient.prefetchQuery({
            queryKey: ['student-pyq-all'],
            queryFn: ({ signal }) => api.get('/pyq', { signal, skipGlobalToast: true }),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/student/attendance') {
          queryClient.prefetchQuery({
            queryKey: studentDashboardKeys.attendance(),
            queryFn: () => studentDashboardApi.getAttendance(),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/student/fees' || href === '/tenant-admin/fees') {
          const studentAdmissionId =
            (user as any)?.studentAdmissionId || (user as any)?.id || 'DEMO_STUDENT_ID';
          queryClient.prefetchQuery({
            queryKey: ['student-fee-account', studentAdmissionId],
            queryFn: ({ signal }) =>
              api.get(`/billing/fee-assignments/${studentAdmissionId}`, {
                signal,
                skipGlobalToast: true,
              }),
            staleTime: STALE_TIMES.DEFAULT,
          });
        } else if (href === '/dashboard/parent/fees') {
          const childId =
            typeof window !== 'undefined'
              ? localStorage.getItem('parent_portal_selected_child_id')
              : null;
          if (childId) {
            queryClient.prefetchQuery({
              queryKey: ['parent', 'fees', childId],
              queryFn: () => parentPortalService.getFees(childId),
              staleTime: STALE_TIMES.DEFAULT,
            });
          }
        } else if (
          href === '/dashboard/parent/academics' ||
          href === '/dashboard/parent/courses' ||
          href === '/dashboard/parent/batches'
        ) {
          const childId =
            typeof window !== 'undefined'
              ? localStorage.getItem('parent_portal_selected_child_id')
              : null;
          if (childId) {
            queryClient.prefetchQuery({
              queryKey: ['parent', 'academics', childId],
              queryFn: () => parentPortalService.getAcademics(childId),
              staleTime: STALE_TIMES.DEFAULT,
            });
          }
        } else if (href === '/dashboard/parent/attendance') {
          const childId =
            typeof window !== 'undefined'
              ? localStorage.getItem('parent_portal_selected_child_id')
              : null;
          if (childId) {
            queryClient.prefetchQuery({
              queryKey: ['parent', 'attendance', childId],
              queryFn: () => parentPortalService.getAttendance(childId),
              staleTime: STALE_TIMES.DEFAULT,
            });
          }
        } else if (href === '/dashboard/parent/exams') {
          const childId =
            typeof window !== 'undefined'
              ? localStorage.getItem('parent_portal_selected_child_id')
              : null;
          if (childId) {
            queryClient.prefetchQuery({
              queryKey: ['parent', 'exams', childId],
              queryFn: () => parentPortalService.getExams(childId),
              staleTime: STALE_TIMES.DEFAULT,
            });
          }
        }
      } catch {}
    }
  };

  useEffect(() => {
    const rawRole = (user?.roleCode || (user as any)?.role || '').toUpperCase();
    if (rawRole === 'STUDENT') {
      try {
        const studentAdmissionId =
          (user as any)?.studentAdmissionId || (user as any)?.id || 'DEMO_STUDENT_ID';
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.overview(),
          queryFn: () => studentDashboardApi.getOverview(),
          staleTime: STALE_TIMES.DEFAULT,
        });
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.timetable(),
          queryFn: () => studentDashboardApi.getTimetable(),
          staleTime: STALE_TIMES.DEFAULT,
        });
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.courses(),
          queryFn: () => studentDashboardApi.getCourses(),
          staleTime: STALE_TIMES.MASTERS,
        });
        queryClient.prefetchQuery({
          queryKey: ['student-exams'],
          queryFn: ({ signal }) =>
            api.get('/offline-exams/student-exams', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        });
        queryClient.prefetchQuery({
          queryKey: ['student-recordings-all'],
          queryFn: ({ signal }) =>
            api.get('/recordings', {
              params: { page: 1, limit: 100 },
              signal,
              skipGlobalToast: true,
            }),
          staleTime: STALE_TIMES.DEFAULT,
        });
        queryClient.prefetchQuery({
          queryKey: ['student-pyq-all'],
          queryFn: ({ signal }) => api.get('/pyq', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        });
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.attendance(),
          queryFn: () => studentDashboardApi.getAttendance(),
          staleTime: STALE_TIMES.DEFAULT,
        });
        queryClient.prefetchQuery({
          queryKey: ['student-fee-account', studentAdmissionId],
          queryFn: ({ signal }) =>
            api.get(`/billing/fee-assignments/${studentAdmissionId}`, {
              signal,
              skipGlobalToast: true,
            }),
          staleTime: STALE_TIMES.DEFAULT,
        });
      } catch {}
    } else if (rawRole === 'PARENT') {
      try {
        const childId =
          typeof window !== 'undefined'
            ? localStorage.getItem('parent_portal_selected_child_id')
            : null;
        queryClient.prefetchQuery({
          queryKey: ['parent', 'linked-students'],
          queryFn: () => parentPortalService.getLinkedStudents(),
          staleTime: STALE_TIMES.DEFAULT,
        });
        if (childId) {
          queryClient.prefetchQuery({
            queryKey: ['parent', 'fees', childId],
            queryFn: () => parentPortalService.getFees(childId),
            staleTime: STALE_TIMES.DEFAULT,
          });
          queryClient.prefetchQuery({
            queryKey: ['parent', 'academics', childId],
            queryFn: () => parentPortalService.getAcademics(childId),
            staleTime: STALE_TIMES.DEFAULT,
          });
          queryClient.prefetchQuery({
            queryKey: ['parent', 'attendance', childId],
            queryFn: () => parentPortalService.getAttendance(childId),
            staleTime: STALE_TIMES.DEFAULT,
          });
          queryClient.prefetchQuery({
            queryKey: ['parent', 'exams', childId],
            queryFn: () => parentPortalService.getExams(childId),
            staleTime: STALE_TIMES.DEFAULT,
          });
        }
      } catch {}
    }
  }, [user, queryClient]);

  // Helper component to render nested submenus recursively
  const renderNavItems = (items: NavItem[], depth = 0) => {
    return items.map((item) => {
      const Icon = item.icon;
      const hasChildren = item.children && item.children.length > 0;
      const isSubOpen = openSubMenus[item.name] ?? false;
      const isActive =
        item.href === '/dashboard'
          ? pathname === '/dashboard'
          : item.href !== '#' && (pathname === item.href || pathname.startsWith(item.href + '/'));

      if (hasChildren) {
        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center">
              <Link
                href={item.href}
                onMouseEnter={() => handleLinkHover(item.href)}
                onFocus={() => handleLinkHover(item.href)}
                onClick={() => isMobile && setIsMobileOpen(false)}
                className={cn(
                  'flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-white/90 hover:text-[#0052CC] hover:shadow-2xs hover:translate-x-0.5',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5',
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-[#0052CC] group-hover:text-[#0052CC]',
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shrink-0" />}
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubMenu(item.name);
                }}
                className="p-2 text-slate-400 hover:text-[#0052CC] transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200 text-slate-400',
                    isSubOpen && 'rotate-180 text-[#0052CC]',
                  )}
                />
              </button>
            </div>

            {isSubOpen && (
              <div
                className={cn(
                  'space-y-1 border-l-2 border-blue-200/80 ml-4 pl-3.5 pt-0.5 transition-all duration-200',
                )}
              >
                {renderNavItems(item.children!, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.name}
          href={item.href}
          onMouseEnter={() => handleLinkHover(item.href)}
          onFocus={() => handleLinkHover(item.href)}
          onClick={() => isMobile && setIsMobileOpen(false)}
          className={cn(
            'flex items-center justify-between transition-all duration-200 group',
            depth > 0
              ? 'py-1.5 px-3 text-xs text-slate-600 hover:text-[#0052CC] hover:bg-white/80 rounded-xl font-bold hover:translate-x-0.5'
              : 'px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-white/90 hover:text-[#0052CC] hover:shadow-2xs hover:translate-x-0.5',
            isActive &&
              (depth > 0
                ? 'text-[#0052CC] bg-white font-black rounded-xl border border-blue-200 shadow-2xs'
                : 'bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-500/20 hover:translate-x-0'),
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          {depth > 0 ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-200',
                  isActive ? 'bg-[#0052CC] scale-125' : 'bg-slate-400 group-hover:bg-[#0052CC]',
                )}
              />
              <span className="truncate">{item.name}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-[#0052CC]',
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shrink-0" />}
            </>
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar (Premium Glassmorphic LMS Style) */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-gradient-to-b from-blue-50/95 via-indigo-50/60 to-sky-50/90 text-slate-900 border-r border-blue-200/80 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0_24px_rgba(0,82,204,0.06)] overflow-hidden font-sans',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Top Institution / Brand Header */}
        <div className="p-4 border-b border-blue-200/70 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <Link
            href="/dashboard"
            onClick={() => isMobile && setIsMobileOpen(false)}
            onMouseEnter={() => handleLinkHover('/dashboard')}
            className="flex items-center gap-3 min-w-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052CC] via-indigo-600 to-sky-500 shadow-md shadow-blue-500/20 text-white flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="truncate">
              <h2 className="font-extrabold text-sm text-[#0B2447] truncate leading-tight tracking-tight group-hover:text-[#0052CC] transition-colors">
                NEET Platform
              </h2>
              <p className="text-[10px] text-[#0052CC] font-mono font-extrabold truncate uppercase tracking-wider mt-0.5">
                Coaching SaaS Portal
              </p>
            </div>
          </Link>

          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-xl bg-blue-100/80 hover:bg-blue-200 text-slate-700 lg:hidden cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Institution Campus Card Badge */}
        <div className="mx-3 my-2.5 px-3 py-2 rounded-xl bg-white/70 border border-blue-200/80 shadow-2xs flex items-center gap-2.5 backdrop-blur-xs">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0 border border-blue-200/60">
            <Shield className="w-3.5 h-3.5 text-[#0052CC]" />
          </div>
          <div className="truncate min-w-0">
            <p className="text-[9px] text-[#0052CC] uppercase tracking-widest font-black">
              Institution Campus
            </p>
            <p className="text-xs font-extrabold text-[#0B2447] truncate">
              {(() => {
                const instName = (user as any)?.instituteName;
                if (
                  !instName ||
                  instName.toLowerCase().startsWith('tenant_admin') ||
                  instName.toLowerCase().startsWith('tenant_') ||
                  instName.includes('_fa3a')
                ) {
                  return 'NEET Premier Academy';
                }
                return instName;
              })()}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
          {(() => {
            const rawRole = user?.roleCode || (user as any)?.role || '';
            const currentRole = rawRole.toUpperCase();

            if (currentRole === 'SUPER_ADMIN' || currentRole === 'PLATFORM_ADMIN') {
              return (
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-black text-[#0052CC] uppercase tracking-wider mb-2">
                    Platform Management
                  </p>
                  {platformNavigation.map((item) => {
                    const isActive =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onMouseEnter={() => handleLinkHover(item.href)}
                        onFocus={() => handleLinkHover(item.href)}
                        onClick={() => isMobile && setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-700 hover:bg-white/90 hover:text-[#0052CC] hover:shadow-2xs hover:translate-x-0.5',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 flex-shrink-0',
                              isActive ? 'text-white' : 'text-[#0052CC]',
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              );
            }
            if (currentRole === 'TUTOR' || currentRole === 'FACULTY') {
              return (
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-black text-[#0052CC] uppercase tracking-wider mb-2">
                    Faculty Portal
                  </p>
                  {tutorNavigation.map((item) => {
                    const isActive =
                      item.href === '/dashboard/tutor'
                        ? pathname === '/dashboard/tutor'
                        : item.href === '/dashboard/tutor/timetable'
                          ? pathname === '/dashboard/tutor/timetable'
                          : pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onMouseEnter={() => handleLinkHover(item.href)}
                        onFocus={() => handleLinkHover(item.href)}
                        onClick={() => isMobile && setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-700 hover:bg-white/90 hover:text-[#0052CC] hover:shadow-2xs hover:translate-x-0.5',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 flex-shrink-0 transition-colors',
                              isActive ? 'text-white' : 'text-[#0052CC]',
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              );
            }
            if (currentRole === 'STUDENT') {
              return (
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-black text-[#0052CC] uppercase tracking-wider mb-2">
                    Student Portal
                  </p>
                  {studentNavigation.map((item) => {
                    const isActive =
                      item.href === '/dashboard/student'
                        ? pathname === '/dashboard/student'
                        : pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onMouseEnter={() => handleLinkHover(item.href)}
                        onFocus={() => handleLinkHover(item.href)}
                        onClick={() => isMobile && setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-700 hover:bg-white/90 hover:text-[#0052CC] hover:shadow-2xs hover:translate-x-0.5',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 flex-shrink-0 transition-colors',
                              isActive ? 'text-white' : 'text-[#0052CC]',
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              );
            }
            if (currentRole === 'PARENT') {
              return (
                <div className="space-y-4">
                  <ChildSwitcher isCollapsed={false} />
                  <div className="space-y-1 border-t border-blue-200/70 pt-3">
                    <p className="px-3 text-[10px] font-black text-[#0052CC] uppercase tracking-wider mb-2">
                      Parent Dashboard
                    </p>
                    {parentNavigation.map((item) => {
                      const isActive =
                        item.href === '/dashboard/parent/overview'
                          ? pathname === '/dashboard/parent/overview' ||
                            pathname === '/dashboard/parent'
                          : pathname === item.href || pathname.startsWith(item.href + '/');
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onMouseEnter={() => handleLinkHover(item.href)}
                          onFocus={() => handleLinkHover(item.href)}
                          onClick={() => isMobile && setIsMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200',
                            isActive
                              ? 'bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                              : 'text-slate-700 hover:bg-white/90 hover:text-[#0052CC] hover:shadow-2xs hover:translate-x-0.5',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                'h-4 w-4 flex-shrink-0 transition-colors',
                                isActive ? 'text-white' : 'text-[#0052CC]',
                              )}
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // TENANT_ADMIN / SYSTEM_ADMIN / Default Tenant Menu
            return (
              <div className="space-y-4">
                {tenantNavigation.map((group, groupIdx) => {
                  const isGroupOpen = group.category
                    ? (openCategories[group.category] ?? true)
                    : true;
                  return (
                    <div key={groupIdx} className="space-y-1">
                      {group.category ? (
                        <button
                          onClick={() => toggleCategory(group.category)}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-[#0052CC] uppercase tracking-wider hover:text-[#0B2447] transition-colors cursor-pointer group"
                        >
                          <span>{group.category}</span>
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 transition-transform duration-200 text-slate-400 group-hover:text-[#0052CC]',
                              !isGroupOpen && '-rotate-90',
                            )}
                          />
                        </button>
                      ) : null}

                      {isGroupOpen && (
                        <div className="space-y-1">{renderNavItems(group.items)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </nav>

        {/* User Profile Section Footer */}
        <div className="p-3.5 border-t border-blue-200/70 bg-gradient-to-r from-white/90 via-blue-50/40 to-slate-50/90 backdrop-blur-md">
          {user &&
            (() => {
              const first = (user.firstName || '').trim();
              const last = (user.lastName || '').trim();
              const fullName = `${first} ${last}`.trim();
              const displayName =
                !fullName ||
                fullName.toLowerCase().startsWith('tenant_admin') ||
                fullName.toLowerCase().startsWith('admin_')
                  ? 'Review Admin'
                  : fullName;

              const roleCodeUpper = (user.roleCode || '').toUpperCase();
              const roleLabel = roleCodeUpper.startsWith('TENANT_ADMIN')
                ? 'Tenant Administrator'
                : roleCodeUpper.startsWith('SUPER_ADMIN') ||
                    roleCodeUpper.startsWith('PLATFORM_ADMIN')
                  ? 'Platform Super Admin'
                  : roleCodeUpper.startsWith('TUTOR') || roleCodeUpper.startsWith('FACULTY')
                    ? 'Faculty Tutor'
                    : roleCodeUpper.startsWith('STUDENT')
                      ? 'Student Account'
                      : roleCodeUpper.startsWith('PARENT')
                        ? 'Parent Account'
                        : 'Tenant Administrator';

              return (
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9 border-2 border-blue-300/60 shadow-2xs ring-2 ring-blue-100">
                        <AvatarImage src={user.avatar || undefined} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-[#0052CC] to-indigo-600 text-white font-extrabold text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0 truncate">
                      <p className="text-xs font-black text-[#0B2447] truncate leading-snug">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-[#0052CC] font-mono truncate font-extrabold">
                        {roleLabel}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/60 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Sign out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 bg-white text-slate-900 border-slate-200 shadow-lg rounded-2xl p-1.5"
                    >
                      <DropdownMenuLabel className="text-xs font-bold text-slate-700">
                        Sign out from session?
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-100" />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer text-xs font-extrabold flex items-center gap-2 rounded-xl py-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Confirm Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })()}
        </div>
      </aside>
    </>
  );
}

