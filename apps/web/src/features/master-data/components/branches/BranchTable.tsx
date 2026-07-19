'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2 } from 'lucide-react';
import type { Branch } from '../../types';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface BranchTableProps {
  branches: Branch[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
}

export function BranchTable({
  branches,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: BranchTableProps) {
  const columns: Column<Branch>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, branch) => (
        <span className="font-medium text-gray-900 dark:text-white">{branch.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, branch) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{branch.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{branch.displayName}</p>
        </div>
      ),
    },
    {
      key: 'branchType',
      header: 'Type',
      sortable: true,
      render: (_, branch) => (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
          {branch.branchType.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (_, branch) => (
        <div className="text-sm">
          <p className="text-gray-900 dark:text-white">{branch.email}</p>
          <p className="text-gray-500 dark:text-gray-400">{branch.phone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, branch) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            branch.status === 'ACTIVE'
              ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-500/20'
              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20',
          )}
        >
          {branch.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, branch) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(branch)}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`Edit ${branch.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(branch.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            aria-label={`Delete ${branch.name}`}
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
          {branches.map((branch) => (
            <tr
              key={branch.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-4 text-sm', col.className)}>
                  {col.render
                    ? col.render(branch[col.key as keyof Branch], branch)
                    : String(branch[col.key as keyof Branch] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
