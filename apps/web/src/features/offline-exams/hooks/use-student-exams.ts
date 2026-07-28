import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentExamsService } from '../services/student-exams-service';

export const studentExamKeys = {
  all: ['student-exams'] as const,
  list: () => [...studentExamKeys.all, 'list'] as const,
  detail: (id: string) => [...studentExamKeys.all, 'detail', id] as const,
  result: (id: string) => [...studentExamKeys.all, 'result', id] as const,
};

export function useStudentExams() {
  return useQuery({
    queryKey: studentExamKeys.list(),
    queryFn: () => studentExamsService.getMyExams(),
  });
}

export function useStudentExamDetail(id: string) {
  return useQuery({
    queryKey: studentExamKeys.detail(id),
    queryFn: () => studentExamsService.getExamDetail(id),
    enabled: !!id,
    refetchInterval: 30000,
  });
}

export function useStudentResult(id: string) {
  return useQuery({
    queryKey: studentExamKeys.result(id),
    queryFn: () => studentExamsService.getResult(id),
    enabled: !!id,
  });
}

export function useStartExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentExamsService.startExam(id),
    onSuccess: (_, id) => {
      toast.success('Exam session started! Timer is running.');
      queryClient.invalidateQueries({ queryKey: studentExamKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentExamKeys.list() });
    },
  });
}

export function useGetQuestionPaperUrl() {
  return useMutation({
    mutationFn: (id: string) => studentExamsService.getQuestionPaperUrl(id),
    onSuccess: () => {
      toast.success('Question Paper unlocked & downloaded');
    },
  });
}

export function useUploadAnswerSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      studentExamsService.uploadAnswerSheet(id, file),
    onSuccess: (_, { id }) => {
      toast.success('Answer sheet uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: studentExamKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentExamKeys.list() });
    },
  });
}

/**
 * Custom 30-Second Heartbeat Hook
 * Automatically sends heartbeat pings every 30s while student is in exam room
 * Flushes last heartbeat using navigator.sendBeacon on window unload
 */
export function useHeartbeat(examId: string, isStarted: boolean) {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!examId || !isStarted) return;

    const ping = async () => {
      try {
        setIsSyncing(true);
        const res = await studentExamsService.heartbeat(examId);
        if (res.success) {
          setLastSyncedAt(new Date(res.lastSeenAt));
        }
      } catch (err) {
        console.warn('Heartbeat ping failed:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    // Initial ping
    ping();

    // 30s interval
    const interval = setInterval(ping, 30000);

    // Unload beacon handler
    const handleUnload = () => {
      if (typeof window !== 'undefined' && navigator.sendBeacon) {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/student/exams/${examId}/heartbeat`;
        navigator.sendBeacon(apiUrl);
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [examId, isStarted]);

  return { lastSyncedAt, isSyncing };
}
