'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileX, SearchX, FilterX, Plus } from 'lucide-react';
import Link from 'next/link';

interface AdmissionEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
  variant?: 'default' | 'search' | 'filter';
}

export function AdmissionEmptyState({
  hasFilters = false,
  onClearFilters,
  className,
  variant = 'default',
}: AdmissionEmptyStateProps) {
  const config = {
    default: {
      icon: FileX,
      title: 'No admissions yet',
      description: 'Start by creating a new admission for a student.',
      action: (
        <Link href="/dashboard/admissions/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 px-6">
            <Plus className="h-4 w-4 mr-2" />
            New Admission
          </Button>
        </Link>
      ),
    },
    search: {
      icon: SearchX,
      title: 'No results found',
      description: 'Try adjusting your search terms or filters.',
      action: null,
    },
    filter: {
      icon: FilterX,
      title: 'No matching admissions',
      description: 'Try changing or clearing your filters.',
      action: onClearFilters ? (
        <Button variant="outline" className="rounded-xl h-11" onClick={onClearFilters}>
          <FilterX className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      ) : null,
    },
  };

  const { icon: Icon, title, description, action } = hasFilters ? config.filter : config[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
