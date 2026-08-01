'use client';

import { useState } from 'react';
import { useAdmissions } from '@/features/admissions/hooks/use-admissions';
import { useEnrollStudent } from '@/features/batches/hooks/use-batches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Loader2,
  Check,
  Users,
  GraduationCap,
  X,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface MapStudentsSectionProps {
  batchId: string;
  courseId: string;
  branchId: string;
  enrolledStudentIds: string[];
  onClose?: () => void;
  onSuccess?: () => void;
}

export function MapStudentsSection({
  batchId,
  courseId,
  branchId,
  enrolledStudentIds,
  onClose,
  onSuccess,
}: MapStudentsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmissionIds, setSelectedAdmissionIds] = useState<string[]>([]);

  // Fetch admissions for this batch page
  const { admissions, isLoading } = useAdmissions({
    autoFetch: true,
    initialFilters: {
      status: 'ALL',
      perPage: 100,
    },
  });

  const enrollMutation = useEnrollStudent();

  // Filter out students who are already enrolled, and apply search
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
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to map students.');
    }
  };

  return (
    <Card className="border border-violet-100/80 bg-white/90 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden transition-all">
      {/* Premium In-Page Banner Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-5 sm:p-6 text-white relative">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Map New Students to Batch
              </h3>
              <p className="text-xs sm:text-sm text-violet-100/90 font-medium mt-0.5">
                Select available admissions to enroll into this batch
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

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Search Controls & Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or admission number..."
              className="pl-10 rounded-2xl h-11 border-gray-200 focus-visible:ring-violet-600 transition-all bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-sm"
            />
          </div>

          {availableStudents.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={handleSelectAll}
                className="rounded-2xl h-11 text-xs font-semibold border-gray-200 hover:bg-violet-50 hover:text-violet-700 transition-all px-4 shrink-0"
              >
                {selectedAdmissionIds.length === availableStudents.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
          )}
        </div>

        {/* Responsive Grid Roster of Available Students */}
        <div className="min-h-[220px] max-h-[380px] overflow-y-auto p-1.5 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Loading active admissions...</p>
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <GraduationCap className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-800">No Available Students Found</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                All registered active admissions are already enrolled in this batch, or no matching
                student profiles were found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableStudents.map((ad) => {
                const isSelected = selectedAdmissionIds.includes(ad.id);
                return (
                  <div
                    key={ad.id}
                    onClick={() => toggleSelectStudent(ad.id)}
                    className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-600/50 bg-violet-50/60 ring-2 ring-violet-500/20 shadow-sm'
                        : 'border-slate-200/80 bg-white hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-violet-900 transition-colors truncate">
                          {ad.studentName}
                        </p>
                        <span className="inline-block text-[11px] font-mono text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md mt-1 font-semibold">
                          {ad.admissionNumber}
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'border-violet-600 bg-violet-600 shadow-sm shadow-violet-600/30'
                            : 'border-gray-300 bg-gray-50 group-hover:border-violet-400'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[150px]">{ad.courseName || 'Course'}</span>
                      <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {ad.admissionStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Bar with Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-violet-600" />
            <span>
              {selectedAdmissionIds.length} of {availableStudents.length} student(s) selected
            </span>
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
              onClick={handleMapStudents}
              disabled={selectedAdmissionIds.length === 0 || enrollMutation.isPending}
              className="flex-1 sm:flex-initial rounded-2xl h-11 px-6 shadow-lg shadow-violet-600/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold gap-2 border-none transition-all disabled:opacity-50"
            >
              {enrollMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enroll Selected Students ({selectedAdmissionIds.length})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
