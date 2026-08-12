'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLiveClassesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/timetable/new');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
      <div className="flex items-center gap-3 text-violet-400 font-semibold text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Redirecting to Create Schedule...</span>
      </div>
    </div>
  );
}
