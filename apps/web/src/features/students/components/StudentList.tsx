'use client';

import { StudentCard } from './StudentCard';

interface StudentListProps {
  students: any[];
  onView: (student: any) => void;
  onEdit: (student: any) => void;
  onDelete?: (student: any) => void;
  onStatusChange: (student: any, status: any) => void;
  onPrefetch?: (id: string) => void;
  isLoading?: boolean;
}

export function StudentList({
  students,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPrefetch,
  isLoading = false,
}: StudentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3.5" role="status" aria-label="Loading students">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
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
    <div className="space-y-3.5" role="list" aria-label="Students list">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onPrefetch={onPrefetch}
        />
      ))}
    </div>
  );
}
