'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { tutorSchema } from '../validation/tutor-schema';
import type { Tutor, CreateTutorInput } from '../types/tutor';
import { useSubjects, useBranches } from '../hooks/use-tutors';
import {
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
} from '@/features/admissions/hooks/use-admissions';
import { useBatches, useCourses } from '@/features/students/hooks/use-students';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { useCourseSubjects } from '@/features/master-data/hooks/use-course-subjects';
import {
  ArrowLeft,
  User,
  Briefcase,
  BookOpen,
  Building2,
  Check,
  Save,
  GraduationCap,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: Tutor | null;
  onSubmit: (data: CreateTutorInput) => Promise<void>;
  isSubmitting: boolean;
}

export function TutorDialog({
  open,
  onOpenChange,
  tutor,
  onSubmit,
  isSubmitting,
}: TutorDialogProps) {
  const { data: subjects } = useSubjects();
  const { data: branches } = useBranches();
  const { branches: admissionBranches } = useBranchesForAdmission();
  const { years: academicYears } = useAcademicYearsForAdmission();
  const { batches } = useBatches();
  const { courses } = useCourses();
  const { data: branchCourses = [] } = useBranchCourses();

  const loadedKeyRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTutorInput>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      employeeCode: '',
      designation: '',
      qualification: '',
      specialization: '',
      yearsOfExperience: undefined,
      previousInstitution: '',
      bio: '',
      createLogin: undefined,
      subjectIds: undefined,
      branchIds: undefined,
      academicYearId: '',
      branchId: '',
      courseId: '',
      batchId: '',
    },
  });

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const createLogin = watch('createLogin');
  const academicYearId = watch('academicYearId');
  const selectedCourseId = watch('courseId');

  const { data: courseSubjects = [] } = useCourseSubjects(selectedCourseId || '', {
    enabled: !!selectedCourseId,
  });

  useEffect(() => {
    register('subjectIds');
    register('branchIds');
    register('academicYearId');
    register('branchId');
    register('courseId');
    register('batchIds' as any);
  }, [register]);

  useEffect(() => {
    if (!open) {
      loadedKeyRef.current = null;
      return;
    }

    if (tutor) {
      const subjectIds = tutor.subjects?.map((s: any) => s.subjectId) || [];
      const branchIds = tutor.branches?.map((b: any) => b.branchId) || [];
      const batchIds = tutor.batchAssignments?.map((b: any) => b.batchId) || [];

      const primaryBranchId = branchIds[0] || (tutor.branches?.[0] as any)?.branchId || '';
      const primaryBatchId = batchIds[0] || (tutor.batchAssignments?.[0] as any)?.batchId || '';
      const matchedBatch =
        (batches ?? []).find((b: any) => b.id === primaryBatchId) ||
        (tutor.batchAssignments?.[0] as any)?.batch ||
        (batches ?? [])[0];

      const derivedCourseId = matchedBatch?.courseId || (courses ?? [])[0]?.id || '';
      const derivedBranchId =
        primaryBranchId || matchedBatch?.branchId || (admissionBranches ?? [])[0]?.id || '';
      const derivedYearId = matchedBatch?.academicYearId || (academicYears ?? [])[0]?.id || '';

      const key = `${tutor.id}-${tutor.designation || ''}-${tutor.specialization || ''}-${derivedYearId}-${derivedBranchId}-${derivedCourseId}-${batchIds.join(',')}-${open}`;

      if (loadedKeyRef.current !== key) {
        loadedKeyRef.current = key;

        setSelectedSubjectIds(subjectIds);
        setSelectedBranchIds(
          branchIds.length > 0 ? branchIds : derivedBranchId ? [derivedBranchId] : [],
        );
        setSelectedBatchIds(batchIds);

        reset({
          firstName: tutor.firstName || '',
          lastName: tutor.lastName || '',
          email: tutor.email || '',
          phone: tutor.phone || (tutor as any).workPhone || (tutor as any).phoneNumber || '',
          employeeCode: tutor.employeeCode || '',
          designation: tutor.designation || '',
          qualification: tutor.qualification || '',
          specialization: tutor.specialization || '',
          yearsOfExperience: tutor.yearsOfExperience ?? undefined,
          previousInstitution: tutor.previousInstitution || '',
          bio: tutor.bio || '',
          createLogin: tutor.createdLogin ?? true,
          subjectIds,
          branchIds: branchIds.length > 0 ? branchIds : derivedBranchId ? [derivedBranchId] : [],
          academicYearId: derivedYearId,
          branchId: derivedBranchId,
          courseId: derivedCourseId,
          batchId: primaryBatchId,
          batchIds,
        } as any);
      }
    } else {
      const defaultYear = (academicYears ?? [])[0]?.id || '';
      const defaultBranch = (admissionBranches ?? [])[0]?.id || '';
      const defaultCourse = (courses ?? [])[0]?.id || '';
      const key = `new-${defaultYear}-${defaultBranch}-${defaultCourse}-${open}`;

      if (loadedKeyRef.current !== key) {
        loadedKeyRef.current = key;

        const autoEmpCode = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;

        setSelectedSubjectIds([]);
        setSelectedBranchIds(defaultBranch ? [defaultBranch] : []);
        setSelectedBatchIds([]);
        reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          employeeCode: autoEmpCode,
          designation: '',
          qualification: '',
          specialization: '',
          yearsOfExperience: undefined,
          previousInstitution: '',
          bio: '',
          createLogin: true,
          subjectIds: undefined,
          branchIds: defaultBranch ? [defaultBranch] : undefined,
          academicYearId: defaultYear,
          branchId: defaultBranch,
          courseId: defaultCourse,
          batchId: '',
          batchIds: [],
        } as any);
      }
    }
  }, [tutor, open, batches, courses, academicYears, admissionBranches, reset]);

  const toggleSubject = (id: string) => {
    const next = selectedSubjectIds.includes(id)
      ? selectedSubjectIds.filter((s) => s !== id)
      : [...selectedSubjectIds, id];
    setSelectedSubjectIds(next);
    setValue('subjectIds', next);
  };

  const toggleBatch = (id: string) => {
    const next = selectedBatchIds.includes(id)
      ? selectedBatchIds.filter((b) => b !== id)
      : [...selectedBatchIds, id];
    setSelectedBatchIds(next);
    setValue('batchIds' as any, next);
  };

  const selectedBranchId = watch('branchId');

  const branchFiltered = academicYearId
    ? (admissionBranches ?? []).filter((b: any) =>
        branchCourses.some(
          (bc: any) => bc.branchId === b.id && bc.academicYearId === academicYearId,
        ),
      )
    : [];
  const filteredBranches = branchFiltered.length > 0 ? branchFiltered : (admissionBranches ?? []);

  const courseFiltered =
    academicYearId && selectedBranchId
      ? (courses ?? []).filter((c: any) =>
          branchCourses.some(
            (bc: any) =>
              bc.courseId === c.id &&
              bc.branchId === selectedBranchId &&
              bc.academicYearId === academicYearId,
          ),
        )
      : [];
  const filteredCourses = courseFiltered.length > 0 ? courseFiltered : (courses ?? []);

  const courseSubjectIds = courseSubjects.map((cs: any) => cs.subjectId);
  const filteredSubjects =
    selectedCourseId && courseSubjectIds.length > 0
      ? (subjects ?? []).filter((s: any) => courseSubjectIds.includes(s.id))
      : (subjects ?? []);

  const courseBatches = selectedCourseId
    ? (batches ?? []).filter((b: any) => b.courseId === selectedCourseId)
    : [];
  const filteredBatches = courseBatches.length > 0 ? courseBatches : (batches ?? []);

  const onFormSubmit = async (data: CreateTutorInput) => {
    const { academicYearId, branchId, courseId, batchId, ...submitData } = data as any;

    await onSubmit({
      ...submitData,
      subjectIds: selectedSubjectIds.length > 0 ? selectedSubjectIds : undefined,
      branchIds: selectedBranchIds.length > 0 ? selectedBranchIds : undefined,
      batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="w-full space-y-6 text-[#0F172A] font-sans pb-12 animate-in fade-in duration-200">
      {/* Top Bar with Back Action */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="gap-2 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-2xs text-xs sm:text-sm font-extrabold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 text-[#0052CC]" />
          Back to Faculty Directory
        </Button>
      </div>

      {/* ISML LMS Light Blue Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-blue-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-[#0052CC] shadow-2xs">
            <Users className="h-6 w-6 text-[#0052CC]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 inline-block mb-1">
              {tutor ? 'Faculty Profile Setup' : 'New Tutor Registration'}
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold text-[#0B2447] leading-tight">
              {tutor
                ? `Edit Faculty: ${tutor.firstName} ${tutor.lastName}`
                : 'Register New Faculty Member'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 max-w-xl">
              {tutor
                ? 'Update personal details, professional qualifications, subject specializations, and batch assignments.'
                : 'Fill in the details below to register a new teaching faculty member and assign their initial batches.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* SECTION 1: Personal Information */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Personal Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Basic identity and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Arun"
                  {...register('firstName')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
                {errors.firstName && (
                  <p className="text-xs text-rose-600 font-bold">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Kumar"
                  {...register('lastName')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
                {errors.lastName && (
                  <p className="text-xs text-rose-600 font-bold">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. arun.kumar@example.com"
                  {...register('email')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 font-bold">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. +919876543210"
                  {...register('phone')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 font-bold">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="space-y-0.5">
                <Label className="text-xs font-extrabold text-[#0B2447]">Create Login Access</Label>
                <p className="text-xs text-slate-500 font-medium">
                  Allow this tutor to access the platform
                </p>
              </div>
              <Switch checked={!!createLogin} onCheckedChange={(v) => setValue('createLogin', v)} />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Professional Information */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Professional Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Employment and academic qualifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="employeeCode"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                  >
                    Employee Code
                  </Label>
                  <span className="text-[10px] font-mono font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Auto-Generated
                  </span>
                </div>
                <Input
                  id="employeeCode"
                  readOnly
                  disabled
                  placeholder="e.g. FAC-1001"
                  {...register('employeeCode')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-100 cursor-not-allowed font-mono font-extrabold text-[#0052CC] border-slate-200 select-none text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="designation"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Designation
                </Label>
                <Input
                  id="designation"
                  placeholder="e.g. Senior Physics Faculty"
                  {...register('designation')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="qualification"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Highest Qualification
                </Label>
                <Input
                  id="qualification"
                  placeholder="e.g. M.Sc Physics"
                  {...register('qualification')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="specialization"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Mechanics, Electrodynamics"
                  {...register('specialization')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="yearsOfExperience"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Years of Experience
                </Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  placeholder="e.g. 8"
                  {...register('yearsOfExperience')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="previousInstitution"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Previous Institution
                </Label>
                <Input
                  id="previousInstitution"
                  placeholder="e.g. Previous Institute"
                  {...register('previousInstitution')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="bio"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Professional bio, achievements, and teaching philosophy..."
                {...register('bio')}
                className="rounded-xl bg-slate-50 border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Batch Assignment */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Batch Assignment
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Assign the tutor to a specific academic year, branch, course, and batch
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Academic Year */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Academic Year
                </Label>
                <Select
                  value={academicYearId || ''}
                  onValueChange={(val) => {
                    setValue('academicYearId', val);
                    setValue('branchId', '');
                    setValue('courseId', '');
                    setValue('batchId', '');
                  }}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium focus:border-[#0052CC]">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {(academicYears ?? []).map((year: any) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Branch
                </Label>
                <Select
                  value={selectedBranchId || ''}
                  onValueChange={(val) => {
                    setValue('branchId', val);
                    setValue('courseId', '');
                    setValue('batchId', '');
                    setSelectedBranchIds([val]);
                    setValue('branchIds', [val]);
                  }}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium focus:border-[#0052CC]">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {filteredBranches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Course */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Course
                </Label>
                <Select
                  value={selectedCourseId || ''}
                  onValueChange={(val) => {
                    setValue('courseId', val);
                    setValue('batchIds' as any, []);
                    setSelectedBatchIds([]);
                  }}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium focus:border-[#0052CC]">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {filteredCourses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batches Selection (Multi-Select Grid) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Assigned Batches (Select Multiple)
                </Label>
                {selectedCourseId ? (
                  filteredBatches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                      {filteredBatches.map((b: any) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBatch(b.id)}
                          className={cn(
                            'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                            selectedBatchIds.includes(b.id)
                              ? 'border-[#0052CC] bg-blue-50/60 text-[#0052CC] font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                              selectedBatchIds.includes(b.id)
                                ? 'border-[#0052CC] bg-[#0052CC]'
                                : 'border-slate-300',
                            )}
                          >
                            {selectedBatchIds.includes(b.id) && (
                              <Check className="h-3 w-3 text-white stroke-[3]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold truncate text-[#0B2447]">
                              {b.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{b.code}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 border border-dashed rounded-xl font-medium">
                      No active batches found for this course.
                    </p>
                  )
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 border border-dashed rounded-xl font-medium">
                    Select a course first to view and assign batches.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Teaching Assignments */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0052CC]" />
              <CardTitle className="text-sm sm:text-base font-extrabold text-[#0B2447]">
                Teaching Assignments
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Subjects the tutor can teach and assigned campus branches
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {selectedCourseId ? (
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Subjects this tutor can teach
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSubjects.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        selectedSubjectIds.includes(s.id)
                          ? 'border-[#0052CC] bg-blue-50/60 text-[#0052CC] font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          selectedSubjectIds.includes(s.id)
                            ? 'border-[#0052CC] bg-[#0052CC]'
                            : 'border-slate-300',
                        )}
                      >
                        {selectedSubjectIds.includes(s.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[#0B2447]">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 font-medium text-center py-6">
                Select a course in Batch Assignment above to see subjects
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Controls Footer Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl h-11 px-6 font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl h-11 px-8 shadow-2xs gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? 'Saving Faculty Member...'
              : tutor
                ? 'Update Faculty Details'
                : 'Save & Register Faculty Member'}
          </Button>
        </div>
      </form>
    </div>
  );
}
