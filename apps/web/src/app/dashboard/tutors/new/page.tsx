'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TutorDialog } from '@/features/tutors/components/TutorDialog';
import { LoginCredentialsDialog } from '@/features/tutors/components/LoginCredentialsDialog';
import { useCreateTutor } from '@/features/tutors/hooks/use-tutors';
import type { Tutor } from '@/features/tutors/types/tutor';

export default function NewTutorPage() {
  const router = useRouter();
  const createMutation = useCreateTutor();
  const [credentials, setCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const hasCredentialsRef = useRef(false);

  const handleCredentialsClose = useCallback(() => {
    setCredentials(null);
    router.push('/dashboard/tutors');
  }, [router]);

  return (
    <DashboardLayout>
      <TutorDialog
        open={!credentials}
        onOpenChange={() => {
          if (!hasCredentialsRef.current) router.push('/dashboard/tutors');
        }}
        tutor={null}
        onSubmit={async (data) => {
          const result = await createMutation.mutateAsync(data as any) as Tutor & { generatedPassword?: string };
          if (result.generatedPassword) {
            hasCredentialsRef.current = true;
            setCredentials({
              email: result.email,
              password: result.generatedPassword,
              name: `${result.firstName} ${result.lastName}`,
            });
          } else {
            router.push('/dashboard/tutors');
          }
        }}
        isSubmitting={createMutation.isPending}
      />

      {credentials && (
        <LoginCredentialsDialog
          open={true}
          onOpenChange={handleCredentialsClose}
          email={credentials.email}
          password={credentials.password}
          name={credentials.name}
        />
      )}
    </DashboardLayout>
  );
}
