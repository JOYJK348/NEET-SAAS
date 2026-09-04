'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ChevronRight,
  Layers,
  Search,
  Plus,
  Bookmark,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  FileText,
  Upload,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Re-using Master Subjects components and hooks
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/master-data/hooks/use-subjects';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';

import type { Subject, CreateSubjectInput } from '@/features/master-data/types';

function CurriculumContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Master Subjects state
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({
    page: subjectPage,
    limit: 12,
  });

  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const handleCreateSubject = () => {
    router.push('/tenant-admin/subjects/new');
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectDialogOpen(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubjectMutation.mutateAsync(id);
        toast.success('Subject deleted successfully');
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete subject';
        toast.error(errorMsg);
      }
    }
  };

  const handleToggleSubjectStatus = async (s: Subject) => {
    try {
      await updateSubjectMutation.mutateAsync({
        id: s.id,
        input: {
          isActive: !s.isActive,
        } as any,
      });
      toast.success(`Subject ${!s.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSubjectFormSubmit = async (input: CreateSubjectInput) => {
    try {
      if (selectedSubject) {
        await updateSubjectMutation.mutateAsync({ id: selectedSubject.id, input });
        toast.success('Subject updated successfully');
      } else {
        await createSubjectMutation.mutateAsync(input);
        toast.success('Subject created successfully');
      }
      setSubjectDialogOpen(false);
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleManageSubjectSyllabus = async (subjectId: string) => {
    try {
      toast.loading('Opening Subject Builder...', { id: 'master-syllabus' });
      let targetCourseId = 'COURSE_NEET';
      try {
        const cs = await api.get<any>(`/master/subjects/${subjectId}/course-subject`);
        if (cs?.courseId) targetCourseId = cs.courseId;
      } catch (e) {
        console.log('Using default course for builder');
      }
      toast.dismiss('master-syllabus');
      router.push(`/tenant-admin/courses/${targetCourseId}/builder?subjectId=${subjectId}`);
    } catch {
      toast.dismiss('master-syllabus');
      router.push(`/tenant-admin/courses/COURSE_NEET/builder`);
    }
  };

  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleBulkImportSubmit = async () => {
    if (!bulkImportText.trim()) {
      toast.error('Please paste or enter subjects data');
      return;
    }

    setIsImporting(true);
    try {
      let subjectsPayload: any[] = [];
      try {
        const parsed = JSON.parse(bulkImportText);
        if (Array.isArray(parsed)) subjectsPayload = parsed;
      } catch {
        const lines = bulkImportText.split('\n');
        let currentSubject: { name: string; chapters: Array<{ name: string }> } | null = null;
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          if (line.toLowerCase().startsWith('subject:') || line.endsWith(':')) {
            const subjName = line
              .replace(/^(subject:|\s*)/i, '')
              .replace(/:$/, '')
              .trim();
            if (subjName) {
              currentSubject = { name: subjName, chapters: [] };
              subjectsPayload.push(currentSubject);
            }
          } else if (line.startsWith('-') || line.startsWith('*') || /^[0-9]+\./.test(line)) {
            const chName = line.replace(/^[-*0-9.]+\s*/, '').trim();
            if (chName) {
              if (!currentSubject) {
                currentSubject = { name: 'General Subject', chapters: [] };
                subjectsPayload.push(currentSubject);
              }
              currentSubject.chapters.push({ name: chName });
            }
          } else {
            if (!currentSubject) {
              currentSubject = { name: line, chapters: [] };
              subjectsPayload.push(currentSubject);
            } else {
              currentSubject.chapters.push({ name: line });
            }
          }
        }
      }

      if (subjectsPayload.length === 0) {
        toast.error('Could not parse any valid subjects from input');
        setIsImporting(false);
        return;
      }

      const res = await api.post<any>('/master/subjects/bulk', subjectsPayload);
      toast.success(
        `Successfully imported ${res.count || subjectsPayload.length} Master Subjects with chapters!`,
      );
      setBulkImportOpen(false);
      setBulkImportText('');
      window.location.reload();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to bulk import subjects';
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const totalSubjectsCount = subjectsData?.meta?.total ?? (subjectsData?.data?.length || 0);
  const activeSubjectsCount =
    subjectsData?.data?.filter((s) => s.isActive).length ?? totalSubjectsCount;

  const filteredSubjects = (subjectsData?.data ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.displayName && s.displayName.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Management Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Curriculum & Master Subjects</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              Master Subjects Repository
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Manage master syllabus subjects, chapter structures, and learning topics for NEET
              programs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <Button
              onClick={() => setBulkImportOpen(true)}
              className="w-full sm:w-auto justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs rounded-xl text-xs h-9 px-3 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#0052CC] shrink-0" />
              <span className="truncate">Bulk Import</span>
            </Button>
            <Button
              onClick={handleCreateSubject}
              className="w-full sm:w-auto justify-center gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs h-9 px-3 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white shrink-0" />
              <span className="truncate">Add Subject</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Master Subjects
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {totalSubjectsCount}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Subjects
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {activeSubjectsCount}
              </p>
            </div>
          </Card>

          <Card
            onClick={() => router.push('/tenant-admin/subjects')}
            className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs flex items-center gap-3 cursor-pointer transition-all hover:border-[#0052CC]/40 group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0 group-hover:bg-[#0052CC] group-hover:text-white transition-colors">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                Go to Full Library <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              </p>
              <p className="text-xs font-extrabold text-[#0052CC] mt-1">View & Manage Subjects</p>
            </div>
          </Card>
        </div>

        {/* Search Strip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search master subjects by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs font-extrabold text-slate-500 hidden sm:block">
              Showing {filteredSubjects.length} Subject(s)
            </span>
          </div>
        </div>

        {/* Master Subjects Content Grid */}
        {subjectsLoading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading master subjects...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-200">
              <Bookmark className="w-6 h-6 text-[#0052CC]" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B2447]">No master subjects found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              {search
                ? 'Try a different search query.'
                : 'Click "Add Master Subject" to create core syllabus subjects.'}
            </p>
            <Button
              onClick={handleCreateSubject}
              className="gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs"
            >
              <Plus className="h-4 w-4" /> Add Master Subject
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubjects.map((s) => (
                <Card
                  key={s.id}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Header Strip */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-4 text-slate-900 border-b border-blue-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="h-5 w-5 text-[#0052CC]" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditSubject(s)}
                          className="p-1.5 text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
                          title="Edit subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(s.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="font-mono font-extrabold text-[#0052CC] bg-white px-2 py-0.5 rounded-md border border-blue-200 text-[10px] inline-block uppercase">
                        {s.code}
                      </span>
                      <h3 className="text-base font-extrabold text-[#0B2447] mt-1.5 leading-snug line-clamp-1">
                        {s.name}
                      </h3>
                    </div>
                  </div>

                  {/* Subject Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                      {s.displayName || 'No display name configured.'}
                    </p>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#0052CC]" />
                          {(s as any)._count?.chapters ?? 0} Chapters •{' '}
                          {(s as any)._count?.topics ?? 0} Topics
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Type: {s.subjectType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSubjectStatus(s)}
                            className={cn(
                              'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                              s.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                            )}
                            title="Toggle status"
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out',
                                s.isActive ? 'translate-x-3' : 'translate-x-0',
                              )}
                            />
                          </button>
                          <span
                            className={cn(
                              'text-[10px] font-extrabold uppercase tracking-wider',
                              s.isActive ? 'text-emerald-600' : 'text-slate-400',
                            )}
                          >
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleManageSubjectSyllabus(s.id)}
                          className="text-[11px] font-extrabold text-white bg-[#0052CC] hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          Open Subject Builder <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {subjectsData?.meta && subjectsData.meta.lastPage > 1 && (
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-2xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subjectPage <= 1}
                  onClick={() => setSubjectPage(subjectPage - 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-500">
                  Page {subjectPage} of {subjectsData.meta.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subjectPage >= subjectsData.meta.lastPage}
                  onClick={() => setSubjectPage(subjectPage + 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Bulk Import Subjects Modal */}
        {bulkImportOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                    <FileSpreadsheet className="w-5 h-5 text-[#0052CC]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0B2447]">
                      Bulk Import Master Subjects & Chapters
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Paste structured subjects with chapters to import all at once!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBulkImportOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Paste Format (Text list or JSON Array):
                  </label>
                  <span className="text-[10px] text-[#0052CC] font-mono font-extrabold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Auto-Detects Subjects & Chapters
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono space-y-1">
                  <p className="font-bold text-[#0B2447]">Sample Text Format:</p>
                  <pre className="text-[10px] text-slate-500 overflow-x-auto">
                    {`Subject: Physics
- Physical World and Measurement
- Kinematics & Motion
- Laws of Motion

Subject: Chemistry
- Some Basic Concepts of Chemistry
- Structure of Atom`}
                  </pre>
                </div>

                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  rows={8}
                  placeholder={`Subject: Physics\n- Physical World and Measurement\n- Kinematics & Motion\n- Laws of Motion\n\nSubject: Chemistry\n- Some Basic Concepts of Chemistry\n- Structure of Atom`}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkImportOpen(false)}
                  className="rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isImporting}
                  onClick={handleBulkImportSubmit}
                  className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs px-5 shadow-2xs"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Import All Subjects & Chapters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog Form for Subject Create/Edit */}
        <SubjectDialog
          open={subjectDialogOpen}
          onOpenChange={setSubjectDialogOpen}
          subject={selectedSubject}
          onSubmit={handleSubjectFormSubmit}
          isSubmitting={createSubjectMutation.isPending || updateSubjectMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}

export default function CurriculumPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CurriculumContent />
    </ProtectedRoute>
  );
}
