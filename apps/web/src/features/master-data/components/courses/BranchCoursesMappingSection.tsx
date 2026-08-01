import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBranches } from '@/features/master-data/hooks/use-branches';
import {
  useBranchCourses,
  useCreateBranchCourse,
  useDeleteBranchCourse,
} from '@/features/master-data/hooks/use-branch-courses';
import {
  Plus,
  Trash2,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAcademicYearsForAdmission } from '@/features/admissions/hooks/use-admissions';
import { cn } from '@/lib/utils';

interface BranchCoursesMappingSectionProps {
  courseId: string;
}

export function BranchCoursesMappingSection({ courseId }: BranchCoursesMappingSectionProps) {
  const { data: mappingsRes, isLoading: mappingsLoading, refetch } = useBranchCourses();
  const { data: branchesRes } = useBranches({ limit: 100 });
  const { years: academicYears } = useAcademicYearsForAdmission();
  const createMutation = useCreateBranchCourse();
  const deleteMutation = useDeleteBranchCourse();

  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');

  const mappings = mappingsRes || [];
  const branches = branchesRes?.data || [];

  // Filter mappings to only show this course's branch locations
  const activeCourseMappings = mappings.filter((m) => m.courseId === courseId);

  // Find branches that are NOT yet mapped to this course for the selected academic year
  const availableBranches = branches.filter(
    (b) =>
      !activeCourseMappings.some((m) => m.branchId === b.id && m.academicYearId === selectedYearId),
  );

  const handleMapBranch = async () => {
    if (!selectedBranchId || !selectedYearId) return;
    try {
      await createMutation.mutateAsync({
        courseId,
        branchId: selectedBranchId,
        academicYearId: selectedYearId,
      });
      toast.success('Course mapped to branch location & academic year successfully');
      setSelectedBranchId('');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to map course to branch');
    }
  };

  const handleUnmapBranch = async (mappingId: string) => {
    if (confirm('Are you sure you want to remove this course mapping?')) {
      try {
        await deleteMutation.mutateAsync(mappingId);
        toast.success('Mapping removed successfully');
        refetch();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to remove mapping');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mappings List */}
      <Card className="lg:col-span-2 border border-slate-200/90 rounded-3xl shadow-sm bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                Offered Campus Locations 🏫
              </h3>
              <p className="text-xs text-violet-200 mt-0.5 font-medium">
                Campus branches and academic years where this course curriculum is actively taught
              </p>
            </div>
          </div>

          <span className="text-xs font-black bg-white/20 text-white px-3 py-1 rounded-xl backdrop-blur-xs">
            {activeCourseMappings.length} Locations
          </span>
        </div>

        <CardContent className="p-5">
          {mappingsLoading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Loading campus branch mappings...
            </div>
          ) : activeCourseMappings.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-2xl border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
                <MapPin className="h-6 w-6" />
              </div>
              <p className="font-bold text-sm text-slate-900">Not offered at any campus yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Use the configuration panel on the right to offer this course curriculum at a campus
                branch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activeCourseMappings.map((mapping) => {
                const branch =
                  branches.find((b) => b.id === mapping.branchId) || (mapping as any).branch;
                const year =
                  academicYears.find((y) => y.id === mapping.academicYearId) ||
                  (mapping as any).academicYear;
                const yearName = year?.name || 'Academic Year';

                return (
                  <div
                    key={mapping.id}
                    className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 hover:border-violet-300 hover:shadow-md transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <MapPin className="h-5.5 w-5.5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900 truncate">
                            {branch?.name || 'Main Campus'}
                          </h4>
                          {branch?.code && (
                            <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 uppercase">
                              {branch.code}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            {yearName}
                          </span>
                          {branch?.branchType && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {branch.branchType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnmapBranch(mapping.id)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9 p-0 shrink-0 transition-colors"
                      title="Unmap campus location"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Actions Side Panel */}
      <Card className="border border-slate-200/90 rounded-3xl shadow-sm bg-white overflow-hidden flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-600" /> Map New Campus Location
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure course availability across institute branches
            </p>
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-violet-600" /> 1. Select Academic Year *
              </label>
              <Select
                value={selectedYearId}
                onValueChange={(val) => {
                  setSelectedYearId(val);
                  setSelectedBranchId('');
                }}
              >
                <SelectTrigger className="rounded-xl text-xs font-bold text-slate-800 h-10 border-slate-200">
                  <SelectValue placeholder="Choose academic session" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id} className="text-xs font-medium">
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-violet-600" /> 2. Select Campus Branch *
              </label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
                disabled={!selectedYearId}
              >
                <SelectTrigger className="rounded-xl text-xs font-bold text-slate-800 h-10 border-slate-200">
                  <SelectValue
                    placeholder={
                      selectedYearId ? 'Choose campus location' : 'Select academic year first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <Button
            onClick={handleMapBranch}
            disabled={!selectedBranchId || !selectedYearId || createMutation.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-10 text-xs shadow-xs transition-all gap-2"
          >
            <Plus className="h-4 w-4" /> Map Course Location
          </Button>
        </div>
      </Card>
    </div>
  );
}
