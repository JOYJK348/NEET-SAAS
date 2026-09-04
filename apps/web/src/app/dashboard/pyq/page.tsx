'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  Lock,
  Unlock,
  Trash2,
  CheckCircle,
  Calendar,
  ChevronRight,
  Layers,
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

export function getPermanentFileUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '#';

  let url = rawUrl.trim();

  // Handle relative API URLs
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const baseUrl = apiBase.replace(/\/api\/v1\/?$/, '');
    url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return url;
}

export default function TenantAdminPyqPage() {
  const router = useRouter();
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

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

  const handleToggleStatus = async (paper: PYQItem) => {
    const nextState = !paper.isActive;
    // Optimistic UI update
    setPyqs((prev) => prev.map((p) => (p.id === paper.id ? { ...p, isActive: nextState } : p)));

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

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Management Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Previous Year Question Papers</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              Previous Year Question Papers (PYQ)
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Upload subject-wise PYQ papers and configure student unlock access.
            </p>
          </div>

          <Button
            onClick={() => router.push('/dashboard/pyq/new')}
            className="w-full sm:w-auto gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs shrink-0 rounded-xl text-xs"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Upload New PYQ</span>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Papers
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                  {pyqs.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Paid Unlock Papers
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                  {pyqs.filter((p) => p.isPaid && p.price > 0).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
                <Unlock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Free Access Papers
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-0.5">
                  {pyqs.filter((p) => !p.isPaid || p.price === 0).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters & Search Strip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-80 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PYQ papers by title or subject..."
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 overflow-x-auto scrollbar-thin">
              {subjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedSubject === subj
                      ? 'bg-[#0052CC] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0B2447] hover:bg-white/60'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:border-[#0052CC]"
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

        {/* Papers Content Grid */}
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading question papers...
          </div>
        ) : filteredPyqs.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-200">
              <FileText className="w-6 h-6 text-[#0052CC]" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B2447]">No PYQ Papers Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              Upload Previous Year Question Papers for Physics, Chemistry, Biology & Maths.
            </p>
            <Button
              onClick={() => router.push('/dashboard/pyq/new')}
              className="gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs"
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
                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-4 text-slate-900 border-b border-blue-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0052CC] border border-blue-200 text-[10px] font-extrabold uppercase">
                        {paper.subjectName}
                      </span>
                      {paper.courseName && (
                        <span className="px-2.5 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-bold border border-slate-200 truncate max-w-[120px]">
                          {paper.courseName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(paper)}
                        title={paper.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                          paper.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            paper.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{paper.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>

                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {paper.year}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-[#0B2447] leading-snug line-clamp-2">
                      {paper.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {paper.description && (
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {paper.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {paper.isPaid && paper.price > 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Paid Unlock: ₹{paper.price}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          Free Access
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {paper.paperUrl && (
                        <a
                          href={getPermanentFileUrl(paper.paperUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#0052CC] text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0052CC]" />
                          Paper PDF
                        </a>
                      )}
                      {paper.solutionUrl && (
                        <a
                          href={getPermanentFileUrl(paper.solutionUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Solution
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(paper.id, paper.title)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Delete Question Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
