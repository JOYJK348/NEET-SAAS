'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Search, Sun, Moon, User, Settings, LogOut, ChevronDown } from 'lucide-react';
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
import { useTheme } from 'next-themes';

interface HeaderProps {
  isMobile: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Header({ isMobile, setIsMobileOpen }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + array.slice(0, index + 1).join('/'),
      isLast: index === array.length - 1,
    }));

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu button and breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button - only show on mobile */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link
              href="/dashboard"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Dashboard
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {crumb.isLast ? (
                  <span className="text-gray-900 dark:text-white font-medium">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 px-3 py-2 text-sm"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="text-gray-500 dark:text-gray-400">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
              <kbd className="text-xs">⌘</kbd>
              <kbd className="text-xs">K</kbd>
            </kbd>
          </Button>
        </div>

        {/* Right side - Theme toggle, Notifications, User menu */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun
              className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              aria-hidden="true"
            />
            <Moon
              className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              aria-hidden="true"
            />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-gray-500">
                No new notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.avatar || undefined}
                    alt={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                  />
                  <AvatarFallback>{user?.firstName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-600 focus:text-red-600 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 lg:hidden">
          <div className="w-full max-w-md mx-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Escape' && setIsSearchOpen(false)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
