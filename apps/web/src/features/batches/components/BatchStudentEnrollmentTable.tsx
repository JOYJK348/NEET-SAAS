'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { BatchSectionHeader } from './BatchSectionHeader';
import { TableSkeleton } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { formatBatchDate } from '@/features/batches/utils/batch-utils';
import type { BatchStudentEnrollment } from '@/features/batches/types/batch';

interface BatchStudentEnrollmentTableProps {
  students: BatchStudentEnrollment[];
  isLoading?: boolean;
  className?: string;
}

export function BatchStudentEnrollmentTable({
  students,
  isLoading,
  className,
}: BatchStudentEnrollmentTableProps) {
  if (isLoading) {
    return (
      <Card className={cn('border border-gray-200', className)}>
        <CardContent className="p-4 lg:p-5">
          <BatchSectionHeader title="Enrolled Students" description="Students in this batch" />
          <TableSkeleton rows={4} columns={6} />
        </CardContent>
      </Card>
    );
  }

  if (!students?.length) {
    return (
      <Card className={cn('border border-gray-200', className)}>
        <CardContent className="p-4 lg:p-5">
          <BatchSectionHeader title="Enrolled Students" description="Students in this batch" />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No students enrolled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5">
        <BatchSectionHeader title="Enrolled Students" description="Students in this batch" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Primary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {student.studentName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatBatchDate(student.joinedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {student.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {student.isPrimary ? (
                      <Badge variant="success" className="text-xs">
                        Primary
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
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
