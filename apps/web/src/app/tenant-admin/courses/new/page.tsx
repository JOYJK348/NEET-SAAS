'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  Layers,
  Tag,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useBranches } from '@/features/master-data/hooks/use-branches';
import { useAcademicYears } from '@/features/master-data/hooks/use-academic-years';

function CourseFormBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate unique course code!
  const generateUniqueCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `CRS-NEET-${randomNum}`;
  };

  // Form states
  const [code, setCode] = useState(generateUniqueCode());
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical / NEET');
  const [duration, setDuration] = useState('1 Year');
  const [isActive, setIsActive] = useState(true);

  // Branch & Academic Year mappings
  const [branchId, setBranchId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  const { data: branchesData } = useBranches({ limit: 100 });
  const { data: academicYearsData } = useAcademicYears({ limit: 100 });

  const branches = branchesData?.data || [];
  const academicYears = academicYearsData?.data || [];

  useEffect(() => {
    if (branches.length > 0 && !branchId) setBranchId(branches[0].id);
    if (academicYears.length > 0 && !academicYearId) setAcademicYearId(academicYears[0].id);
  }, [branches, academicYears]);

  useEffect(() => {
    if (!editId) return;

    async function loadExistingCourse() {
      try {
        setLoading(true);
        const res = await api.get<any>(`/master/courses/${editId}`);
        const data = res?.data || res;
        if (data) {
          setCode(data.code || '');
          setName(data.name || '');
          setDisplayName(data.displayName || data.name || '');
          setDescription(data.description || '');
          setIsActive(data.isActive !== false);
        }
      } catch (err: any) {
        toast.error('Failed to load existing course details');
      } finally {
        setLoading(false);
      }
    }

    loadExistingCourse();
  }, [editId]);

  const handleRegenerateCode = () => {
    const newCode = generateUniqueCode();
    setCode(newCode);
    toast.info(`Generated new unique course code: ${newCode}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a Course Name');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter a Course Code');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        description: description.trim(),
        isActive,
      };

      if (editId) {
        // Update existing course
        await api.patch(`/master/courses/${editId}`, payload);
        toast.success('Course updated successfully!');
      } else {
        // Create new course
        const newCourse = await api.post<any>('/master/courses', payload);
        const courseObj = newCourse?.data || newCourse;

        // Optionally map branch and academic year
        if (courseObj?.id && branchId && academicYearId) {
          try {
            await api.post('/master/branch-courses', {
              courseId: courseObj.id,
              branchId,
              academicYearId,
            });
          } catch (e) {
            console.log('Branch course mapping ignored or already exists');
          }
        }

        toast.success('🎉 Course created successfully with unique code!');
      }

      router.push('/tenant-admin/courses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 font-bold">Loading course details...</div>;
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/tenant-admin/courses')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Courses
        </Button>
        <span className="text-xs font-semibold text-slate-400">
          {editId ? 'Edit Course Mode' : 'Create Course Mode'}
        </span>
      </div>

      {/* Signature Violet Gradient Hero Banner */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              {editId ? 'Course Editor' : 'Academic Course Creator'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            {editId ? `Edit Course: ${name || 'Details'} ✏️` : 'Create New Academic Course 📚'}
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Define course titles, auto-generate unique course codes, and assign branch curriculum mappings.
          </p>
        </div>
      </div>

      {/* Form Container (100% Mobile-First Card Design) */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Core Course Information Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Basic Course Specifications</h3>
              <p className="text-xs text-slate-500">Provide official course title, display name, and auto-generated unique code.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Unique Code Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">Unique Course Code *</label>
                {!editId && (
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto Generate
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  placeholder="e.g. CRS-NEET-5491"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="rounded-xl text-xs font-mono font-bold text-violet-900 bg-violet-50/50 border-violet-200 uppercase"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                  AUTO UNIQUE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Unique identifier used in admissions and fee structures.</p>
            </div>

            {/* Course Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Official Course Name *</label>
              <Input
                placeholder="e.g. NEET Crash Course 2027"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!displayName) setDisplayName(e.target.value);
                }}
                required
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Display Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Short Display Name</label>
              <Input
                placeholder="e.g. NEET 2027"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Course Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="Medical / NEET">Medical / NEET</option>
                <option value="Engineering / JEE">Engineering / JEE</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Course Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="1 Year">1 Year Academic Program</option>
                <option value="2 Years">2 Years Integrated Program</option>
                <option value="6 Months">6 Months Crash Course</option>
                <option value="3 Months">3 Months Fast Track</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Overview / Description</label>
            <Input
              placeholder="Comprehensive coaching covering Physics, Chemistry, Botany, and Zoology with weekly mock exams."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>
        </Card>

        {/* Branch & Academic Year Mapping Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch & Academic Year Mapping</h3>
              <p className="text-xs text-slate-500">Link course directly to your primary branch and current academic session.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assign to Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {branches.length === 0 ? (
                  <option value="">Main Branch (Default)</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code || 'BRANCH'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Academic Year</label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {academicYears.length === 0 ? (
                  <option value="">2026-2027 Session</option>
                ) : (
                  academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} ({ay.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </Card>

        {/* Action Footer Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/courses')}
            className="rounded-xl text-xs font-bold text-slate-700 w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs gap-2 w-full sm:w-auto py-3 sm:py-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Saving Course...' : editId ? 'Update & Save Changes' : 'Save & Publish Course'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <Suspense fallback={<div className="p-6 text-slate-500 font-bold">Loading course creation form...</div>}>
          <CourseFormBody />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
