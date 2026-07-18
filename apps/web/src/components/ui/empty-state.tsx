'use client';

import { Inbox, Plus, Search, Filter, FileText, Users, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-800">
        {icon || <Inbox className="h-8 w-8 text-gray-400" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">{description}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.icon || <Plus className="h-4 w-4" aria-hidden="true" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyStudents({ onAdd, onImport }: { onAdd?: () => void; onImport?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-gray-400" aria-hidden="true" />}
      title="No students found"
      description="Get started by adding your first student or import from a spreadsheet."
      action={
        onAdd
          ? { label: 'Add Student', onClick: onAdd, icon: <Plus className="h-4 w-4" /> }
          : undefined
      }
      secondaryAction={onImport ? { label: 'Import CSV', onClick: onImport } : undefined}
    />
  );
}

export function EmptyBatches({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="h-8 w-8 text-gray-400" aria-hidden="true" />}
      title="No batches created"
      description="Create your first batch to start organizing students into groups."
      action={
        onCreate
          ? { label: 'Create Batch', onClick: onCreate, icon: <Plus className="h-4 w-4" /> }
          : undefined
      }
    />
  );
}

export function EmptyFees({ onRecord }: { onRecord?: () => void }) {
  return (
    <EmptyState
      icon={<DollarSign className="h-8 w-8 text-gray-400" aria-hidden="true" />}
      title="No fee records"
      description="Record fee payments to track student financials."
      action={
        onRecord
          ? { label: 'Record Payment', onClick: onRecord, icon: <Plus className="h-4 w-4" /> }
          : undefined
      }
    />
  );
}

export function EmptyAttendance({ onMark }: { onMark?: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-8 w-8 text-gray-400" aria-hidden="true" />}
      title="No attendance records"
      description="Mark attendance for your batches to track student presence."
      action={
        onMark
          ? { label: 'Mark Attendance', onClick: onMark, icon: <Plus className="h-4 w-4" /> }
          : undefined
      }
    />
  );
}

export function EmptySearch({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-8 w-8 text-gray-400" aria-hidden="true" />}
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
      action={
        onClearFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
              icon: <Filter className="h-4 w-4" />,
            }
          : undefined
      }
    />
  );
}

export function EmptyGeneric({
  title = 'No data available',
  description = "There's nothing here yet.",
  action,
}: EmptyStateProps) {
  return <EmptyState title={title} description={description} action={action} />;
}
