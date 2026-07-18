'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookOpen, Clock } from 'lucide-react';
import type { AdmissionCourse } from '@/features/admissions/types/admission';

interface SelectCourseStepProps {
  courses: AdmissionCourse[];
  selectedCourseId: string;
  onSelect: (courseId: string) => void;
  error?: string;
}

export function SelectCourseStep({
  courses,
  selectedCourseId,
  onSelect,
  error,
}: SelectCourseStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Course</Label>
        <p className="text-sm text-gray-500 mb-3">Choose the course the student will enroll in.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className={cn(
              'cursor-pointer border transition-all hover:border-purple-300',
              selectedCourseId === course.id && 'border-purple-500 ring-1 ring-purple-500',
            )}
            onClick={() => onSelect(course.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{course.name}</p>
                  {course.code && <p className="text-xs text-gray-500">{course.code}</p>}
                </div>
              </div>
              {course.duration && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
