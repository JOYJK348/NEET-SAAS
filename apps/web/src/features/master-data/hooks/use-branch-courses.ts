import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchCoursesApi, MapBranchCourseInput } from '../api/branch-courses.api';

const QUERY_KEYS = {
  all: ['branch-courses'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  byBranch: (branchId: string) => [...QUERY_KEYS.lists(), 'branch', branchId] as const,
};

export function useBranchCourses(branchId?: string) {
  return useQuery({
    queryKey: branchId ? QUERY_KEYS.byBranch(branchId) : QUERY_KEYS.lists(),
    queryFn: () =>
      branchId ? branchCoursesApi.getMappingsByBranch(branchId) : branchCoursesApi.getMappings(),
  });
}

export function useCreateBranchCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MapBranchCourseInput) => branchCoursesApi.createMapping(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (variables.branchId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byBranch(variables.branchId) });
      }
    },
  });
}

export function useDeleteBranchCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchCoursesApi.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
