'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES } from '@/lib/staleTimes';
import { useAuthStore } from '@/stores/auth-store';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  GraduationCap,
  UserCheck,
  HeartHandshake,
} from 'lucide-react';

interface ParentListItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string | null;
  children: Array<{
    studentId: string;
    name: string;
    courseName: string;
    batchName: string;
  }>;
}

export default function TenantAdminParentsPage() {
  const [search, setSearch] = useState('');
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  const { data: parents = [], isPending: isLoading, refetch } = useQuery({
    queryKey: queryKeys.parents.list({ limit: 100 }, tenantId),
    queryFn: async ({ signal }) => {
      const res = await api.get<any>('/students?limit=100', { signal });
      const studentsList = res.data?.data || res.data || [];

      // Extract unique parent details from student responses
      const parentMap = new Map<string, ParentListItem>();

      studentsList.forEach((s: any) => {
        if (s.parentEmail && s.parentEmail !== 'Not provided') {
          const pEmail = s.parentEmail.toLowerCase();
          if (!parentMap.has(pEmail)) {
            parentMap.set(pEmail, {
              id: s.id,
              email: s.parentEmail,
              name: s.parentName || 'Parent',
              phone: s.parentPhone || 'Not provided',
              status: 'ACTIVE',
              lastLogin: s.createdAt,
              children: [
                {
                  studentId: s.id,
                  name: `${s.firstName} ${s.lastName}`,
                  courseName: s.courseName || 'NEET',
                  batchName: s.batchName || 'Main',
                },
              ],
            });
          } else {
            const existing = parentMap.get(pEmail)!;
            existing.children.push({
              studentId: s.id,
              name: `${s.firstName} ${s.lastName}`,
              courseName: s.courseName || 'NEET',
              batchName: s.batchName || 'Main',
            });
          }
        }
      });

      return Array.from(parentMap.values());
    },
    staleTime: STALE_TIMES.STUDENTS,
    placeholderData: keepPreviousData,
  });

  const filteredParents = parents.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  );

  const totalChildrenCount = parents.reduce((acc, p) => acc + p.children.length, 0);
  const multiChildrenParentCount = parents.filter((p) => p.children.length > 1).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen text-slate-900">
        {/* Signature Violet Gradient Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg shadow-violet-200">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-white shadow-xs">
                <span className="text-xl sm:text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200 bg-white/15 px-3 py-1 rounded-full border border-white/20">
                  Parent Portal Directory 🎓
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white mt-2 leading-tight">
                  Parent Accounts & Access
                </h1>
                <p className="text-xs sm:text-sm text-violet-100 font-medium mt-1 max-w-xl">
                  Manage parent login credentials, monitor active portal access, and track linked
                  student profiles.
                </p>
              </div>
            </div>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl px-4 py-2.5 text-xs font-bold gap-2 backdrop-blur-md transition-all self-start sm:self-auto shrink-0 shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Directory
            </Button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Parents
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{parents.length}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Registered guardians</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Linked Children
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {totalChildrenCount}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Enrolled students</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Access
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{parents.length}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">100% active status</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Multi-Student
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <HeartHandshake className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {multiChildrenParentCount}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Parents with &gt;1 child</p>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parent by name, email, or mobile number..."
              className="pl-10 h-11 rounded-xl border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-500 transition-all"
            />
          </div>
        </Card>

        {/* Parent Directory Container */}
        <Card className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Parent Accounts Directory</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                {filteredParents.length} {filteredParents.length === 1 ? 'Parent' : 'Parents'}
              </span>
            </div>
          </div>

          {isLoading && parents.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-500 font-medium">
                Fetching parent portal accounts...
              </p>
            </div>
          ) : filteredParents.length > 0 ? (
            <>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Parent Name</th>
                      <th className="py-3 px-3">Contact Details</th>
                      <th className="py-3 px-3">Linked Children</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParents.map((parent) => {
                      const initials =
                        parent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) || 'P';

                      return (
                        <tr key={parent.email} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {initials}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-snug">
                                  {parent.name}
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {parent.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-slate-700">
                                <Mail className="h-3 w-3 text-violet-500 shrink-0" />
                                <span>{parent.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{parent.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {parent.children.map((c) => (
                                <span
                                  key={c.studentId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200/80 shadow-2xs"
                                >
                                  <GraduationCap className="h-3 w-3 text-violet-600" />
                                  {c.name}
                                  <span className="text-[10px] text-violet-500 font-normal">
                                    ({c.courseName})
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {parent.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (block on mobile, hidden on desktop) */}
              <div className="block sm:hidden space-y-3">
                {filteredParents.map((parent) => {
                  const initials =
                    parent.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'P';

                  return (
                    <Card
                      key={parent.email}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-violet-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{parent.name}</h4>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {parent.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-xs border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700 font-mono text-[11px]">
                          <Mail className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                          <span className="truncate">{parent.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{parent.phone}</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Linked Children ({parent.children.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {parent.children.map((c) => (
                            <span
                              key={c.studentId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200"
                            >
                              <GraduationCap className="h-3 w-3 text-violet-600" />
                              {c.name} ({c.courseName})
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No parent accounts found</p>
              <p className="text-xs text-slate-400">
                Try searching for a different name, email, or phone number.
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
