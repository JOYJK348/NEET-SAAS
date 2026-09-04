import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/features/attendance/api/attendance-api';

export function useAttendanceOverview() {
  return useQuery({
    queryKey: ['attendance', 'admin', 'overview'],
    queryFn: () => attendanceApi.getOverview(),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
