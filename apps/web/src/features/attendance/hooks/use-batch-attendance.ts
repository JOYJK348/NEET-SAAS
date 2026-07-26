import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/features/attendance/api/attendance-api';

export function useBatchAttendance(batchId: string) {
  return useQuery({
    queryKey: ['attendance', 'admin', 'batch', batchId],
    queryFn: () => attendanceApi.getBatchDetail(batchId),
    enabled: !!batchId,
    staleTime: 2 * 60 * 1000,
  });
}
