'use client';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import type {
  AdmissionCourse,
  AdmissionBranch,
  AdmissionBatch,
  AdmissionListItem,
} from '@/features/admissions/types/admission';
import { useCheckEnrollmentConflict } from '@/features/scheduling/hooks/use-schedules';
import { ConflictResult } from '@/features/scheduling/types/schedule.types';

interface EnrollCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: AdmissionCourse[];
  branches: AdmissionBranch[];
  batches: AdmissionBatch[];
  years: { id: string; name: string }[];
  branchCourses?: { id: string; branchId: string; courseId: string; academicYearId: string }[];
  activeEnrollments?: AdmissionListItem[];
  onConfirm: (data: {
    courseId: string;
    batchId: string;
    branchId: string;
    academicYearId: string;
    admissionDate: string;
    notes?: string;
  }) => void;
  isSubmitting?: boolean;
  onCourseChange: (courseId: string) => void;
  onBranchChange?: (branchId: string) => void;
  studentProfileId?: string;
}

export function EnrollCourseModal({
  open,
  onOpenChange,
  courses,
  branches,
  batches,
  years,
  branchCourses = [],
  activeEnrollments = [],
  onConfirm,
  isSubmitting = false,
  onCourseChange,
  onBranchChange,
  studentProfileId,
}: EnrollCourseModalProps) {
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);

  // Check if they are already mapped to this specific batch or course
  const existingBatchMatch = activeEnrollments.find(
    (e) => e.admissionStatus === 'ACTIVE' && e.batchId === batchId && batchId !== '',
  );
  const existingCourseMatch = activeEnrollments.find(
    (e) => e.admissionStatus === 'ACTIVE' && e.courseId === courseId && courseId !== '',
  );

  const duplicateError = existingBatchMatch
    ? `This student is already enrolled in batch: ${existingBatchMatch.batchName}`
    : existingCourseMatch
      ? `This student is already enrolled in course: ${existingCourseMatch.courseName}`
      : null;

  const { mutate: runCheck, isPending: checking } = useCheckEnrollmentConflict();

  // Reset form fields on dialog open/close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCourseId('');
      setBatchId('');
      setBranchId('');
      setAcademicYearId('');
      setNotes('');
      setConflictResult(null);
    }
    onOpenChange(isOpen);
  };

  const handleAcademicYearChange = (newYearId: string) => {
    setAcademicYearId(newYearId);
    setBranchId('');
    setCourseId('');
    setBatchId('');
    onCourseChange('');
    if (onBranchChange) {
      onBranchChange('');
    }
  };

  const handleBranchChange = (newBranchId: string) => {
    setBranchId(newBranchId);
    setCourseId('');
    setBatchId('');
    onCourseChange('');
    if (onBranchChange) {
      onBranchChange(newBranchId);
    }
  };

  // Run conflict check when batch selection is made
  useEffect(() => {
    if (open && batchId && studentProfileId) {
      runCheck(
        {
          studentProfileId,
          newBatchId: batchId,
        },
        {
          onSuccess: (result) => {
            setConflictResult(result);
          },
        },
      );
    } else {
      setConflictResult(null);
    }
  }, [batchId, open, studentProfileId, runCheck]);

  // 1. Filter branches based on selected academic year mapping config in db
  const filteredBranches = branches.filter((branch) => {
    if (!academicYearId) return true;
    return branchCourses.some(
      (mapping) => mapping.academicYearId === academicYearId && mapping.branchId === branch.id,
    );
  });

  // 2. Filter courses based on selected branch, academic year, and branchCourses mappings
  const filteredCourses = courses.filter((course) => {
    if (!branchId) return true;
    return branchCourses.some(
      (mapping) =>
        mapping.branchId === branchId &&
        mapping.courseId === course.id &&
        (!academicYearId || mapping.academicYearId === academicYearId),
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !batchId || !branchId || !academicYearId) {
      toast({
        title: 'Validation Error',
        description: 'Please select all required academic fields.',
        variant: 'destructive',
      });
      return;
    }
    onConfirm({
      courseId,
      batchId,
      branchId,
      academicYearId,
      admissionDate,
      notes,
    });
  };

  const hasConflict = conflictResult?.hasConflict ?? false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-0 overflow-hidden border border-slate-200 shadow-xl">
        {/* ISML LMS Style Light Blue Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 border-b border-blue-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5 text-[#0052CC]" />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-mono font-extrabold text-[#0052CC] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                COURSE ENROLLMENT
              </span>
            </div>
            <DialogTitle className="text-base font-extrabold text-[#0B2447] leading-snug">
              Enroll Student in New Course
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium mt-0.5">
              Assign a new course, campus branch, academic year, and target batch.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academic Year select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Academic Year *
              </label>
              <select
                value={academicYearId}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0B2447] focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              >
                <option value="">Select Academic Year</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Campus Branch *
              </label>
              <select
                value={branchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                required
                disabled={!academicYearId}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0B2447] focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                <option value="">{academicYearId ? 'Select Branch' : 'Select year first'}</option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Course Track *
              </label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setBatchId('');
                  onCourseChange(e.target.value);
                }}
                required
                disabled={!branchId}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0B2447] focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                <option value="">{branchId ? 'Select Course' : 'Select branch first'}</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Target Batch *
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                disabled={!courseId}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0B2447] focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Admission Date *
            </label>
            <input
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0B2447] focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            />
          </div>

          {/* Duplicate Course/Batch Warning */}
          {duplicateError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Already Mapped
              </p>
              <p className="text-[11px] font-semibold text-rose-700/90 leading-relaxed">
                {duplicateError}
              </p>
            </div>
          )}

          {/* Conflict status loader */}
          {checking && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-slate-500 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0052CC]" />
              <span>Checking timetable compatibility...</span>
            </div>
          )}

          {/* Conflict warnings */}
          {!checking && !duplicateError && hasConflict && conflictResult && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Timetable Conflict Warning
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-700/90 pl-1">
                {conflictResult.conflicts.map((c, i) => (
                  <li key={i} className="leading-relaxed">
                    {c.message}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-600 font-semibold pt-1">
                Enrolling the student into this batch will overlap with their existing timetable.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3 border-t border-slate-100 mt-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs px-4"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || checking}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                'rounded-xl h-10 text-white font-extrabold text-xs px-5 shadow-2xs transition-all',
                duplicateError
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : hasConflict
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-[#0052CC] hover:bg-blue-700',
              )}
              disabled={
                isSubmitting ||
                checking ||
                !!duplicateError ||
                !courseId ||
                !batchId ||
                !branchId ||
                !academicYearId
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : duplicateError ? (
                'Already Enrolled'
              ) : hasConflict ? (
                'Enroll Anyway'
              ) : (
                'Enroll Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
