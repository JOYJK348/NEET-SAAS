import { useCourses } from '@/features/master-data/hooks/use-courses';
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
import { useBranches } from '@/features/master-data/hooks/use-branches';
import { useAcademicYears } from '@/features/master-data/hooks/use-academic-years';
import { useBatchDeliveryTypes } from '@/features/master-data/hooks/use-batch-delivery-types';

/**
 * Common Dropdown Pre-Warming Hook
 * 
 * Returns cached master options instantly (0ms) so forms render without loading skeletons.
 */
export function useDropdownData() {
  const courses = useCourses({ limit: 200 });
  const subjects = useSubjects({ limit: 200 });
  const branches = useBranches({ limit: 200 });
  const academicYears = useAcademicYears({ limit: 50 });
  const batchDeliveryTypes = useBatchDeliveryTypes({ limit: 50 });

  return {
    courses: courses.data?.data ?? [],
    subjects: subjects.data?.data ?? [],
    branches: branches.data?.data ?? [],
    academicYears: academicYears.data?.data ?? [],
    batchDeliveryTypes: batchDeliveryTypes.data?.data ?? [],
    isLoading:
      courses.isLoading ||
      subjects.isLoading ||
      branches.isLoading ||
      academicYears.isLoading ||
      batchDeliveryTypes.isLoading,
  };
}
