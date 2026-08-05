'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Bookmark,
  Sparkles,
  Edit2,
  Trash2,
  X,
  FileText,
  Upload,
  FileSpreadsheet,
  Loader2,
  Layers,
  ChevronRight,
  BookOpen,
  ListPlus,
} from 'lucide-react';
import {
  useSubjects,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/master-data/hooks/use-subjects';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';
import { toast } from 'sonner';
import type { Subject, CreateSubjectInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

function SubjectsContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Bulk Import state
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Master Subject Chapters Modal state
  const [chaptersModalOpen, setChaptersModalOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [masterCourseSubject, setMasterCourseSubject] = useState<any | null>(null);
  const [loadingSubjectDetails, setLoadingSubjectDetails] = useState(false);

  const [newChName, setNewChName] = useState('');
  const [newChHours, setNewChHours] = useState(10);
  const [newChSessions, setNewChSessions] = useState(8);
  const [showBulkPasteDrawer, setShowBulkPasteDrawer] = useState(false);
  const [bulkChaptersText, setBulkChaptersText] = useState('');
  const [isSubmittingCh, setIsSubmittingCh] = useState(false);

  const handleManageChapters = async (s: Subject) => {
    setActiveSubject(s);
    setLoadingSubjectDetails(true);
    setChaptersModalOpen(true);
    try {
      const cs = await api.get<any>(`/master/subjects/${s.id}/course-subject`);
      setMasterCourseSubject(cs);
    } catch {
      toast.error('Failed to load master syllabus details');
    } finally {
      setLoadingSubjectDetails(false);
    }
  };

  const handleAddSingleChapter = async () => {
    if (!newChName.trim() || !masterCourseSubject) return;
    setIsSubmittingCh(true);
    try {
      const cleanName = newChName.trim();
      const codePrefix =
        cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CH';
      const existing = masterCourseSubject.chapters || [];
      const order = existing.length + 1;

      await api.post('/master/chapters', {
        courseSubjectId: masterCourseSubject.id,
        name: cleanName,
        code: `CH-${codePrefix}-${order}`,
        plannedHours: newChHours || 10,
        estimatedSessions: newChSessions || 8,
        displayOrder: order,
      });

      toast.success('Chapter added successfully!');
      setNewChName('');
      const cs = await api.get<any>(`/master/subjects/${activeSubject!.id}/course-subject`);
      setMasterCourseSubject(cs);
      void refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add chapter');
    } finally {
      setIsSubmittingCh(false);
    }
  };

  const handleProcessBulkChapters = async () => {
    if (!bulkChaptersText.trim() || !masterCourseSubject) return;
    setIsSubmittingCh(true);
    try {
      const lines = bulkChaptersText
        .split('\n')
        .map((l) => l.trim().replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, ''))
        .filter(Boolean);

      const existing = masterCourseSubject.chapters || [];
      let order = existing.length + 1;

      for (const name of lines) {
        const cleanName = name.trim();
        const codePrefix =
          cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CH';
        await api.post('/master/chapters', {
          courseSubjectId: masterCourseSubject.id,
          name: cleanName,
          code: `CH-${codePrefix}-${order}`,
          plannedHours: 10,
          estimatedSessions: 8,
          displayOrder: order++,
        });
      }

      toast.success(`Successfully added ${lines.length} chapters!`);
      setBulkChaptersText('');
      setShowBulkPasteDrawer(false);
      const cs = await api.get<any>(`/master/subjects/${activeSubject!.id}/course-subject`);
      setMasterCourseSubject(cs);
      void refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process bulk chapters');
    } finally {
      setIsSubmittingCh(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      await api.delete(`/master/chapters/${chapterId}`);
      toast.success('Chapter deleted');
      const cs = await api.get<any>(`/master/subjects/${activeSubject!.id}/course-subject`);
      setMasterCourseSubject(cs);
      void refetch();
    } catch {
      toast.error('Failed to delete chapter');
    }
  };

  const { data: subjectsData, isLoading, refetch } = useSubjects({
    page,
    limit: 12,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const handleCreate = () => {
    router.push('/tenant-admin/subjects/new');
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Subject deleted successfully');
        void refetch();
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete subject';
        toast.error(errorMsg);
      }
    }
  };

  const handleToggleStatus = async (s: Subject) => {
    try {
      await updateMutation.mutateAsync({
        id: s.id,
        input: {
          isActive: !s.isActive,
        } as any,
      });
      toast.success(`Subject ${!s.isActive ? 'activated' : 'deactivated'} successfully`);
      void refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleFormSubmit = async (input: CreateSubjectInput) => {
    try {
      if (selectedSubject) {
        await updateMutation.mutateAsync({ id: selectedSubject.id, input });
        toast.success('Subject updated successfully');
        void refetch();
      }
      setDialogOpen(false);
    } catch {
      toast.error('Operation failed');
    }
  };

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
        if (Array.isArray(parsed)) {
          subjectsPayload = parsed.map((item) =>
            typeof item === 'string' ? { name: item.trim() } : { name: item.name || item.title }
          );
        }
      } catch {
        const lines = bulkImportText.split(/\n|,/);
        for (const rawLine of lines) {
          const name = rawLine
            .replace(/^(subject:|\s*)/i, '')
            .replace(/^[-*0-9.]+\s*/, '')
            .replace(/:$/, '')
            .trim();
          if (name) {
            subjectsPayload.push({ name });
          }
        }
      }

      if (subjectsPayload.length === 0) {
        toast.error('Could not parse any valid subjects from input');
        setIsImporting(false);
        return;
      }

      const res = await api.post<any>('/master/subjects/bulk', subjectsPayload);
      const importedCount = res.count ?? subjectsPayload.length;
      const skippedCount = res.skipped ?? 0;

      if (skippedCount > 0) {
        toast.success(
          `Imported ${importedCount} Master Subjects (${skippedCount} duplicates skipped)!`,
        );
      } else {
        toast.success(`Successfully imported ${importedCount} Master Subjects!`);
      }
      setBulkImportOpen(false);
      setBulkImportText('');
      void refetch();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to bulk import subjects';
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const totalCount = subjectsData?.meta?.total ?? subjectsData?.data?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Master Repository
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Master Subjects & Chapters Library 📚
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Create core subjects (Physics, Chemistry, Botany, Zoology...), add chapters & topics, or bulk import.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={() => setBulkImportOpen(true)}
              className="w-full sm:w-auto gap-2 bg-white/20 hover:bg-white/30 text-white font-bold border border-white/20 shadow-xs shrink-0 rounded-xl text-xs"
            >
              <Upload className="h-4 w-4 text-violet-100" /> Bulk Import 📥
            </Button>
            <Button
              onClick={handleCreate}
              className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs shrink-0 rounded-xl text-xs"
            >
              <Plus className="h-4 w-4 text-violet-600" /> Add Master Subject
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search master subjects by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-bold text-slate-500 self-end sm:self-auto">
            Total Subjects: <strong className="text-violet-700">{totalCount}</strong>
          </span>
        </div>

        {/* Subjects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : !subjectsData?.data || subjectsData.data.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No master subjects found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Get started by adding your first subject or bulk importing syllabus subjects.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                onClick={() => setBulkImportOpen(true)}
                variant="outline"
                className="gap-2 text-xs font-bold rounded-xl"
              >
                <Upload className="h-4 w-4" /> Bulk Import
              </Button>
              <Button
                onClick={handleCreate}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
              >
                <Plus className="h-4 w-4" /> Add Master Subject
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjectsData.data.map((s) => (
                <Card
                  key={s.id}
                  className="group relative rounded-2xl overflow-hidden border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Header Strip */}
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(s)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                          title="Edit subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors"
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] font-black tracking-widest uppercase text-violet-200 bg-white/10 px-2 py-0.5 rounded-md">
                        {s.code}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5 leading-snug line-clamp-1">
                        {s.name}
                      </h3>
                    </div>
                  </div>

                  {/* Subject Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {s.displayName || 'No display name configured.'}
                    </p>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1">
                          <Layers className="w-3 h-3 text-violet-600" />
                          {(s as any)._count?.chapters ?? 0} Chapters • {(s as any)._count?.topics ?? 0} Topics
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Type: {s.subjectType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s)}
                            className={cn(
                              'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                              s.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                            )}
                            title="Toggle status"
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out',
                                s.isActive ? 'translate-x-3' : 'translate-x-0',
                              )}
                            />
                          </button>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider',
                              s.isActive ? 'text-emerald-600' : 'text-slate-400',
                            )}
                          >
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push(`/tenant-admin/subjects/${s.id}`)}
                          className="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Manage Syllabus & Chapters 📚
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {subjectsData.meta && subjectsData.meta.lastPage > 1 && (
              <div className="flex justify-between items-center bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-500">
                  Page {page} of {subjectsData.meta.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= subjectsData.meta.lastPage}
                  onClick={() => setPage(page + 1)}
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Bulk Import Master Subjects
                    </h3>
                    <p className="text-xs text-slate-400">
                      Paste list of master subjects to create them all at once!
                    </p>
                  </div>
                </div>
                <button onClick={() => setBulkImportOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Paste Format (One Subject per line or Comma list):
                  </label>
                  <span className="text-[10px] text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-md">
                    Bulk Master Subjects List
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 font-mono space-y-1">
                  <p className="font-bold text-slate-700">Sample Format:</p>
                  <pre className="text-[10px] text-slate-500 overflow-x-auto">
{`Physics
Chemistry
Biology
Botany
Zoology
Mathematics`}
                  </pre>
                </div>

                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  rows={8}
                  placeholder={`Physics\nChemistry\nBiology\nBotany\nZoology\nMathematics`}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs px-5"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import Master Subjects
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Master Subject Chapters & Topics Modal */}
        {chaptersModalOpen && activeSubject && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{activeSubject.name}</h3>
                      <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
                        {activeSubject.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Manage master chapters & topics. All course programs auto-clone these chapters!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChaptersModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {loadingSubjectDetails ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                    Loading master chapters...
                  </div>
                ) : (
                  <>
                    {/* Inline Add Chapter & Bulk Paste Header */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-violet-600" /> Add New Master Chapter
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBulkPasteDrawer(!showBulkPasteDrawer)}
                          className="text-xs font-bold text-violet-700 hover:bg-violet-100/60 gap-1.5 h-7 px-2.5 rounded-lg"
                        >
                          <ListPlus className="w-3.5 h-3.5 text-violet-600" />
                          {showBulkPasteDrawer ? 'Hide Bulk Paste' : 'Quick Bulk Paste'}
                        </Button>
                      </div>

                      {showBulkPasteDrawer && (
                        <div className="p-3 bg-white rounded-xl border border-violet-200 space-y-2">
                          <textarea
                            value={bulkChaptersText}
                            onChange={(e) => setBulkChaptersText(e.target.value)}
                            rows={4}
                            placeholder={`1. Physical World and Measurement\n2. Kinematics & Motion\n3. Laws of Motion`}
                            className="w-full p-2.5 rounded-lg border border-violet-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSubmittingCh}
                              onClick={handleProcessBulkChapters}
                              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl"
                            >
                              {isSubmittingCh ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              Add Bulk Chapters
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={newChName}
                          onChange={(e) => setNewChName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingleChapter();
                            }
                          }}
                          placeholder="Chapter name (e.g. Laws of Motion)..."
                          className="w-full h-9 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 flex-1"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Hours:</span>
                            <input
                              type="number"
                              min={1}
                              value={newChHours}
                              onChange={(e) => setNewChHours(parseInt(e.target.value, 10) || 10)}
                              className="w-8 text-xs font-bold border-0 bg-transparent text-center focus:outline-none"
                            />
                          </div>
                          <Button
                            type="button"
                            disabled={isSubmittingCh}
                            onClick={handleAddSingleChapter}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl h-9 px-4 shrink-0 gap-1"
                          >
                            {isSubmittingCh ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Add Chapter
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Master Chapters List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                        <span>
                          Configured Chapters ({masterCourseSubject?.chapters?.length ?? 0}):
                        </span>
                      </div>

                      {!masterCourseSubject?.chapters || masterCourseSubject.chapters.length === 0 ? (
                        <div className="p-8 text-center border border-dashed rounded-2xl border-slate-200 bg-white">
                          <p className="text-xs font-bold text-slate-400">No chapters added yet.</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Use the box above to add chapters.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {masterCourseSubject.chapters.map((ch: any, idx: number) => (
                            <div
                              key={ch.id}
                              className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-violet-300 transition-all space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">{ch.name}</h4>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {ch.code}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteChapter(ch.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Delete chapter"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
                <Button
                  type="button"
                  onClick={() => setChaptersModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-5"
                >
                  Done & Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog Form for Edit Subject */}
        <SubjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          subject={selectedSubject}
          onSubmit={handleFormSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}

export default function SubjectsPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <SubjectsContent />
    </ProtectedRoute>
  );
}
