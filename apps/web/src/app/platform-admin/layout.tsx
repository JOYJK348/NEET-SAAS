'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ShieldAlert, Loader2, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const role = (user?.roleCode || (user as any)?.role || '').toUpperCase();
  const isPlatformAdmin =
    role === 'PLATFORM_ADMIN' ||
    role === 'PLATFORM_OWNER' ||
    (role === 'SUPER_ADMIN' && !user?.tenantId);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 font-sans tracking-wide">
          Verifying Platform Admin Credentials...
        </p>
      </div>
    );
  }

  if (isAuthenticated && !isPlatformAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Platform Access Restricted
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your account (<span className="font-mono font-semibold text-slate-700">{user?.email}</span>) does not have Global Platform Admin privileges. Access to platform administration settings is restricted.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-[#0052CC] hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-2.5 cursor-pointer shadow-md shadow-blue-500/20"
            >
              Return to Institute Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#0052CC] selection:text-white">
      {/* Top Navigation Header for Platform Admin */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0052CC] to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">NEET Platform</h1>
            <p className="text-[10px] font-bold text-[#0052CC] uppercase tracking-wider">Super Admin Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0052CC] flex items-center justify-center text-xs font-extrabold">
              {((user as any)?.firstName?.[0] || (user as any)?.name?.[0] || user?.email?.[0] || 'P').toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}` : (user as any)?.name || 'Platform Admin'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-none font-medium">{user?.email || 'platformadmin@gmail.com'}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs gap-1.5 font-semibold cursor-pointer border border-transparent hover:border-red-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Full-Screen Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {children}
      </main>
    </div>
  );
}

