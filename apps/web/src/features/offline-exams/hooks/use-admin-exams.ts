import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminExamsService } from '../services/admin-exams-service';
import type { CreateExamPayload } from '../types/admin-exams';

export const adminExamKeys = {
  all: ['admin-exams'] as const,
  list: (params?: Record<string, any>) => [...adminExamKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminExamKeys.all, 'detail', id] as const,
  review: (id: string) => [...adminExamKeys.all, 'review', id] as const,
  live: (id: string) => [...adminExamKeys.all, 'live', id] as const,
  analytics: (id: string) => [...adminExamKeys.all, 'analytics', id] as const,
  sections: (id: string) => [...adminExamKeys.all, 'sections', id] as const,
  top: (id: string) => [...adminExamKeys.all, 'top', id] as const,
  bottom: (id: string) => [...adminExamKeys.all, 'bottom', id] as const,
  checklist: (id: string) => [...adminExamKeys.all, 'checklist', id] as const,
};

export function useAdminExams(params?: Record<string, any>) {
  return useQuery({
    queryKey: adminExamKeys.list(params),
    queryFn: () => adminExamsService.getExams(params),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminExamDetail(id: string) {
  return useQuery({
    queryKey: adminExamKeys.detail(id),
    queryFn: () => adminExamsService.getExamById(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminReviewSummary(id: string) {
  return useQuery({
    queryKey: adminExamKeys.review(id),
    queryFn: () => adminExamsService.getReviewSummary(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminLiveDashboard(id: string, refetchInterval: number = 15000) {
  return useQuery({
    queryKey: adminExamKeys.live(id),
    queryFn: () => adminExamsService.getLiveDashboard(id),
    enabled: !!id,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  });
}

export function useAdminPostPublishAnalytics(id: string) {
  return useQuery({
    queryKey: adminExamKeys.analytics(id),
    queryFn: () => adminExamsService.getPostPublishAnalytics(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminSectionAnalytics(id: string) {
  return useQuery({
    queryKey: adminExamKeys.sections(id),
    queryFn: () => adminExamsService.getSectionAnalytics(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminTopStudents(id: string, limit: number = 10) {
  return useQuery({
    queryKey: adminExamKeys.top(id),
    queryFn: () => adminExamsService.getTopStudents(id, limit),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminBottomStudents(id: string, limit: number = 10) {
  return useQuery({
    queryKey: adminExamKeys.bottom(id),
    queryFn: () => adminExamsService.getBottomStudents(id, limit),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 1000 * 10,
  });
}

export function useAdminPublishChecklist(id: string) {
  return useQuery({
    queryKey: adminExamKeys.checklist(id),
    queryFn: () => adminExamsService.getPublishChecklist(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamPayload) => adminExamsService.createExam(data),
    onSuccess: () => {
      toast.success('Exam created successfully as DRAFT');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
    },
  });
}

export function usePublishExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminExamsService.publishExam(id),
    onSuccess: () => {
      toast.success('Exam published successfully to student portal');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
    },
  });
}

export function useApproveSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, submissionId }: { examId: string; submissionId: string }) =>
      adminExamsService.approveSubmission(examId, submissionId),
    onSuccess: (_, variables) => {
      toast.success('Student evaluation approved');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.review(variables.examId) });
    },
  });
}

export function useRejectSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      submissionId,
      reason,
    }: {
      examId: string;
      submissionId: string;
      reason: string;
    }) => adminExamsService.rejectSubmission(examId, submissionId, reason),
    onSuccess: (_, variables) => {
      toast.success('Evaluation returned to tutor for re-evaluation');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.review(variables.examId) });
    },
  });
}

export function useApproveAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => adminExamsService.approveAll(examId),
    onSuccess: (data, examId) => {
      toast.success(
        `Bulk approved ${data.approvedCount} evaluations. Evaluation locked (ADMIN_REVIEW).`,
      );
      queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => adminExamsService.publishResults(examId),
    onSuccess: (_, examId) => {
      toast.success('Results and scorecards published successfully!');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
    },
  });
}

export function useUploadQuestionPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminExamsService.uploadQuestionPaper(id, file),
    onSuccess: () => {
      toast.success('Question Paper uploaded successfully to Supabase Storage!');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
    },
  });
}

export function useUploadAnswerKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminExamsService.uploadAnswerKey(id, file),
    onSuccess: () => {
      toast.success('Answer Key uploaded successfully to Supabase Storage!');
      queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
    },
  });
}
