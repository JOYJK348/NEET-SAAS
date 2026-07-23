import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorService } from '../services/tutor-service';
import type { CreateTutorInput, UpdateTutorInput, TutorFilters } from '../types/tutor';
import { toast } from 'sonner';

interface ApiError {
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}

function parseError(err: unknown): string {
  const data = (err as any)?.response?.data as ApiError | undefined;
  if (!data) return 'Something went wrong';
  if (data.errors && data.errors.length > 0) {
    return data.errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join('\n');
  }
  return data.message || 'Something went wrong';
}

export function useTutors(filters?: TutorFilters) {
  return useQuery({
    queryKey: tutorService.keys.list(filters),
    queryFn: () => tutorService.findAll(filters),
  });
}

export function useTutor(id: string | null) {
  return useQuery({
    queryKey: tutorService.keys.detail(id ?? ''),
    queryFn: () => tutorService.findOne(id!),
    enabled: !!id,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: tutorService.keys.subjects(),
    queryFn: () => tutorService.getSubjects(),
  });
}

export function useBranches() {
  return useQuery({
    queryKey: tutorService.keys.branches(),
    queryFn: () => tutorService.getBranches(),
  });
}

export function useCreateTutor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTutorInput) => tutorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tutorService.keys.all });
      toast.success('Tutor created successfully');
    },
    onError: (err: unknown) => {
      toast.error(parseError(err));
    },
  });
}

export function useUpdateTutor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTutorInput) => tutorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tutorService.keys.all });
      queryClient.invalidateQueries({ queryKey: tutorService.keys.detail(id) });
      toast.success('Tutor updated successfully');
    },
    onError: (err: unknown) => {
      toast.error(parseError(err));
    },
  });
}

export function useDeleteTutor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tutorService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tutorService.keys.all });
      toast.success('Tutor deleted successfully');
    },
    onError: (err: unknown) => {
      toast.error(parseError(err));
    },
  });
}
