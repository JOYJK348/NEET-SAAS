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
        <main className={cn('p-4 lg:p-6 pb-6', 'transition-all duration-300')}>
          {children}
        </main>
      </div>
    </div>
  );
}
