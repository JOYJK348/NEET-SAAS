'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  BookOpen,
  CheckCircle,
  IndianRupee,
  Calendar,
  Sparkles,
  Download,
  Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PYQItem {
  id: string;
  title: string;
  year: number;
  courseId?: string | null;
  courseName?: string | null;
  batchId?: string | null;
  batchName?: string | null;
  subjectId: string;
  subjectName: string;
  examType: string;
  paperUrl: string;
  solutionUrl?: string | null;
  price: number;
  isPaid: boolean;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
}

export default function TenantAdminPyqPage() {
  const router = useRouter();
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [subjectName, setSubjectName] = useState('Physics');
  const [examType, setExamType] = useState('NEET');
  const [paperUrl, setPaperUrl] = useState('');
  const [solutionUrl, setSolutionUrl] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(99);
  const [description, setDescription] = useState('');

  const fetchPyqs = async () => {
    try {
      setLoading(true);
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const endpoints = [
        '/pyq',
        `/api/v1/pyq`,
        `http://${host}:3000/api/v1/pyq`,
        `/v1/pyq`,
        `http://${host}:3000/v1/pyq`,
      ];

      for (const url of endpoints) {
        try {
          const res = await api.get<PYQItem[]>(url, { skipGlobalToast: true });
          const data = Array.isArray(res) ? res : (res as any)?.data || [];
          setPyqs(data);
          return;
        } catch {}
      }
      setPyqs([]);
    } catch (err) {
      console.error('Failed to fetch PYQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPyqs();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !paperUrl.trim()) {
      toast.error('Please enter title and paper URL');
      return;
    }

    try {
      setSubmitting(true);
      const subjectId = `subj_${subjectName.toLowerCase()}`;
      const payload = {
        title,
        year: Number(year),
        subjectId,
        subjectName,
        examType,
        paperUrl,
        solutionUrl: solutionUrl.trim() || undefined,
        price: isPaid ? Number(price) : 0,
        isPaid,
        description: description.trim() || undefined,
      };

      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const endpoints = [
        '/pyq',
        `/api/v1/pyq`,
        `http://${host}:3000/api/v1/pyq`,
        `/v1/pyq`,
        `http://${host}:3000/v1/pyq`,
      ];

      let success = false;
      for (const url of endpoints) {
        try {
          await api.post(url, payload, { skipGlobalToast: true });
          success = true;
          break;
        } catch {}
      }

      if (!success) {
        await api.post('/pyq', payload);
      }

      toast.success('Question paper uploaded successfully!');
      setIsUploadOpen(false);
      resetForm();
      fetchPyqs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload question paper');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (paper: PYQItem) => {
    const nextState = !paper.isActive;
    // Optimistic UI update
    setPyqs((prev) =>
      prev.map((p) => (p.id === paper.id ? { ...p, isActive: nextState } : p)),
    );

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const endpoints = [
        `/pyq/${paper.id}/toggle-status`,
        `/api/v1/pyq/${paper.id}/toggle-status`,
        `http://${host}:3000/api/v1/pyq/${paper.id}/toggle-status`,
        `/v1/pyq/${paper.id}/toggle-status`,
        `http://${host}:3000/v1/pyq/${paper.id}/toggle-status`,
      ];

      let success = false;
      for (const url of endpoints) {
        try {
          await api.patch(url, { isActive: nextState }, { skipGlobalToast: true });
          success = true;
          break;
        } catch {}
      }

      if (!success) {
        await api.patch(`/pyq/${paper.id}/toggle-status`, { isActive: nextState });
      }

      toast.success(
        nextState
          ? `Question paper activated (visible to students)`
          : `Question paper deactivated (hidden from students)`,
      );
    } catch (err: any) {
      // Revert optimistic update on failure
      setPyqs((prev) =>
        prev.map((p) => (p.id === paper.id ? { ...p, isActive: paper.isActive } : p)),
      );
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string, paperTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${paperTitle}"?`)) return;
    try {
      await api.delete(`/pyq/${id}`);
      toast.success('Question paper deleted');
      setPyqs((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error('Failed to delete paper');
    }
  };

  const resetForm = () => {
    setTitle('');
    setYear(2024);
    setSubjectName('Physics');
    setExamType('NEET');
    setPaperUrl('');
    setSolutionUrl('');
    setIsPaid(false);
    setPrice(99);
    setDescription('');
  };

  // Filter logic
  const filteredPyqs = pyqs.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      selectedSubject === 'ALL' || item.subjectName.toLowerCase() === selectedSubject.toLowerCase();
    const matchesYear = selectedYear === 'ALL' || item.year.toString() === selectedYear;
    return matchesSearch && matchesSubject && matchesYear;
  });

  const subjects = ['ALL', 'Physics', 'Chemistry', 'Biology', 'Mathematics'];
  const years = ['ALL', '2024', '2023', '2022', '2021', '2020'];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-violet-700 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20">
                Academic Content Store
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Previous Year Question Papers (PYQ)
            </h1>
            <p className="text-violet-200 text-xs sm:text-sm font-medium">
              Upload subject-wise PYQ papers & set Razorpay paid unlocks for students.
            </p>
          </div>

          <Button
            onClick={() => router.push('/dashboard/pyq/new')}
            className="bg-white hover:bg-violet-50 text-violet-900 font-extrabold rounded-2xl shadow-lg h-12 px-6 gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-violet-700" />
            <span>Upload New PYQ</span>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Papers</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{pyqs.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Unlock Papers</p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {pyqs.filter((p) => p.isPaid && p.price > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Lock className="w-6 h-6" />
              </div>
            </div>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free Papers</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {pyqs.filter((p) => !p.isPaid || p.price === 0).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Unlock className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PYQ papers by title or subject..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-600 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {subjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedSubject === subj
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:border-violet-600"
            >
              <option value="ALL">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
          </div>
        ) : filteredPyqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Question Papers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload Previous Year Question Papers for Physics, Chemistry, Biology & Maths so students can unlock them.
            </p>
            <Button
              onClick={() => router.push('/dashboard/pyq/new')}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs gap-1.5 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload First PYQ Paper
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPyqs.map((paper) => (
              <Card
                key={paper.id}
                className="rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black uppercase tracking-wider">
                        {paper.subjectName}
                      </span>
                      {paper.courseName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold border border-indigo-200">
                          {paper.courseName}
                        </span>
                      )}
                      {paper.batchName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                          {paper.batchName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(paper)}
                        title={paper.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          paper.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            paper.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span>{paper.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>

                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {paper.year}
                      </span>
                      {paper.isPaid && paper.price > 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          ₹{paper.price}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          FREE
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {paper.title}
                    </h3>
                    {paper.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">
                        {paper.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {paper.paperUrl && (
                      <a
                        href={paper.paperUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-violet-500 text-violet-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Paper PDF
                      </a>
                    )}
                    {paper.solutionUrl && (
                      <a
                        href={paper.solutionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Solution
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(paper.id, paper.title)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Question Paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
