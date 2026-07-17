'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit, Archive, Eye, Trash2 } from 'lucide-react';

interface StudentActionBarProps {
  onView?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  canArchive?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function StudentActionBar({
  onView,
  onEdit,
  onArchive,
  onDelete,
  canArchive = true,
  size = 'sm',
  className,
}: StudentActionBarProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {onView && (
        <Button
          variant="ghost"
          size={size}
          onClick={onView}
          className="gap-1.5"
          title="View details"
        >
          <Eye className={iconSize} />
          <span className="sr-only sm:not-sr-only">View</span>
        </Button>
      )}
      {onEdit && (
        <Button
          variant="ghost"
          size={size}
          onClick={onEdit}
          className="gap-1.5"
          title="Edit student"
        >
          <Edit className={iconSize} />
          <span className="sr-only sm:not-sr-only">Edit</span>
        </Button>
      )}
      {onArchive && canArchive && (
        <Button
          variant="ghost"
          size={size}
          onClick={onArchive}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5"
          title="Archive student"
        >
          <Archive className={iconSize} />
          <span className="sr-only sm:not-sr-only">Archive</span>
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size={size}
          onClick={onDelete}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5"
          title="Delete student"
        >
          <Trash2 className={iconSize} />
          <span className="sr-only sm:not-sr-only">Delete</span>
        </Button>
      )}
    </div>
  );
}
