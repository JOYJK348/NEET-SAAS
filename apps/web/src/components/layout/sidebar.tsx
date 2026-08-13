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
  Volume2,
  FolderTree,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
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
      iconColor: 'text-blue-500',
    },
    {
      name: 'My Timetable',
      href: '/dashboard/tutor/timetable',
      icon: Calendar,
      iconColor: 'text-violet-500',
    },
    {
      name: 'My Batches',
      href: '/dashboard/tutor/batches',
      icon: Layers,
      iconColor: 'text-indigo-500',
    },
    {
      name: 'Exams & Evaluation',
      href: '/dashboard/tutor/exams',
      icon: FileText,
      iconColor: 'text-emerald-500',
    },
    {
      name: 'Recordings Library',
      href: '/dashboard/tutor/recordings',
      icon: Video,
      iconColor: 'text-rose-500',
    },
  ];

  const studentNavigation = [
    {
      name: 'Dashboard Overview',
      href: '/dashboard/student',
      icon: LayoutDashboard,
      iconColor: 'text-violet-500',
    },
    {
      name: 'My Schedule',
      href: '/dashboard/student/timetable',
      icon: Clock,
      iconColor: 'text-indigo-500',
    },
    {
      name: 'Enrolled Courses',
      href: '/dashboard/student/courses',
      icon: BookOpen,
      iconColor: 'text-blue-500',
    },
    {
      name: 'Exams & Mock Tests',
      href: '/dashboard/student/exams',
      icon: FileText,
      iconColor: 'text-amber-500',
    },
    {
      name: 'Video Recordings',
      href: '/dashboard/student/recordings',
      icon: PlayCircle,
      iconColor: 'text-rose-500',
    },
  ];

  const parentNavigation = [
    {
      name: 'Overview',
      href: '/dashboard/parent/overview',
      icon: LayoutDashboard,
      iconColor: 'text-violet-500',
    },
    {
      name: 'Academic Progress',
      href: '/dashboard/parent/academics',
      icon: GraduationCap,
      iconColor: 'text-indigo-500',
    },
    {
      name: 'Exam Performance',
      href: '/dashboard/parent/exams',
      icon: FileText,
      iconColor: 'text-emerald-500',
    },
    {
      name: 'Communication',
      href: '/dashboard/parent/communication',
      icon: Bell,
      iconColor: 'text-amber-500',
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
          iconColor: 'text-violet-500',
        },
        {
          name: 'Branches & Campuses',
          href: '/tenant-admin/branches',
          icon: Building2,
          iconColor: 'text-blue-500',
        },
        {
          name: 'Academic Years',
          href: '/tenant-admin/academic-years',
          icon: Calendar,
          iconColor: 'text-emerald-500',
        },
        {
          name: 'Delivery Modes',
          href: '/tenant-admin/batch-delivery-types',
          icon: Clock,
          iconColor: 'text-amber-500',
        },
      ],
    },
    {
      category: 'People',
      items: [
        {
          name: 'Students & Admissions',
          href: '/dashboard/students',
          icon: GraduationCap,
          iconColor: 'text-indigo-500',
        },
        {
          name: 'Faculty / Tutors',
          href: '/dashboard/tutors',
          icon: Users,
          iconColor: 'text-cyan-500',
        },
        {
          name: 'Parents Directory',
          href: '/tenant-admin/parents',
          icon: Contact,
          iconColor: 'text-teal-500',
        },
      ],
    },
    {
      category: 'Academics',
      items: [
        {
          name: 'Subjects Directory',
          href: '/tenant-admin/subjects',
          icon: BookOpen,
          iconColor: 'text-blue-600',
        },
        {
          name: 'Courses & Programs',
          href: '/tenant-admin/courses',
          icon: BookMarked,
          iconColor: 'text-purple-600',
        },
        {
          name: 'Batches',
          href: '/dashboard/tutor/batches',
          icon: Layers,
          iconColor: 'text-indigo-600',
        },
        {
          name: 'Curriculum Builder',
          href: '/tenant-admin/curriculum',
          icon: FolderTree,
          iconColor: 'text-emerald-600',
        },
      ],
    },
    {
      category: 'Schedule',
      items: [
        {
          name: 'Master Timetable',
          href: '/dashboard/timetable',
          icon: Clock,
          iconColor: 'text-amber-600',
        },
        {
          name: 'Live Studio Sessions',
          href: '/dashboard/timetable/live-classes',
          icon: Video,
          iconColor: 'text-rose-500',
        },
      ],
    },
  ];

  // Auto prefetch all sidebar routes into Next.js router cache in background
  useEffect(() => {
    const handlePrefetch = (href?: string) => {
      if (href && href !== '#' && !href.startsWith('http')) {
        router.prefetch(href);
      }
    };

    const prefetchList = (items: NavItem[]) => {
      items.forEach((item) => {
        handlePrefetch(item.href);
        if (item.children) prefetchList(item.children);
      });
    };

    prefetchList(platformNavigation);
    prefetchList(tutorNavigation);
    prefetchList(studentNavigation);
    prefetchList(parentNavigation);
    tenantNavigation.forEach((g) => prefetchList(g.items));
  }, [router]);

  const handleLinkHover = (href: string) => {
    if (href && href !== '#' && !href.startsWith('http')) {
      router.prefetch(href);
    }
  };

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
                className={cn(
                  'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                )}
              >
                <Icon
                  className={cn(
                    depth === 0 ? 'h-5 w-5' : 'h-4 w-4',
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-primary-foreground' : item.iconColor || 'text-slate-400',
                  )}
                  aria-hidden="true"
                />
                <span className="font-semibold">{item.name}</span>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubMenu(item.name);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isSubOpen && 'rotate-180',
                  )}
                />
              </button>
            </div>

            {isSubOpen && (
              <div
                className={cn(
                  'space-y-1 border-l-2 border-violet-100 dark:border-gray-800/80 ml-5 pl-4 transition-all duration-200',
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
          className={cn(
            'flex items-center transition-all duration-150',
            depth > 0
              ? 'relative py-1.5 px-3.5 text-[13px] text-gray-500 hover:text-violet-600 dark:text-gray-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 rounded-md font-medium'
              : 'gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
            isActive &&
              (depth > 0
                ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 font-semibold'
                : 'bg-primary text-primary-foreground shadow-sm'),
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          {depth > 0 ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-violet-500 scale-125'
                    : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-violet-400',
                )}
              />
              <span>{item.name}</span>
            </div>
          ) : (
            <>
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary-foreground' : item.iconColor || 'text-slate-400',
                )}
                aria-hidden="true"
              />
              <span>{item.name}</span>
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
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard"
            onMouseEnter={() => handleLinkHover('/dashboard')}
            className="flex items-center gap-2.5 font-bold text-xl text-primary"
          >
            <span>NEET Platform</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto" aria-label="Main navigation">
          {(() => {
            const rawRole = user?.roleCode || (user as any)?.role || '';
            const currentRole = rawRole.toUpperCase();

            if (currentRole === 'SUPER_ADMIN' || currentRole === 'PLATFORM_ADMIN') {
              return (
                <div className="space-y-1">
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
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }
            if (currentRole === 'TUTOR' || currentRole === 'FACULTY') {
              return (
                <div className="space-y-1">
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
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                          isActive
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 dark:shadow-none'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-400',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0 transition-colors',
                            isActive ? 'text-white' : item.iconColor,
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }
            if (currentRole === 'STUDENT') {
              return (
                <div className="space-y-1">
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
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                          isActive
                            ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                            : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0 transition-colors',
                            isActive ? 'text-white' : item.iconColor,
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.name}</span>
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
                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-800/80 pt-3">
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
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                            isActive
                              ? 'bg-violet-600 text-white shadow-sm shadow-violet-200 dark:shadow-none'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-400',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0 transition-colors',
                              isActive ? 'text-white' : item.iconColor,
                            )}
                            aria-hidden="true"
                          />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // TENANT_ADMIN / SYSTEM_ADMIN / Default Tenant Menu
            return (
              <div className="space-y-6">
                {tenantNavigation.map((group, groupIdx) => {
                  const isGroupOpen = group.category
                    ? (openCategories[group.category] ?? true)
                    : true;
                  return (
                    <div key={groupIdx} className="space-y-1">
                      {group.category ? (
                        <button
                          onClick={() => toggleCategory(group.category)}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <span>{group.category}</span>
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 transition-transform duration-200',
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

        {/* User section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar || undefined}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback>{user.firstName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.roleCode.toLowerCase()}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1 mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign out</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-red-600 focus:text-red-600"
                >
                  Yes, sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile menu button - only show on mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 left-4 z-50 lg:hidden"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>
      )}

      {/* Close button for mobile */}
      {isMobileOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-16 z-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </Button>
      )}
    </>
  );
}
