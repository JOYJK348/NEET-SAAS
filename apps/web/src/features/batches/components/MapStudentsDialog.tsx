'use client';

import { useState } from 'react';
import { useAdmissions } from '@/features/admissions/hooks/use-admissions';
import { useEnrollStudent } from '@/features/batches/hooks/use-batches';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Check, Users, GraduationCap, X } from 'lucide-react';
import { toast } from 'sonner';

interface MapStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  courseId: string;
  branchId: string;
  enrolledStudentIds: string[];
}

export function MapStudentsDialog({
  open,
  onOpenChange,
  batchId,
  courseId,
  branchId,
  enrolledStudentIds,
}: MapStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmissionIds, setSelectedAdmissionIds] = useState<string[]>([]);

  // Fetch admissions for this batch's course and branch
  const { admissions, isLoading } = useAdmissions({
    initialFilters: {
      courseId,
      branchId,
      status: 'ACTIVE',
      perPage: 100,
    },
  });

  const enrollMutation = useEnrollStudent();

  // Filter out students who are already enrolled, and apply query search
  const availableStudents = admissions.filter((ad) => {
    if (enrolledStudentIds.includes(ad.id)) return false;

    const fullName = (ad.studentName || '').toLowerCase();
    const code = (ad.admissionNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || code.includes(query);
  });

  const toggleSelectStudent = (id: string) => {
    setSelectedAdmissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedAdmissionIds.length === availableStudents.length) {
      setSelectedAdmissionIds([]);
    } else {
      setSelectedAdmissionIds(availableStudents.map((s) => s.id));
    }
  };

  const handleMapStudents = async () => {
    if (selectedAdmissionIds.length === 0) {
      toast.error('Please select at least one student to map.');
      return;
    }

    try {
      let successCount = 0;
      for (const admissionId of selectedAdmissionIds) {
        await enrollMutation.mutateAsync({ admissionId, batchId });
        successCount++;
      }

      toast.success(`Successfully mapped ${successCount} student(s) to this batch!`);
      setSelectedAdmissionIds([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to map students.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        {/* Modern Premium Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Map Students</DialogTitle>
              <DialogDescription className="text-xs text-violet-100/90 mt-0.5">
                Select and enroll students from this branch and course into the batch
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Search bar & Selection Info */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="pl-10 rounded-2xl h-11 border-gray-200 focus-visible:ring-violet-600 transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white text-sm"
              />
            </div>

            {availableStudents.length > 0 && (
              <Button
                variant="outline"
                type="button"
                onClick={handleSelectAll}
                className="rounded-2xl h-11 text-xs font-semibold border-gray-200 hover:bg-violet-50 hover:text-violet-700 transition-all px-4"
              >
                {selectedAdmissionIds.length === availableStudents.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            )}
          </div>

          {/* Students List Container */}
          <div className="overflow-y-auto h-72 border border-slate-100 rounded-2xl p-2 bg-slate-50/30 space-y-1.5 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-violet-600 mb-2" />
                <p className="text-xs font-medium text-gray-500">Loading student admissions...</p>
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground px-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <GraduationCap className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-800">No students available</p>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  All active matching admissions in this branch/course are already enrolled in this
                  batch.
                </p>
              </div>
            ) : (
              availableStudents.map((ad) => {
                const isSelected = selectedAdmissionIds.includes(ad.id);
                return (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => toggleSelectStudent(ad.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-violet-600/30 bg-violet-50/50 hover:bg-violet-50 text-violet-950 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'border-violet-600 bg-violet-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3.5]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{ad.studentName}</p>
                        <span className="inline-block text-[10px] text-gray-400 font-mono mt-0.5 bg-gray-100 px-2 py-0.5 rounded-md">
                          {ad.admissionNumber}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Premium Footer */}
        <DialogFooter className="bg-gray-50/70 p-6 border-t border-gray-100 flex sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-gray-500">
            {selectedAdmissionIds.length} of {availableStudents.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-2xl h-11 px-5 text-sm font-semibold hover:bg-gray-200 transition-all"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMapStudents}
              disabled={selectedAdmissionIds.length === 0 || enrollMutation.isPending}
              className="rounded-2xl h-11 px-6 shadow-lg shadow-violet-600/25 bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2 border-none transition-all disabled:opacity-50"
            >
              {enrollMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enroll Students
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
