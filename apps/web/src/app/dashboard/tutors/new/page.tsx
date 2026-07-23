'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TutorDialog } from '@/features/tutors/components/TutorDialog';
import { useCreateTutor } from '@/features/tutors/hooks/use-tutors';

export default function NewTutorPage() {
  const router = useRouter();
  const createMutation = useCreateTutor();

  return (
    <DashboardLayout>
      <TutorDialog
        open={true}
        onOpenChange={() => router.push('/dashboard/tutors')}
        tutor={null}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data as any);
          router.push('/dashboard/tutors');
        }}
        isSubmitting={createMutation.isPending}
      />
    </DashboardLayout>
  );
}
