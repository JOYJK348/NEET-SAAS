'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import type { BatchDeliveryType } from '../../types';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DeliveryTypeTableProps {
  types: BatchDeliveryType[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onEdit: (type: BatchDeliveryType) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function DeliveryTypeTable({
  types,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onSetDefault,
}: DeliveryTypeTableProps) {
  const columns: Column<BatchDeliveryType>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (_, t) => <span className="font-medium text-gray-900 dark:text-white">{t.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, t) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
          {t.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'attendanceMode',
      header: 'Attendance Mode',
      sortable: true,
      render: (_, t) => (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
          {t.attendanceMode}
        </span>
      ),
    },
    {
      key: 'defaultMaxStudents',
      header: 'Max Students',
      sortable: true,
      render: (_, t) => (
        <span className="text-gray-600 dark:text-gray-300">{t.defaultMaxStudents}</span>
      ),
    },
    {
      key: 'isDefault',
      header: 'Default Status',
      sortable: true,
      render: (_, t) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            t.isDefault
              ? 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-500/20'
              : 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
          )}
        >
          {t.isDefault ? 'Default' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, t) => (
        <div className="flex items-center gap-2">
          {!t.isDefault && (
            <button
              onClick={() => onSetDefault(t.id)}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors"
              title="Set as Default Delivery Type"
            >
              <ShieldCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(t)}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={`Edit ${t.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(t.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            aria-label={`Delete ${t.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-32',
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
          {types.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-4 text-sm', col.className)}>
                  {col.render
                    ? col.render(t[col.key as keyof BatchDeliveryType], t)
                    : String(t[col.key as keyof BatchDeliveryType] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
