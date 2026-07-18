'use client';

import { StudentCard } from './StudentCard';

interface StudentListProps {
  students: any[];
  onView: (student: any) => void;
  onEdit: (student: any) => void;
  onStatusChange: (student: any, status: any) => void;
  onPrefetch?: (id: string) => void;
  isLoading?: boolean;
}

export function StudentList({
  students,
  onView,
  onEdit,
  onStatusChange,
  onPrefetch,
  isLoading = false,
}: StudentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading students">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" role="list" aria-label="Students list">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onView={onView}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onPrefetch={onPrefetch}
        />
      ))}
    </div>
  );
}
