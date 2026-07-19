'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2 } from 'lucide-react';
import type { Subject } from '../../types';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface SubjectTableProps {
  subjects: Subject[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

export function SubjectTable({
  subjects,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: SubjectTableProps) {
  const columns: Column<Subject>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, subject) => (
        <span className="font-medium text-gray-900 dark:text-white">{subject.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, subject) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{subject.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subject.displayName}</p>
        </div>
      ),
    },
    {
      key: 'shortName',
      header: 'Short Name',
      sortable: true,
      render: (_, subject) => (
        <span className="text-gray-600 dark:text-gray-300">{subject.shortName || '-'}</span>
      ),
    },
    {
      key: 'subjectType',
      header: 'Type',
      sortable: true,
      render: (_, subject) => (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
          {subject.subjectType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (_, subject) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            subject.isActive
              ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-500/20'
              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20',
          )}
        >
          {subject.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, subject) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(subject)}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`Edit ${subject.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(subject.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            aria-label={`Delete ${subject.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  const handleSort = (key: string) => {
    if (onSort && columns.find((c) => c.key === key)?.sortable) {
      onSort(key);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortBy !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <table className="w-full min-w-[800px]" role="table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  col.sortable &&
                    'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none',
                  col.className,
                )}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={col.key} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {subjects.map((subject) => (
            <tr
              key={subject.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-4 text-sm', col.className)}>
                  {col.render
                    ? col.render(subject[col.key as keyof Subject], subject)
                    : String(subject[col.key as keyof Subject] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
