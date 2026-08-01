'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ChildSwitcherProvider } from '@/features/parent-portal/context/child-switcher-context';

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChildSwitcherProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ChildSwitcherProvider>
  );
}
