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
import { Loader2, AlertTriangle } from 'lucide-react';
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
    if (!academicYearId) return true; // Show all if no year selected
    return branchCourses.some(
      (mapping) => mapping.academicYearId === academicYearId && mapping.branchId === branch.id,
    );
  });

  // 2. Filter courses based on selected branch, academic year, and branchCourses mappings
  const filteredCourses = courses.filter((course) => {
    if (!branchId) return true; // Show all if no branch selected
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
      <DialogContent className="sm:max-w-lg rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Enroll in Course</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Map a new course, batch, branch and academic year to this student directly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          {/* Academic Year select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Academic Year</label>
            <select
              value={academicYearId}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-purple-500 focus:outline-none"
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Branch</label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              required
              disabled={!academicYearId}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {academicYearId ? 'Select Branch' : 'Select academic year first'}
              </option>
              {filteredBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Course</label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setBatchId('');
                onCourseChange(e.target.value);
              }}
              required
              disabled={!branchId}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Batch (Delivery Type)</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
              disabled={!courseId}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Admission Date</label>
            <input
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Duplicate Course/Batch Warning */}
          {duplicateError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Already Mapped
              </p>
              <p className="text-[11px] font-semibold text-red-700/90 leading-relaxed">
                {duplicateError}
              </p>
            </div>
          )}

          {/* Conflict status loader */}
          {checking && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

          <DialogFooter className="gap-2 pt-2 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || checking}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                'rounded-xl h-11 text-white transition-all',
                duplicateError
                  ? 'bg-red-600 hover:bg-red-700'
                  : hasConflict
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-purple-600 hover:bg-purple-700',
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
