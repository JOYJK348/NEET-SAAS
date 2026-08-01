'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentOverviewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/parent/academics');
  }, [router]);

  return null;
}
