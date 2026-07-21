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
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type {
  AdmissionCourse,
  AdmissionBranch,
  AdmissionBatch,
} from '@/features/admissions/types/admission';

interface EnrollCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: AdmissionCourse[];
  branches: AdmissionBranch[];
  batches: AdmissionBatch[];
  years: { id: string; name: string }[];
  branchCourses?: { id: string; branchId: string; courseId: string; academicYearId: string }[];
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
}

export function EnrollCourseModal({
  open,
  onOpenChange,
  courses,
  branches,
  batches,
  years,
  branchCourses = [],
  onConfirm,
  isSubmitting = false,
  onCourseChange,
  onBranchChange,
}: EnrollCourseModalProps) {
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Reset form fields on dialog open/close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCourseId('');
      setBatchId('');
      setBranchId('');
      setAcademicYearId('');
      setNotes('');
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

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 text-white bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting || !courseId || !batchId || !branchId || !academicYearId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
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
