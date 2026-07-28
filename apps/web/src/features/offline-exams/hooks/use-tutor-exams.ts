import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tutorExamsService } from '../services/tutor-exams-service';
import type { EvaluateSubmissionPayload } from '../types/tutor-exams';

export const tutorExamKeys = {
  all: ['tutor-exams'] as const,
  assigned: () => [...tutorExamKeys.all, 'assigned'] as const,
  buckets: (examId: string) => [...tutorExamKeys.all, 'buckets', examId] as const,
  detail: (examId: string, submissionId: string) =>
    [...tutorExamKeys.all, 'detail', examId, submissionId] as const,
};

export function useTutorAssignedExams() {
  return useQuery({
    queryKey: tutorExamKeys.assigned(),
    queryFn: () => tutorExamsService.getMyAssignedExams(),
  });
}

export function useTutorSubmissionsBuckets(examId: string) {
  return useQuery({
    queryKey: tutorExamKeys.buckets(examId),
    queryFn: () => tutorExamsService.getExamSubmissionsBuckets(examId),
    enabled: !!examId,
  });
}

export function useTutorSubmissionDetail(examId: string, submissionId: string) {
  return useQuery({
    queryKey: tutorExamKeys.detail(examId, submissionId),
    queryFn: () => tutorExamsService.getSubmissionDetail(examId, submissionId),
    enabled: !!examId && !!submissionId,
  });
}

export function useEvaluateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      submissionId,
      data,
    }: {
      examId: string;
      submissionId: string;
      data: EvaluateSubmissionPayload;
    }) => tutorExamsService.evaluateSubmission(examId, submissionId, data),
    onSuccess: (_, { examId, submissionId }) => {
      toast.success('Evaluation saved successfully!');
      queryClient.invalidateQueries({ queryKey: tutorExamKeys.buckets(examId) });
      queryClient.invalidateQueries({ queryKey: tutorExamKeys.detail(examId, submissionId) });
    },
  });
}
