'use client';

import { TutorCard } from './TutorCard';

interface TutorListProps {
  tutors: any[];
  subjectMap: Map<string, string>;
  branchMap?: Map<string, string>;
  onView: (tutor: any) => void;
  onEdit?: (tutor: any) => void;
  onDelete?: (tutor: any) => Promise<void> | void;
  onStatusChange: (id: string, status: string) => void;
  isLoading?: boolean;
}

export function TutorList({
  tutors,
  subjectMap,
  branchMap,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}: TutorListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3.5" role="status" aria-label="Loading tutors">
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (tutors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3.5" role="list" aria-label="Tutors list">
      {tutors.map((tutor, index) => (
        <TutorCard
          key={tutor.id ? `${tutor.id}-${index}` : `tutor-card-${index}`}
          tutor={tutor}
          subjectMap={subjectMap}
          branchMap={branchMap}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
