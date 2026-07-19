import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { academicYearsApi } from '../api/academic-years.api';
import type { CreateAcademicYearInput, UpdateAcademicYearInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';

export const academicYearKeys = {
  all: ['master', 'academic-years'] as const,
  lists: () => [...academicYearKeys.all, 'list'] as const,
  list: (params?: FilterParams) => [...academicYearKeys.lists(), params] as const,
  details: () => [...academicYearKeys.all, 'detail'] as const,
  detail: (id: string) => [...academicYearKeys.details(), id] as const,
};

export function useAcademicYears(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: academicYearKeys.list(params),
    queryFn: () => academicYearsApi.getAcademicYears(params),
    enabled: isAuthenticated,
  });
}

export function useAcademicYear(id: string) {
  return useQuery({
    queryKey: academicYearKeys.detail(id),
    queryFn: () => academicYearsApi.getAcademicYearById(id),
    enabled: !!id,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAcademicYearInput) => academicYearsApi.createAcademicYear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
    },
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAcademicYearInput }) =>
      academicYearsApi.updateAcademicYear(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academicYearKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.deleteAcademicYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
    },
  });
}
