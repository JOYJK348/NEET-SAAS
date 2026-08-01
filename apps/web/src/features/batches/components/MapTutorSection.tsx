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
import {
  Loader2,
  UserCheck,
  BookOpen,
  GraduationCap,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
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
    <Card className="border border-violet-100/80 bg-white/90 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden transition-all">
      {/* Modern Premium Banner Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-5 sm:p-6 text-white relative">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Assign Tutor / Faculty Member
              </h3>
              <p className="text-xs sm:text-sm text-violet-100/90 font-medium mt-0.5">
                Link a faculty tutor to teach a specific subject in this batch
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
            <p className="text-sm font-semibold text-gray-600">
              Loading tutors and subjects data...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tutor Selection Card */}
            <div className="space-y-2.5 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50/80 transition-all">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-violet-600" />
                Select Faculty Tutor *
              </Label>
              <Select value={selectedTutorId} onValueChange={handleTutorChange}>
                <SelectTrigger className="h-12 rounded-2xl border-gray-200 focus-visible:ring-violet-600 bg-white text-sm">
                  <SelectValue placeholder="Choose tutor from faculty list..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  {tutors.map((tutor) => (
                    <SelectItem
                      key={tutor.id}
                      value={tutor.id}
                      className="rounded-xl my-0.5 text-sm"
                    >
                      {tutor.firstName} {tutor.lastName}{' '}
                      {tutor.employeeCode ? `(${tutor.employeeCode})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-400">
                Choose the registered tutor faculty for this assignment.
              </p>
            </div>

            {/* Subject Selection Card */}
            <div className="space-y-2.5 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50/80 transition-all">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                Select Subject / Syllabus *
              </Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="h-12 rounded-2xl border-gray-200 focus-visible:ring-violet-600 bg-white text-sm">
                  <SelectValue placeholder="Choose subject taught in this course..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  {courseSubjects.map((cs: any) => (
                    <SelectItem
                      key={cs.subjectId}
                      value={cs.subjectId}
                      className="rounded-xl my-0.5 text-sm"
                    >
                      {cs.subject?.name || 'Subject'}{' '}
                      {cs.subject?.code ? `(${cs.subject.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-400">
                Subject mapped from this batch's course curriculum.
              </p>
            </div>
          </div>
        )}

        {/* Footer Bar with Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span>Fill in both Faculty Tutor and Subject to complete assignment</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onClose && (
              <Button
                variant="outline"
                type="button"
                className="flex-1 sm:flex-initial rounded-2xl h-11 px-5 text-sm font-semibold border-gray-200 hover:bg-gray-100"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleMapTutor}
              disabled={!selectedTutorId || !selectedSubjectId || assignMutation.isPending}
              className="flex-1 sm:flex-initial rounded-2xl h-11 px-6 shadow-lg shadow-violet-600/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold gap-2 border-none transition-all disabled:opacity-50"
            >
              {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign Tutor to Batch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
