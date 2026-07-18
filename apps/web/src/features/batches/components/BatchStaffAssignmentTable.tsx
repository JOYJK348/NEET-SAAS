'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { BatchSectionHeader } from './BatchSectionHeader';
import { TableSkeleton } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { formatBatchDate } from '@/features/batches/utils/batch-utils';
import type { BatchStaffAssignment } from '@/features/batches/types/batch';

interface BatchStaffAssignmentTableProps {
  assignments: BatchStaffAssignment[];
  isLoading?: boolean;
  className?: string;
}

export function BatchStaffAssignmentTable({
  assignments,
  isLoading,
  className,
}: BatchStaffAssignmentTableProps) {
  if (isLoading) {
    return (
      <Card className={cn('border border-gray-200', className)}>
        <CardContent className="p-4 lg:p-5">
          <BatchSectionHeader
            title="Staff Assignments"
            description="Staff assigned to this batch"
          />
          <TableSkeleton rows={4} columns={5} />
        </CardContent>
      </Card>
    );
  }

  if (!assignments?.length) {
    return (
      <Card className={cn('border border-gray-200', className)}>
        <CardContent className="p-4 lg:p-5">
          <BatchSectionHeader
            title="Staff Assignments"
            description="Staff assigned to this batch"
          />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Briefcase className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No staff assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5">
        <BatchSectionHeader title="Staff Assignments" description="Staff assigned to this batch" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {assignment.staffName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{assignment.subject}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatBatchDate(assignment.effectiveFrom)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {assignment.effectiveTo ? formatBatchDate(assignment.effectiveTo) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {assignment.isActive ? (
                      <Badge variant="success" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
