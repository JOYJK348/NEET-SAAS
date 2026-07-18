'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { AdmissionStudent } from '@/features/admissions/types/admission';

interface SelectStudentStepProps {
  students: AdmissionStudent[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
  error?: string;
}

export function SelectStudentStep({
  students,
  selectedStudentId,
  onSelect,
  error,
}: SelectStudentStepProps) {
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, search]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Student</Label>
        <p className="text-sm text-gray-500 mb-3">Choose the student who will be admitted.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl border-gray-200"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {filteredStudents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No students found</p>
        ) : (
          filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={cn(
                'cursor-pointer border transition-all hover:border-purple-300',
                selectedStudentId === student.id && 'border-purple-500 ring-1 ring-purple-500',
              )}
              onClick={() => onSelect(student.id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-sm font-semibold text-purple-600">
                  {(student.firstName[0] + (student.lastName?.[0] || '')).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                {student.gender && <span className="text-xs text-gray-400">{student.gender}</span>}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
