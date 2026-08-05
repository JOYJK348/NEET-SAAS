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

  const toggleBranch = (id: string) => {
    const next = selectedBranchIds.includes(id)
      ? selectedBranchIds.filter((b) => b !== id)
      : [...selectedBranchIds, id];
    setSelectedBranchIds(next);
    setValue('branchIds', next);
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
    // Destructure and omit UI-only variables that are not expected by the backend DTO
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
    <div className="space-y-6 w-full p-4 lg:p-6 pb-12 animate-in fade-in duration-200">
      {/* Top Bar with Back Action */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="gap-2 rounded-xl border-[#E5E7EB] bg-white hover:bg-slate-50 shadow-xs text-xs sm:text-sm font-bold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
          Back to Faculty Directory
        </Button>
      </div>

      {/* Signature Violet Gradient Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md shadow-violet-200">
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-white shadow-xs">
            <span className="text-xl sm:text-2xl">👨‍🏫</span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200 bg-white/15 px-3 py-1 rounded-full border border-white/20">
              {tutor ? 'Faculty Profile Setup' : 'New Tutor Registration 🎓'}
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-white mt-2 leading-tight">
              {tutor
                ? `Edit Faculty: ${tutor.firstName} ${tutor.lastName}`
                : 'Register New Faculty Member'}
            </h1>
            <p className="text-xs sm:text-sm text-violet-100 font-medium mt-1 max-w-xl">
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
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold">
                Personal Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Basic identity and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Arun"
                  {...register('firstName')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Kumar"
                  {...register('lastName')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. arun.kumar@example.com"
                  {...register('email')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. +919876543210"
                  {...register('phone')}
                  className="h-10 sm:h-11 rounded-xl"
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Create Login Access</Label>
                <p className="text-xs text-muted-foreground">
                  Allow this tutor to access the platform
                </p>
              </div>
              <Switch checked={!!createLogin} onCheckedChange={(v) => setValue('createLogin', v)} />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Professional Information */}
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold">
                Professional Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Employment and academic qualifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="employeeCode" className="text-xs font-semibold">
                    Employee Code
                  </Label>
                  <span className="text-[10px] font-extrabold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200/80">
                    Auto-Generated (Disabled)
                  </span>
                </div>
                <Input
                  id="employeeCode"
                  readOnly
                  disabled
                  placeholder="e.g. FAC-1001"
                  {...register('employeeCode')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed font-mono font-bold text-slate-600 dark:text-slate-300 border-slate-200 select-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="designation" className="text-xs font-semibold">
                  Designation
                </Label>
                <Input
                  id="designation"
                  placeholder="e.g. Senior Physics Faculty"
                  {...register('designation')}
                  className="h-10 sm:h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="qualification" className="text-xs font-semibold">
                  Highest Qualification
                </Label>
                <Input
                  id="qualification"
                  placeholder="e.g. M.Sc Physics"
                  {...register('qualification')}
                  className="h-10 sm:h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="specialization" className="text-xs font-semibold">
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Mechanics, Electrodynamics"
                  {...register('specialization')}
                  className="h-10 sm:h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="yearsOfExperience" className="text-xs font-semibold">
                  Years of Experience
                </Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  placeholder="e.g. 8"
                  {...register('yearsOfExperience')}
                  className="h-10 sm:h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="previousInstitution" className="text-xs font-semibold">
                  Previous Institution
                </Label>
                <Input
                  id="previousInstitution"
                  placeholder="e.g. Previous Institute"
                  {...register('previousInstitution')}
                  className="h-10 sm:h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-semibold">
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Professional bio, achievements, and teaching philosophy..."
                {...register('bio')}
                className="rounded-xl"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Batch Assignment */}
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold">Batch Assignment</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Assign the tutor to a specific academic year, branch, course, and batch
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Academic Year */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Academic Year</Label>
                <Select
                  value={academicYearId || ''}
                  onValueChange={(val) => {
                    setValue('academicYearId', val);
                    setValue('branchId', '');
                    setValue('courseId', '');
                    setValue('batchId', '');
                  }}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label className="text-xs font-semibold">Branch</Label>
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
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label className="text-xs font-semibold">Course</Label>
                <Select
                  value={selectedCourseId || ''}
                  onValueChange={(val) => {
                    setValue('courseId', val);
                    setValue('batchIds' as any, []);
                    setSelectedBatchIds([]);
                  }}
                >
                  <SelectTrigger className="h-10 sm:h-11 rounded-xl">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label className="text-xs font-semibold">Assigned Batches (Select Multiple)</Label>
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
                              ? 'border-primary/50 bg-primary/5 text-primary shadow-2xs'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                              selectedBatchIds.includes(b.id)
                                ? 'border-primary bg-primary'
                                : 'border-gray-300',
                            )}
                          >
                            {selectedBatchIds.includes(b.id) && (
                              <Check className="h-3 w-3 text-white stroke-[3]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                              {b.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{b.code}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4 bg-muted/10 border border-dashed rounded-xl">
                      No active batches found for this course.
                    </p>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 border border-dashed rounded-xl">
                    Select a course first to view and assign batches.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Teaching Assignments */}
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/40 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold">
                Teaching Assignments
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Subjects the tutor can teach and assigned campus branches
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {selectedCourseId ? (
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Subjects this tutor can teach</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSubjects.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        selectedSubjectIds.includes(s.id)
                          ? 'border-primary/50 bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          selectedSubjectIds.includes(s.id)
                            ? 'border-primary bg-primary'
                            : 'border-gray-300',
                        )}
                      >
                        {selectedSubjectIds.includes(s.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
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
            className="w-full sm:w-auto rounded-xl h-11 px-6 font-bold border-[#E5E7EB] text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-11 px-8 shadow-xs gap-2"
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
