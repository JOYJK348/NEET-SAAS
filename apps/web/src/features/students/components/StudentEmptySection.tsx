'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Inbox, Plus, AlertCircle } from 'lucide-react';

interface StudentEmptySectionProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'info' | 'warning';
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-muted/30',
    border: 'border-dashed border-[#E5E7EB]',
    iconColor: 'text-muted-foreground',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-400',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-400',
  },
};

export function StudentEmptySection({
  title = 'No data available',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
  icon,
  variant = 'default',
  className,
}: StudentEmptySectionProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-8 sm:p-10 text-center',
        styles.bg,
        styles.border,
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3',
          styles.bg,
        )}
      >
        {icon ||
          (variant === 'warning' ? (
            <AlertCircle className={cn('h-6 w-6', styles.iconColor)} />
          ) : (
            <Inbox className={cn('h-6 w-6', styles.iconColor)} />
          ))}
      </div>
      <h3 className="text-sm font-semibold text-[#111827] mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4 gap-1.5">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
