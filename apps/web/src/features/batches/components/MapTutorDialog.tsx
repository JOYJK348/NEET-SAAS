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
import { Loader2, UserCheck, BookOpen, GraduationCap, Plus } from 'lucide-react';
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
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white text-[#0F172A] font-sans">
        {/* ISML LMS Light Blue Header Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-5 text-slate-900 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <UserCheck className="h-5 w-5 text-[#0052CC]" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold tracking-tight text-[#0B2447]">
                Assign Faculty Tutor
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Link a tutor faculty member to teach a subject in this batch.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#0052CC] mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Loading tutors and subjects...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tutor Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <GraduationCap className="h-3.5 w-3.5 text-[#0052CC]" />
                  Select Tutor Faculty *
                </Label>
                <Select value={selectedTutorId} onValueChange={setSelectedTutorId}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 bg-white text-xs font-semibold text-[#0B2447]">
                    <SelectValue placeholder="Select faculty tutor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60 bg-white">
                    {tutors.map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id} className="text-xs font-medium">
                        {tutor.firstName} {tutor.lastName} ({tutor.employeeCode || 'No Code'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="h-3.5 w-3.5 text-[#0052CC]" />
                  Select Subject *
                </Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 bg-white text-xs font-semibold text-[#0B2447]">
                    <SelectValue placeholder="Select syllabus subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60 bg-white">
                    {courseSubjects.map((cs: any) => (
                      <SelectItem
                        key={cs.subjectId}
                        value={cs.subjectId}
                        className="text-xs font-medium"
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

        {/* Footer */}
        <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-10 px-4 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMapTutor}
            disabled={!selectedTutorId || !selectedSubjectId || assignMutation.isPending}
            className="rounded-xl h-10 px-5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs gap-1.5 border-none transition-all disabled:opacity-50"
          >
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Assign Tutor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
