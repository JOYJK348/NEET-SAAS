'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  TrendingUp,
  Megaphone,
  BookMarked,
  Contact,
  Calendar,
  Clock,
  Video,
  FileText,
  Shield,
  Sliders,
  BarChart,
  Bell,
  Volume2,
  FolderTree,
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

interface SidebarProps {
  isMobile: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

export function Sidebar({ isMobile, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const platformNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Institutes', href: '/dashboard/institutes', icon: Building2 },
    { name: 'Tenant Admins', href: '/dashboard/tenant-admins', icon: Users },
    { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: DollarSign },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const tenantNavigation: { category: string; items: NavItem[] }[] = [
    {
      category: '',
      items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      category: 'Organization',
      items: [
        { name: 'Branches', href: '/tenant-admin/branches', icon: Building2 },
        { name: 'Academic Years', href: '/tenant-admin/academic-years', icon: Calendar },
        {
          name: 'People',
          href: '#',
          icon: Users,
          children: [
            { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
            { name: 'Parents', href: '#', icon: Contact },
            { name: 'Staff / Tutors', href: '/dashboard/tutors', icon: BookMarked },
          ],
        },
      ],
    },
    {
      category: 'Academics',
      items: [
        { name: 'Curriculum', href: '/tenant-admin/curriculum', icon: FolderTree },
        { name: 'Batches', href: '/dashboard/batches', icon: Layers },
        { name: 'Examinations', href: '#', icon: Target },
        {
          name: 'Learning',
          href: '#',
          icon: BookMarked,
          children: [
            { name: 'Study Materials', href: '#', icon: FileText },
            { name: 'Assignments', href: '#', icon: FileText },
            { name: 'Learning Progress', href: '#', icon: TrendingUp },
          ],
        },
      ],
    },
    {
      category: 'Schedule',
      items: [
        { name: 'Timetable', href: '/dashboard/timetable', icon: Clock },
        { name: 'Calendar', href: '#', icon: Calendar },
        { name: 'Events', href: '#', icon: Target },
        { name: 'Google Calendar', href: '#', icon: Calendar },
      ],
    },
    {
      category: 'Operations',
      items: [
        { name: 'Attendance', href: '#', icon: Calendar },
        { name: 'Live Classes', href: '#', icon: Video },
        { name: 'Recordings', href: '#', icon: FileText },
      ],
    },
    {
      category: 'Finance',
      items: [{ name: 'Fees & Billing', href: '#', icon: DollarSign }],
    },
    {
      category: 'Communication',
      items: [
        { name: 'Announcements', href: '#', icon: Volume2 },
        { name: 'Notifications', href: '#', icon: Bell },
      ],
    },
    {
      category: 'Analytics',
      items: [{ name: 'Analytics', href: '#', icon: BarChart }],
    },
    {
      category: 'Settings',
      items: [
        { name: 'Roles & Permissions', href: '#', icon: Shield },
        { name: 'Institute Settings', href: '#', icon: Building2 },
        { name: 'System Configuration', href: '#', icon: Sliders },
      ],
    },
  ];

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
                className={cn(
                  'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                  isCollapsed && 'justify-center',
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(depth === 0 ? 'h-5 w-5' : 'h-4 w-4', 'flex-shrink-0')}
                  aria-hidden="true"
                />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>

              {!isCollapsed && (
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
              )}
            </div>

            {isSubOpen && !isCollapsed && (
              <div
                className={cn(
                  'space-y-1 border-l border-gray-100 dark:border-gray-800',
                  depth === 0 ? 'pl-4 ml-4' : 'pl-3 ml-3',
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
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
            isCollapsed && 'justify-center',
          )}
          aria-current={isActive ? 'page' : undefined}
          title={isCollapsed ? item.name : undefined}
        >
          <Icon
            className={cn(depth === 0 ? 'h-5 w-5' : 'h-4 w-4', 'flex-shrink-0')}
            aria-hidden="true"
          />
          {!isCollapsed && <span>{item.name}</span>}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-xl text-primary"
            >
              <span className="hidden sm:inline">NEET Platform</span>
              <span className="sm:hidden">NP</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto" aria-label="Main navigation">
          {user?.roleCode === 'PLATFORM_ADMIN' ? (
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
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                      isCollapsed && 'justify-center',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {tenantNavigation.map((group, groupIdx) => {
                const isGroupOpen = group.category
                  ? (openCategories[group.category] ?? true)
                  : true;
                return (
                  <div key={groupIdx} className="space-y-1">
                    {group.category && !isCollapsed ? (
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

                    {isGroupOpen && <div className="space-y-1">{renderNavItems(group.items)}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && user && (
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

          {!isCollapsed ? (
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
          ) : (
            <div className="space-y-1 mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-full justify-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => logout()}
                title="Sign out"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          )}
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
