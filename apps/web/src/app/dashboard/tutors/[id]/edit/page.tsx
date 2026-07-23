'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { TutorDialog } from '@/features/tutors/components/TutorDialog';
import { useTutor, useUpdateTutor } from '@/features/tutors/hooks/use-tutors';

export default function EditTutorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: tutor, isLoading } = useTutor(id);
  const updateMutation = useUpdateTutor(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!tutor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-sm text-gray-500">Tutor not found</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl h-11"
            onClick={() => router.push('/dashboard/tutors')}
          >
            Back to Tutors
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TutorDialog
        open={true}
        onOpenChange={() => router.push(`/dashboard/tutors/${id}`)}
        tutor={tutor}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data as any);
          router.push(`/dashboard/tutors/${id}`);
        }}
        isSubmitting={updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
