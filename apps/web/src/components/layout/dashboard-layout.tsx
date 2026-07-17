'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, TrendingUp, Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/dashboard/students', icon: Users },
    { name: 'Academics', href: '/dashboard/academics', icon: BookOpen },
    { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isMobile={isMobile} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className={cn('transition-all duration-300', isMobile ? '' : 'lg:pl-64')}>
        <Header isMobile={isMobile} setIsMobileOpen={setIsMobileOpen} />
        <main className={cn('p-4 lg:p-6 pb-20 lg:pb-6', 'transition-all duration-300')}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 px-2 shadow-lg">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400"
          >
            <Menu className="h-5 w-5 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      )}
    </div>
  );
}
