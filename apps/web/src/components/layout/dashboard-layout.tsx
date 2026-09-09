'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

import { ChildSwitcherProvider } from '@/features/parent-portal/context/child-switcher-context';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const isPlatformAdmin =
    pathname?.startsWith('/platform-admin') ||
    user?.roleCode === 'PLATFORM_ADMIN' ||
    (user as any)?.userType === 'PLATFORM_ADMIN';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ChildSwitcherProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
        {!isPlatformAdmin && (
          <Sidebar
            isMobile={isMobile}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />
        )}
        <div className={cn('transition-all duration-300 w-full', isPlatformAdmin || isMobile ? 'pl-0' : 'lg:pl-64')}>
          <Header isMobile={isMobile} setIsMobileOpen={setIsMobileOpen} />
          <main className="p-4 sm:p-6 lg:p-8 pb-12 w-full transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </ChildSwitcherProvider>
  );
}
