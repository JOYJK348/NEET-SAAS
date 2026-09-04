'use client';

import { useState } from 'react';
import { useTutors } from '@/features/tutors/hooks/use-tutors';
import { useCourseSubjects } from '@/features/master-data/hooks/use-course-subjects';
import { useAssignStaff } from '@/features/batches/hooks/use-batches';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCheck, BookOpen, GraduationCap, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface MapTutorSectionProps {
  batchId: string;
  courseId: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function MapTutorSection({ batchId, courseId, onClose, onSuccess }: MapTutorSectionProps) {
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Fetch tutors list
  const { data: tutorsData, isLoading: tutorsLoading } = useTutors({ limit: 100 });
  const tutors = tutorsData?.data ?? [];

  // Fetch course subjects list
  const { data: courseSubjects = [], isLoading: subjectsLoading } = useCourseSubjects(courseId);

  const assignMutation = useAssignStaff();

  // When tutor is selected, auto-fill subject if tutor has subject assigned or matching subject exists
  const handleTutorChange = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    const tutorObj = tutors.find((t) => t.id === tutorId);

    if (tutorObj?.subjects && tutorObj.subjects.length > 0) {
      // Find matching subject in course subjects
      const tutorSubjectIds = tutorObj.subjects.map((s) => s.subjectId);
      const matched = courseSubjects.find((cs: any) => tutorSubjectIds.includes(cs.subjectId));
      if (matched) {
        setSelectedSubjectId(matched.subjectId);
        return;
      }
    }

    // Auto select from course subjects if available
    if (courseSubjects.length > 0 && courseSubjects[0]?.subjectId) {
      setSelectedSubjectId(courseSubjects[0].subjectId);
    }
  };

  const handleMapTutor = async () => {
    if (!selectedTutorId || !selectedSubjectId) {
      toast.error('Please select both a tutor faculty and a subject.');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        batchId,
        staffProfileId: selectedTutorId,
        subjectId: selectedSubjectId,
      });

      toast.success('Tutor assigned successfully to this batch!');
      setSelectedTutorId('');
      setSelectedSubjectId('');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign tutor.');
    }
  };

  const isLoading = tutorsLoading || subjectsLoading;

  return (
    <Card className="border border-slate-200 bg-white rounded-2xl shadow-2xs overflow-hidden transition-all text-[#0F172A] font-sans">
      {/* ISML LMS Light Blue Header Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-5 border-b border-blue-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="h-5 w-5 text-[#0052CC]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-[#0B2447] flex items-center gap-2">
              Assign Faculty Tutor
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Link a faculty tutor to teach a specific subject in this batch section.
            </p>
          </div>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-[#0052CC] mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Loading faculty tutors & subjects...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tutor Selection Card */}
            <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#0052CC]" />
                Select Faculty Tutor *
              </Label>
              <Select value={selectedTutorId} onValueChange={handleTutorChange}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 bg-white text-xs font-semibold text-[#0B2447]">
                  <SelectValue placeholder="Choose tutor from faculty list..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60 bg-white">
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id} className="text-xs font-medium">
                      {tutor.firstName} {tutor.lastName}{' '}
                      {tutor.employeeCode ? `(${tutor.employeeCode})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400 font-medium">
                Choose the registered tutor faculty for this assignment.
              </p>
            </div>

            {/* Subject Selection Card */}
            <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#0052CC]" />
                Select Subject / Syllabus *
              </Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 bg-white text-xs font-semibold text-[#0B2447]">
                  <SelectValue placeholder="Choose subject taught in this course..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60 bg-white">
                  {courseSubjects.map((cs: any) => (
                    <SelectItem
                      key={cs.subjectId}
                      value={cs.subjectId}
                      className="text-xs font-medium"
                    >
                      {cs.subject?.name || 'Subject'}{' '}
                      {cs.subject?.code ? `(${cs.subject.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400 font-medium">
                Subject mapped from this batch's course curriculum.
              </p>
            </div>
          </div>
        )}

        {/* Footer Bar with Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Fill in both Faculty Tutor and Subject to complete assignment.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onClose && (
              <Button
                variant="outline"
                type="button"
                className="flex-1 sm:flex-initial rounded-xl h-10 px-4 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleMapTutor}
              disabled={!selectedTutorId || !selectedSubjectId || assignMutation.isPending}
              className="flex-1 sm:flex-initial rounded-xl h-10 px-5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs gap-1.5 transition-all disabled:opacity-50"
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Assign Tutor to Batch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
