import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/features/attendance/api/attendance-api';

export function useStudentAttendanceDetail(studentAdmissionId: string) {
  return useQuery({
    queryKey: ['attendance', 'admin', 'student', studentAdmissionId],
    queryFn: () => attendanceApi.getStudentDetail(studentAdmissionId),
    enabled: !!studentAdmissionId,
    staleTime: 2 * 60 * 1000,
  });
}
