'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PlatformTenantsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/platform-admin/dashboard');
  }, [router]);

  return (
    <div className="py-20 text-center text-xs text-slate-400 font-sans">
      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0052CC] mb-2" />
      Redirecting to Platform Governance Dashboard...
    </div>
  );
}
