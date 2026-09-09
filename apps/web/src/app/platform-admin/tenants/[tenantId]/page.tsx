'use client';

import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Loader2,
  GraduationCap,
  UserCheck,
  HeartHandshake,
  GitFork,
  Sliders,
  Search,
  Check,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TenantDetailResponse {
  tenant: {
    id: string;
    code: string;
    slug: string;
    name: string;
    displayName: string;
    email: string;
    phone: string;
    website: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    timezone: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
  };
  primaryAdmin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
  } | null;
  admins: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
  }>;
  metrics: {
    totalUsers: number;
    totalStudents: number;
    totalTutors: number;
    totalParents: number;
    studentParentLinksCount: number;
    branchesCount: number;
    coursesCount: number;
    batchesCount: number;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    studentCode: string;
    gender: string;
    academicStatus: string;
  }>;
  tutors: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
  parents: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    occupation: string;
    educationLevel: string;
  }>;
  studentParentLinks: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    parentId: string;
    parentName: string;
    parentEmail: string;
    relationshipType: string;
    isPrimaryGuardian: boolean;
  }>;
  branches: Array<{
    id: string;
    code: string;
    name: string;
    city: string;
    state: string;
    status: string;
    createdAt: string;
  }>;
  featureFlags: Array<{
    id: string;
    featureKey: string;
    enabled: boolean;
    description: string;
  }>;
}

type TabType = 'OVERVIEW' | 'STUDENTS' | 'TUTORS' | 'PARENTS' | 'PARENT_LINKS' | 'BRANCHES';

