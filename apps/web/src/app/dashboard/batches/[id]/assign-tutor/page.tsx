'use client';

import { useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  UserCheck,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
  CheckCircle2,
  Layers,
  School,
} from 'lucide-react';
import { useBatch, useAssignStaff } from '@/features/batches/hooks/use-batches';
import { useTutors } from '@/features/tutors/hooks/use-tutors';
import { useCourseSubjects } from '@/features/master-data/hooks/use-course-subjects';
import { BatchSkeleton } from '@/features/batches/components/BatchSkeleton';
import { BatchEmptyState } from '@/features/batches/components/BatchEmptyState';
import { toast } from 'sonner';

function AssignTutorContent() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Fetch batch details
  const { batch, isLoading: batchLoading, error } = useBatch(batchId);

  // Fetch tutors list
  const { data: tutorsData, isLoading: tutorsLoading } = useTutors({ limit: 100 });
  const tutors = tutorsData?.data ?? [];

  // Fetch course subjects list
  const { data: courseSubjects = [], isLoading: subjectsLoading } = useCourseSubjects(
    batch?.courseId ?? '',
  );

  const assignMutation = useAssignStaff();

  // Auto-fetch & select subject when tutor is selected
  const handleTutorChange = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    const tutorObj = tutors.find((t) => t.id === tutorId);

    if (tutorObj?.subjects && tutorObj.subjects.length > 0) {
      const tutorSubjectIds = tutorObj.subjects.map((s) => s.subjectId);
      const matched = courseSubjects.find((cs: any) => tutorSubjectIds.includes(cs.subjectId));
      if (matched) {
        setSelectedSubjectId(matched.subjectId);
        return;
      }
    }

    if (courseSubjects.length > 0 && courseSubjects[0]?.subjectId) {
      setSelectedSubjectId(courseSubjects[0].subjectId);
    }
  };

  const handleAssignTutor = async () => {
    if (!selectedTutorId || !selectedSubjectId) {
      toast.error('Please select both a faculty tutor and a subject.');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        batchId,
        staffProfileId: selectedTutorId,
        subjectId: selectedSubjectId,
      });

      toast.success('Tutor assigned successfully to this batch!');
      router.push(`/dashboard/batches/${batchId}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign tutor.');
    }
  };

  const isLoading = batchLoading || tutorsLoading || subjectsLoading;

  if (batchLoading) {
    return (
      <div className="p-6">
        <BatchSkeleton variant="card" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BatchEmptyState hasFilters={false} variant="default" />
        <Button
          variant="outline"
          className="rounded-xl h-11 mt-4"
          onClick={() => router.push('/dashboard/batches')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batches
        </Button>
      </div>
    );
  }

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);
  const selectedSubject = courseSubjects.find((cs: any) => cs.subjectId === selectedSubjectId);

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Signature Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-purple-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20"
                onClick={() => router.push(`/dashboard/batches/${batchId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Faculty Mapping
              </div>
            </div>

            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Assign Tutor to {batch.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-purple-100/90 font-medium">
                <span className="bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 font-mono text-xs">
                  {batch.code}
                </span>
                <span>&bull;</span>
                <span>{batch.courseName}</span>
                <span>&bull;</span>
                <span>{batch.branchName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Professional Form Page */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="rounded-3xl border-purple-100/80 bg-white/90 backdrop-blur-md shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-100 text-violet-700 border border-violet-200">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Select Faculty Tutor & Subject
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Link a faculty tutor to teach a syllabus subject for this batch.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
                <p className="text-sm font-semibold text-gray-600">
                  Loading tutors and subjects...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faculty Tutor Selection Card */}
                <div className="space-y-3 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-all">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-violet-600" />
                    Select Faculty Tutor *
                  </Label>
                  <Select value={selectedTutorId} onValueChange={handleTutorChange}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus-visible:ring-violet-600 bg-white text-sm font-medium">
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

                  {selectedTutor && (
                    <div className="mt-3 p-3 rounded-xl bg-violet-50/80 border border-violet-100 text-xs space-y-1">
                      <p className="font-bold text-violet-950">
                        {selectedTutor.firstName} {selectedTutor.lastName}
                      </p>
                      <p className="text-violet-700">{selectedTutor.email}</p>
                      {selectedTutor.employeeCode && (
                        <span className="inline-block bg-violet-200/60 text-violet-900 font-mono text-[10px] px-2 py-0.5 rounded-md mt-1 font-semibold">
                          Code: {selectedTutor.employeeCode}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject Selection Card */}
                <div className="space-y-3 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-all">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    Select Subject / Syllabus *
                  </Label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus-visible:ring-violet-600 bg-white text-sm font-medium">
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

                  {selectedSubject && (
                    <div className="mt-3 p-3 rounded-xl bg-purple-50/80 border border-purple-100 text-xs space-y-1">
                      <p className="font-bold text-purple-950">
                        {(selectedSubject as any).subject?.name || 'Selected Subject'}
                      </p>
                      <p className="text-purple-700">
                        Subject Code: {(selectedSubject as any).subject?.code || '—'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation & Summary */}
            {selectedTutorId && selectedSubjectId && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-900">
                  Ready to assign{' '}
                  <span className="font-bold">
                    {selectedTutor?.firstName} {selectedTutor?.lastName}
                  </span>{' '}
                  to teach{' '}
                  <span className="font-bold">{(selectedSubject as any)?.subject?.name}</span> in{' '}
                  {batch.name}.
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                className="rounded-2xl h-11 px-6 font-semibold border-slate-200 hover:bg-slate-100"
                onClick={() => router.push(`/dashboard/batches/${batchId}`)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignTutor}
                disabled={!selectedTutorId || !selectedSubjectId || assignMutation.isPending}
                className="rounded-2xl h-11 px-8 shadow-lg shadow-violet-600/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold gap-2 border-none transition-all disabled:opacity-50"
              >
                {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Assign Tutor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AssignTutorPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <AssignTutorContent />
      </Suspense>
    </DashboardLayout>
  );
}
