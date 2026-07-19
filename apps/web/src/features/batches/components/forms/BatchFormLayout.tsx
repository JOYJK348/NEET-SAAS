'use client';

import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface BatchFormLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function BatchFormLayout({ title, description, children, className }: BatchFormLayoutProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