export default function PlatformSingleTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('SUSPENDED');

  const { data, isLoading, refetch } = useQuery<TenantDetailResponse>({
    queryKey: ['platform-tenant-detail', tenantId],
    queryFn: () => api.get(`/platform-admin/tenants/${tenantId}`),
  });

  const tenant = data?.tenant;

  const statusMutation = useMutation({
    mutationFn: (vars: { status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; reason?: string }) =>
      api.patch(`/platform-admin/tenants/${tenantId}/status`, vars),
    onSuccess: () => {
      setStatusModalOpen(false);
      setStatusReason('');
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-dashboard-metrics'] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 font-sans">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0052CC] mb-3" />
        <p className="font-semibold text-slate-600">Loading institute profile details...</p>
      </div>
    );
  }

  if (!tenant || !data) {
    return (
      <div className="py-20 text-center space-y-4 font-sans">
        <p className="text-sm font-bold text-slate-700">Institute record not found.</p>
        <Link href="/platform-admin/dashboard">
          <Button variant="outline" size="sm" className="rounded-xl text-xs cursor-pointer">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const filteredStudents = (data.students || []).filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTutors = (data.tutors || []).filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParents = (data.parents || []).filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinks = (data.studentParentLinks || []).filter(
    (l) =>
      l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-[#0F172A] pb-12 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/platform-admin/dashboard">
                <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl h-8 text-xs cursor-pointer backdrop-blur-xs">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard
                </Button>
              </Link>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-cyan-200 border border-white/15 font-mono text-xs font-black">
                CODE: {tenant.code}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-1">
              {tenant.name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
              Registered on {new Date(tenant.createdAt).toLocaleDateString()} • {tenant.email}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold gap-2 cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Profile
            </Button>
            {tenant.status === 'ACTIVE' ? (
              <Button
                onClick={() => {
                  setTargetStatus('SUSPENDED');
                  setStatusModalOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs px-4 py-2.5 shadow-lg shadow-black/10 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Suspend Institute
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setTargetStatus('ACTIVE');
                  setStatusModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs px-4 py-2.5 shadow-lg shadow-black/10 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Reactivate Institute
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</span>
          <p className={cn(
            'text-lg font-black',
            tenant.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {tenant.status}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Institute Access State</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-[#0052CC] uppercase tracking-wider">Students</span>
          <p className="text-xl font-black text-slate-900">
            {data.metrics.totalStudents}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Enrolled Candidates</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Tutors / Staff</span>
          <p className="text-xl font-black text-slate-900">
            {data.metrics.totalTutors}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Academic Instructors</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Parents</span>
          <p className="text-xl font-black text-slate-900">
            {data.metrics.totalParents}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Guardian Accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider">Parent-Student Links</span>
          <p className="text-xl font-black text-slate-900">
            {data.metrics.studentParentLinksCount}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Associated Mappings</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Branches</span>
          <p className="text-xl font-black text-slate-900">
            {data.metrics.branchesCount}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Operating Campuses</p>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => { setActiveTab('OVERVIEW'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'OVERVIEW'
                ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Building2 className="w-4 h-4" /> Overview Profile
          </button>

          <button
            onClick={() => { setActiveTab('STUDENTS'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'STUDENTS'
                ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <GraduationCap className="w-4 h-4" /> Students ({data.metrics.totalStudents})
          </button>

          <button
            onClick={() => { setActiveTab('TUTORS'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'TUTORS'
                ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <UserCheck className="w-4 h-4" /> Tutors & Staff ({data.metrics.totalTutors})
          </button>

          <button
            onClick={() => { setActiveTab('PARENTS'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'PARENTS'
                ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Users className="w-4 h-4" /> Parents ({data.metrics.totalParents})
          </button>

          <button
            onClick={() => { setActiveTab('PARENT_LINKS'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'PARENT_LINKS'
                ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <HeartHandshake className="w-4 h-4" /> Student-Parent Links ({data.metrics.studentParentLinksCount})
          </button>

          <button
            onClick={() => { setActiveTab('BRANCHES'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'BRANCHES'
                ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <GitFork className="w-4 h-4" /> Branches & Modules
          </button>
        </div>

        {activeTab !== 'OVERVIEW' && activeTab !== 'BRANCHES' && (
          <div className="relative w-64 shrink-0 pr-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs rounded-xl h-9 bg-slate-50 border-slate-200"
            />
          </div>
        )}
      </div>

      {/* Tab Content Display */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0052CC]" /> Institute Profile & Contact Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institute Name</span>
                <span className="font-bold text-slate-900">{tenant.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institute Code</span>
                <span className="font-mono font-bold text-[#0052CC]">{tenant.code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email</span>
                <span className="font-bold text-slate-900">{tenant.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                <span className="font-bold text-slate-900">{tenant.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Website URL</span>
                <span className="font-bold text-slate-900">{tenant.website || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timezone / Currency</span>
                <span className="font-bold text-slate-900">{tenant.timezone} ({tenant.currency})</span>
              </div>
            </div>
          </div>

          {/* Tenant Admins */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0052CC]" /> Primary Administrators ({data.admins.length})
              </h2>
            </div>

            <div className="space-y-3">
              {data.admins.map((adm) => (
                <div
                  key={adm.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-extrabold shrink-0">
                      {(adm.firstName?.[0] || 'A').toUpperCase()}
                      {(adm.lastName?.[0] || '').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        {adm.firstName} {adm.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{adm.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-blue-50 text-[#0052CC] border border-blue-100 font-extrabold uppercase">
                    TENANT_ADMIN
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENTS TAB */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Registered Students Directory</h2>
            <span className="text-xs font-bold text-slate-400">Total: {filteredStudents.length} candidates</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Candidate</th>
                  <th className="py-3 px-4">Student Code</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Academic Status</th>
                  <th className="py-3 px-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No students found under this institute tenant.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0052CC] flex items-center justify-center font-bold text-xs">
                            {(st.name?.[0] || 'S').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{st.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{st.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{st.studentCode}</td>
                      <td className="py-3 px-4 text-slate-600">{st.phone}</td>
                      <td className="py-3 px-4 text-slate-600">{st.gender}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0052CC] font-bold text-[10px]">
                          {st.academicStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TUTORS & FACULTY TAB */}
      {activeTab === 'TUTORS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Academic Faculty & Tutors Directory</h2>
            <span className="text-xs font-bold text-slate-400">Total: {filteredTutors.length} instructors</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Instructor Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTutors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No tutor or faculty records found under this institute.
                    </td>
                  </tr>
                ) : (
                  filteredTutors.map((tt) => (
                    <tr key={tt.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-extrabold text-slate-900">{tt.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{tt.email}</td>
                      <td className="py-3 px-4 text-slate-600">{tt.phone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {tt.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {tt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PARENTS TAB */}
      {activeTab === 'PARENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Parent & Guardian Accounts</h2>
            <span className="text-xs font-bold text-slate-400">Total: {filteredParents.length} parents</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Parent Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Occupation</th>
                  <th className="py-3 px-4">Education Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No parent accounts registered under this institute.
                    </td>
                  </tr>
                ) : (
                  filteredParents.map((pt) => (
                    <tr key={pt.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-extrabold text-slate-900">{pt.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{pt.email}</td>
                      <td className="py-3 px-4 text-slate-600">{pt.phone}</td>
                      <td className="py-3 px-4 text-slate-600">{pt.occupation}</td>
                      <td className="py-3 px-4 text-slate-600">{pt.educationLevel}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {pt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. STUDENT-PARENT LINKS TAB */}
      {activeTab === 'PARENT_LINKS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Student <span className="text-[#0052CC]">↔</span> Parent Associations</h2>
            <span className="text-xs font-bold text-slate-400">Total: {filteredLinks.length} mapped links</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Candidate</th>
                  <th className="py-3 px-4">Parent Guardian</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Primary Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No student-parent associations created yet.
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((lk) => (
                    <tr key={lk.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-slate-900">{lk.studentName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{lk.studentEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-slate-900">{lk.parentName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{lk.parentEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded bg-blue-50 text-[#0052CC] font-bold text-[10px] border border-blue-100">
                          {lk.relationshipType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lk.isPrimaryGuardian ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                            <Check className="w-3 h-3" /> PRIMARY GUARDIAN
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">SECONDARY</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. BRANCHES & FEATURES TAB */}
      {activeTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branches */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#0052CC]" /> Institute Campuses & Branches ({data.branches.length})
            </h2>

            <div className="space-y-3">
              {data.branches.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No branch locations registered yet.</p>
              ) : (
                data.branches.map((br) => (
                  <div key={br.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{br.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{br.code} • {br.city}, {br.state}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                      {br.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feature Modules */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0052CC]" /> Enabled Feature Modules
            </h2>

            <div className="space-y-2.5">
              {data.featureFlags.map((ff) => (
                <div key={ff.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 font-mono">{ff.featureKey}</p>
                    <p className="text-[11px] text-slate-500">{ff.description || 'Module enabled for institute'}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] px-2.5 py-0.5 rounded font-extrabold',
                    ff.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                  )}>
                    {ff.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">
              Confirm Status Change ({targetStatus})
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter justification for transitioning tenant status from <span className="font-bold text-slate-800">{tenant.status}</span> to <span className="font-bold text-[#0052CC]">{targetStatus}</span>.
            </p>
            <Input
              type="text"
              placeholder="Reason / Notes..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="text-xs rounded-xl"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setStatusModalOpen(false)} className="rounded-xl text-xs cursor-pointer">
                Cancel
              </Button>
              <Button
                onClick={() => statusMutation.mutate({ status: targetStatus, reason: statusReason })}
                disabled={statusMutation.isPending}
                className="bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
              >
                {statusMutation.isPending ? 'Updating...' : 'Confirm Status Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
