import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { subjectsApi } from '../api/subjects.api';
import type { CreateSubjectInput, UpdateSubjectInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';

export const subjectKeys = {
  all: ['master', 'subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (params?: FilterParams) => [...subjectKeys.lists(), params] as const,
  details: () => [...subjectKeys.all, 'detail'] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
};

export function useSubjects(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: subjectKeys.list(params),
    queryFn: () => subjectsApi.getSubjects(params),
    enabled: isAuthenticated,
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectsApi.getSubjectById(id),
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => subjectsApi.createSubject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      subjectsApi.updateSubject(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(variables.id) });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
}
