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
import { Plus, Trash2, MapPin, Building2, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAcademicYearsForAdmission } from '@/features/admissions/hooks/use-admissions';

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
      <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Offered Locations</CardTitle>
          <CardDescription>
            Select campus branches and academic years where this course curriculum is actively
            taught
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappingsLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading mappings...</div>
          ) : activeCourseMappings.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Not offered anywhere yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Use the configuration panel on the right to offer this course at a campus branch.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {activeCourseMappings.map((mapping) => {
                const branch = branches.find((b) => b.id === mapping.branchId);
                // Display the name of mapped academic year if returned by backend
                const yearName = (mapping as any).academicYear?.name || 'Academic Year';
                return (
                  <div
                    key={mapping.id}
                    className="flex justify-between items-center py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {branch?.name || 'Loading Branch...'} ({yearName})
                        </p>
                        <p className="text-xs text-gray-500">Code: {branch?.code || '...'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnmapBranch(mapping.id)}
                      className="text-gray-400 hover:text-red-500 h-9 w-9 p-0"
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

      {/* Map Actions */}
      <Card className="border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Map New Branch</CardTitle>
          <CardDescription>Configure course availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Select Academic Year</label>
            <Select
              value={selectedYearId}
              onValueChange={(val) => {
                setSelectedYearId(val);
                setSelectedBranchId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Select Campus Branch</label>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              disabled={!selectedYearId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedYearId ? 'Select campus branch' : 'Select academic year first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleMapBranch}
            disabled={!selectedBranchId || !selectedYearId}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11"
          >
            <Plus className="h-4 w-4 mr-2" /> Map Course
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
