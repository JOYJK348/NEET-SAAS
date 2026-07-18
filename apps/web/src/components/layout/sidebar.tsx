'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
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
  TrendingUp,
  Megaphone,
  BookMarked,
  Contact,
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

export function Sidebar({ isMobile, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation =
    user?.roleCode === 'PLATFORM_ADMIN'
      ? [
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Institutes', href: '/dashboard/institutes', icon: Building2 },
          { name: 'Tenant Admins', href: '/dashboard/tenant-admins', icon: Users },
          { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: DollarSign },
          { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
      : [
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Students', href: '/dashboard/students', icon: Users },
          { name: 'Admissions', href: '/dashboard/admissions', icon: Target },
          { name: 'Parents', href: '/dashboard/parents', icon: Contact },
          { name: 'Tutors', href: '/dashboard/tutors', icon: GraduationCap },
          { name: 'Academics', href: '/dashboard/academics', icon: BookOpen },
          { name: 'Mock Tests', href: '/dashboard/mock-tests', icon: Target },
          { name: 'Study Materials', href: '/dashboard/study-materials', icon: BookMarked },
          { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
          { name: 'Billing', href: '/dashboard/billing', icon: DollarSign },
          { name: 'Reports & Analytics', href: '/dashboard/reports', icon: TrendingUp },
          { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ];

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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navigation.map((item) => {
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
