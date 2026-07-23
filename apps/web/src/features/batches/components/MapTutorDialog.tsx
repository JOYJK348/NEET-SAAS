'use client';

import { useState } from 'react';
import { useTutors } from '@/features/tutors/hooks/use-tutors';
import { useCourseSubjects } from '@/features/master-data/hooks/use-course-subjects';
import { useAssignStaff } from '@/features/batches/hooks/use-batches';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCheck, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface MapTutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  courseId: string;
}

export function MapTutorDialog({ open, onOpenChange, batchId, courseId }: MapTutorDialogProps) {
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Fetch tutors list
  const { data: tutorsData, isLoading: tutorsLoading } = useTutors({ limit: 100 });
  const tutors = tutorsData?.data ?? [];

  // Fetch course subjects list
  const { data: courseSubjects = [], isLoading: subjectsLoading } = useCourseSubjects(courseId);

  const assignMutation = useAssignStaff();

  const handleMapTutor = async () => {
    if (!selectedTutorId || !selectedSubjectId) {
      toast.error('Please select both a tutor and a subject.');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        batchId,
        staffProfileId: selectedTutorId,
        subjectId: selectedSubjectId,
      });

      toast.success('Tutor mapped successfully to this batch!');
      setSelectedTutorId('');
      setSelectedSubjectId('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to map tutor.');
    }
  };

  const isLoading = tutorsLoading || subjectsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        {/* Modern Premium Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Assign Tutor</DialogTitle>
              <DialogDescription className="text-xs text-violet-100/90 mt-0.5">
                Link a tutor faculty member to teach a subject in this batch
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-violet-600 mb-2" />
              <p className="text-xs font-medium text-gray-500">
                Loading tutors and subjects data...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tutor Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
                  Select Tutor Faculty *
                </Label>
                <Select value={selectedTutorId} onValueChange={setSelectedTutorId}>
                  <SelectTrigger className="h-11 rounded-2xl border-gray-200 focus-visible:ring-violet-600 hover:bg-gray-50/50 transition-all">
                    <SelectValue placeholder="Select faculty tutor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-60">
                    {tutors.map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id} className="rounded-xl my-0.5">
                        {tutor.firstName} {tutor.lastName} ({tutor.employeeCode || 'No Code'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                  Select Subject *
                </Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="h-11 rounded-2xl border-gray-200 focus-visible:ring-violet-600 hover:bg-gray-50/50 transition-all">
                    <SelectValue placeholder="Select syllabus subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-60">
                    {courseSubjects.map((cs: any) => (
                      <SelectItem
                        key={cs.subjectId}
                        value={cs.subjectId}
                        className="rounded-xl my-0.5"
                      >
                        {cs.subject?.name || 'Subject'} ({cs.subject?.code || '—'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <DialogFooter className="bg-gray-50/70 p-6 border-t border-gray-100 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="rounded-2xl h-11 px-5 text-sm font-semibold hover:bg-gray-200 transition-all"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMapTutor}
            disabled={!selectedTutorId || !selectedSubjectId || assignMutation.isPending}
            className="rounded-2xl h-11 px-6 shadow-lg shadow-violet-600/25 bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2 border-none transition-all disabled:opacity-50"
          >
            {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Assign Tutor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
