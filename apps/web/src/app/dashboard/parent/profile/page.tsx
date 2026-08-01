'use client';

import { useEffect, useState } from 'react';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentProfileData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { User, Mail, ShieldCheck, GraduationCap, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';

export default function ParentProfilePage() {
  const { linkedStudents } = useChildSwitcher();
  const [data, setData] = useState<ParentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getProfile()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const profile = data || {
    id: '',
    email: 'parent@example.com',
    firstName: 'Parent',
    lastName: 'User',
    status: 'ACTIVE',
    occupation: 'Not provided',
    educationLevel: 'Not provided',
    createdAt: new Date(),
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Parent Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account information and linked students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parent Details Card */}
        <Card className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg">
              {profile.firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="h-3 w-3" /> Account {profile.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 font-medium">Email Address</span>
              <span className="font-semibold text-slate-800 font-mono">{profile.email}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 font-medium">Account Role</span>
              <span className="font-semibold text-slate-800 uppercase">PARENT PORTAL</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 font-medium">Occupation</span>
              <span className="font-semibold text-slate-800">{profile.occupation}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 font-medium">Education Level</span>
              <span className="font-semibold text-slate-800">{profile.educationLevel}</span>
            </div>
          </div>
        </Card>

        {/* Linked Children List */}
        <Card className="lg:col-span-1 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="h-5 w-5 text-violet-600" />
            <h3 className="font-bold text-base text-slate-900">
              Linked Children ({linkedStudents.length})
            </h3>
          </div>

          <div className="space-y-3">
            {linkedStudents.map((child) => (
              <div
                key={child.id}
                className="p-3.5 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-1"
              >
                <p className="font-bold text-xs text-slate-900">{child.name}</p>
                <p className="text-[11px] text-violet-700 font-medium">
                  {child.courseName} • {child.batchName}
                </p>
                <span className="text-[10px] text-slate-400 block font-mono">
                  No: {child.admissionNumber}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
