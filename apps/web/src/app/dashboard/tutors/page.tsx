'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users, BookOpen, MapPin, RefreshCw } from 'lucide-react';
import { useTutors, useSubjects, useBranches } from '@/features/tutors/hooks/use-tutors';
import { tutorService } from '@/features/tutors/services/tutor-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-500' },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
};

export default function TutorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useTutors({
    search: search || undefined,
    subjectId: subjectFilter || undefined,
    branchId: branchFilter || undefined,
    tutorStatus: statusFilter || undefined,
  });
  const { data: subjects } = useSubjects();
  const { data: branches } = useBranches();
  const queryClient = useQueryClient();

  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    (subjects ?? []).forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tutorService.update(id, { status }),
    onMutate: async ({ id, status }) => {
      const key = tutorService.keys.all;
      await queryClient.cancelQueries({ queryKey: key });
      const queries = queryClient.getQueriesData({ queryKey: key });
      queryClient.setQueriesData({ queryKey: key }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((t: any) => (t.id === id ? { ...t, status } : t)),
        };
      });
      return { previous: queries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [qKey, qData] of context.previous) {
          queryClient.setQueryData(qKey, qData);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tutorService.keys.all });
    },
  });

  const tutors = data?.data ?? [];
  const meta = data?.meta;

  const hasFilters = search || subjectFilter || branchFilter || statusFilter;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Tutors</h1>
            <p className="text-sm text-gray-500">Manage your teaching faculty and assignments</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/tutors/new')}
            className="gap-2 rounded-xl h-11 px-5"
          >
            <Plus className="h-4 w-4" />
            Add Tutor
          </Button>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tutors by name, email, or code..."
                className="pl-10 h-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white outline-none focus:border-violet-400"
              >
                <option value="">All Subjects</option>
                {(subjects ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white outline-none focus:border-violet-400"
              >
                <option value="">All Branches</option>
                {(branches ?? []).map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white outline-none focus:border-violet-400"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSubjectFilter('');
                    setBranchFilter('');
                    setStatusFilter('');
                  }}
                  className="h-9 px-3 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border border-gray-200">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : tutors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-violet-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 mb-1">
                  {hasFilters ? 'No tutors found' : 'No tutors yet'}
                </h3>
                <p className="text-xs text-gray-400 max-w-xs">
                  {hasFilters
                    ? 'Try adjusting your search or filters'
                    : 'Add your first tutor to start building your faculty'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Employee Code
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Branches
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Batches
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((tutor: any) => {
                    const cfg = statusConfig[tutor.status] ?? {
                      label: tutor.status,
                      color: 'bg-gray-100 text-gray-500',
                    };
                    return (
                      <tr
                        key={tutor.id}
                        onClick={() => router.push(`/dashboard/tutors/${tutor.id}`)}
                        className="border-b border-gray-50 hover:bg-violet-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {tutor.firstName?.[0]}
                              {tutor.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">
                                {tutor.firstName} {tutor.lastName}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">{tutor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-mono text-gray-500">
                            {tutor.employeeCode || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {tutor.subjects?.length > 0 ? (
                              tutor.subjects.map((s: any) => (
                                <Badge
                                  key={s.id}
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {subjectMap.get(s.subjectId) || 'Subject'}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-500">
                            {tutor.branches?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-bold text-gray-600">
                            {tutor.batchCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={tutor.status === 'ACTIVE'}
                                onCheckedChange={() =>
                                  toggleMutation.mutate({
                                    id: tutor.id,
                                    status: tutor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                  })
                                }
                              />
                            </div>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
                                cfg.color,
                              )}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/tutors/${tutor.id}`);
                            }}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {meta.total} tutor{meta.total !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Page {meta.page} of {meta.totalPages}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
