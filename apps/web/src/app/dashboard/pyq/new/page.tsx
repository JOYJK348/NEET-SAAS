'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  FileText,
  ArrowLeft,
  BookOpen,
  Lock,
  Unlock,
  IndianRupee,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Upload,
  Loader2,
  X,
  File,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseOption {
  id: string;
  name: string;
  code?: string;
}

interface BatchOption {
  id: string;
  name: string;
}

export default function CreatePyqPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const paperInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploadMode, setUploadMode] = useState<'FILE' | 'URL'>('FILE');
  const [isUploadingPaper, setIsUploadingPaper] = useState(false);
  const [isUploadingSolution, setIsUploadingSolution] = useState(false);
  const [paperFile, setPaperFile] = useState<{ name: string; size: number } | null>(null);
  const [solutionFile, setSolutionFile] = useState<{ name: string; size: number } | null>(null);

  // Dynamic Options
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [examType, setExamType] = useState('NEET');

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [subjectName, setSubjectName] = useState('Physics');

  const [paperUrl, setPaperUrl] = useState('');
  const [solutionUrl, setSolutionUrl] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(99);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  // Fetch Courses & Batches for dropdown selection
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        try {
          const courseRes = await api.get<any>('/master/courses', { skipGlobalToast: true });
          const courseData = Array.isArray(courseRes) ? courseRes : courseRes?.data || [];
          setCourses(courseData);
        } catch {
          setCourses([
            { id: 'c1', name: 'NEET 2027 Comprehensive Course' },
            { id: 'c2', name: 'NEET 2026 Repeater Batch' },
            { id: 'c3', name: 'Class 12 Physics & Chemistry' },
          ]);
        }

        try {
          const batchRes = await api.get<any>('/master/batches', { skipGlobalToast: true });
          const batchData = Array.isArray(batchRes) ? batchRes : batchRes?.data || [];
          setBatches(batchData);
        } catch {
          setBatches([
            { id: 'b1', name: 'NEET Crash Course 2027 - Batch A' },
            { id: 'b2', name: 'Morning Achievers Batch' },
            { id: 'b3', name: 'Evening FastTrack Batch' },
          ]);
        }
      } catch {}
    };

    fetchDropdownOptions();
  }, []);

  // Upload file helper (Supabase storage upload)
  const uploadPdfFile = async (file: File, type: 'PAPER' | 'SOLUTION') => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a valid PDF document.');
      return;
    }

    if (type === 'PAPER') {
      setIsUploadingPaper(true);
      setPaperFile({ name: file.name, size: file.size });
    } else {
      setIsUploadingSolution(true);
      setSolutionFile({ name: file.name, size: file.size });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('moduleCode', 'DOCUMENTS');
      formData.append('fileType', 'DOCUMENT');

      const res: any = await api.post('/storage/upload?expiresIn=604800', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.signedUrl || res.fileUrl || res.url || res.storagePath || res.key;

      if (!uploadedUrl) {
        throw new Error('Storage response did not return a valid file URL');
      }

      if (type === 'PAPER') {
        setPaperUrl(uploadedUrl);
        toast.success(`Question paper PDF uploaded to Supabase storage bucket!`);
      } else {
        setSolutionUrl(uploadedUrl);
        toast.success(`Solution PDF uploaded to Supabase storage bucket!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload PDF to Supabase storage');
      if (type === 'PAPER') setPaperFile(null);
      else setSolutionFile(null);
    } finally {
      if (type === 'PAPER') setIsUploadingPaper(false);
      else setIsUploadingSolution(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !paperUrl.trim()) {
      toast.error('Please enter the paper title and question paper PDF URL');
      return;
    }

    try {
      setSubmitting(true);
      const subjectId = `subj_${subjectName.toLowerCase()}`;

      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const selectedBatch = batches.find((b) => b.id === selectedBatchId);

      const payload = {
        title: title.trim(),
        year: Number(year),
        courseId: selectedCourseId || undefined,
        courseName: selectedCourse?.name || undefined,
        batchId: selectedBatchId || undefined,
        batchName: selectedBatch?.name || undefined,
        subjectId,
        subjectName,
        examType,
        paperUrl: paperUrl.trim(),
        solutionUrl: solutionUrl.trim() || undefined,
        price: isPaid ? Number(price) : 0,
        isPaid,
        isActive,
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

      toast.success('Question Paper published & approved successfully!');
      router.push('/dashboard/pyq');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish PYQ paper');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/pyq')}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-violet-700 transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to PYQ Library</span>
          </button>
        </div>

        {/* Page Banner */}
        <div className="bg-gradient-to-br from-violet-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                Official Content Publishing
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Publish New Question Paper (PYQ)
            </h1>
            <p className="text-violet-200 text-xs sm:text-sm font-medium max-w-xl">
              Create a dedicated Previous Year Question Paper, assign target courses & batches, and configure Razorpay paid unlock pricing.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
          {/* 1. Basic Details */}
          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">1. Question Paper Overview</h2>
                <p className="text-xs text-slate-500 font-medium">Enter paper title, year, and target exam type</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Paper Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NEET 2024 Physics Main Question Paper with Detailed Solutions"
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Target Exam Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Exam Category *
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white"
                  >
                    <option value="NEET">NEET UG</option>
                    <option value="JEE_MAIN">JEE Main</option>
                    <option value="JEE_ADVANCED">JEE Advanced</option>
                    <option value="AIPMT">AIPMT (Legacy)</option>
                    <option value="BOARD">State / Central Board</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Course, Batch & Subject Targeting */}
          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">2. Course & Batch Targeting</h2>
                <p className="text-xs text-slate-500 font-medium">Assign which course, batch & subject this paper belongs to</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white"
                >
                  <option value="">All Courses (General Access)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Target Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white"
                >
                  <option value="">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Subject *
                </label>
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white font-bold text-violet-700"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>
            </div>
          </Card>

          {/* 3. Document Attachments */}
          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">3. Document Attachments</h2>
                  <p className="text-xs text-slate-500 font-medium">Upload PDF documents directly to Supabase storage bucket</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadMode('FILE')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    uploadMode === 'FILE'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>PDF Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('URL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    uploadMode === 'URL'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>URL Input</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Question Paper PDF */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Question Paper PDF *</span>
                  {paperUrl && (
                    <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved to Supabase Bucket
                    </span>
                  )}
                </label>

                {uploadMode === 'FILE' ? (
                  <div
                    onClick={() => paperInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-violet-400 hover:bg-violet-50/30 cursor-pointer transition-all"
                  >
                    <input
                      ref={paperInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPdfFile(f, 'PAPER');
                      }}
                    />

                    {isUploadingPaper ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="w-6 h-6 text-violet-600 animate-spin mb-2" />
                        <p className="text-xs font-bold text-slate-700">Uploading Question Paper to Supabase Bucket...</p>
                        <p className="text-[10px] text-slate-400">Please wait while the PDF is uploaded</p>
                      </div>
                    ) : paperFile || paperUrl ? (
                      <div className="flex items-center gap-3 w-full max-w-md bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-10 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {paperFile?.name || 'Uploaded_Question_Paper.pdf'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {paperUrl}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaperFile(null);
                            setPaperUrl('');
                          }}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Click or Drag & Drop Question Paper PDF</p>
                        <p className="text-[10px] text-slate-400">PDF files up to 50MB directly stored in Supabase Storage</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    required
                    value={paperUrl}
                    onChange={(e) => setPaperUrl(e.target.value)}
                    placeholder="https://your-supabase-url.storage.supabase.co/object/public/papers/paper.pdf"
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none font-mono text-xs bg-slate-50/50 focus:bg-white"
                  />
                )}
              </div>

              {/* Solution PDF (Optional) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Solution / Answer Key PDF (Optional)</span>
                  {solutionUrl && (
                    <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved to Supabase Bucket
                    </span>
                  )}
                </label>

                {uploadMode === 'FILE' ? (
                  <div
                    onClick={() => solutionInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
                  >
                    <input
                      ref={solutionInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPdfFile(f, 'SOLUTION');
                      }}
                    />

                    {isUploadingSolution ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-2" />
                        <p className="text-xs font-bold text-slate-700">Uploading Solution PDF to Supabase Bucket...</p>
                        <p className="text-[10px] text-slate-400">Please wait while the PDF is uploaded</p>
                      </div>
                    ) : solutionFile || solutionUrl ? (
                      <div className="flex items-center gap-3 w-full max-w-md bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-10 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {solutionFile?.name || 'Uploaded_Solution.pdf'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {solutionUrl}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSolutionFile(null);
                            setSolutionUrl('');
                          }}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Click or Drag & Drop Solution PDF</p>
                        <p className="text-[10px] text-slate-400">Optional answer key file stored in Supabase Storage</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    value={solutionUrl}
                    onChange={(e) => setSolutionUrl(e.target.value)}
                    placeholder="https://your-supabase-url.storage.supabase.co/object/public/papers/solution.pdf"
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none font-mono text-xs bg-slate-50/50 focus:bg-white"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* 4. Razorpay Paid Unlock Settings */}
          <Card className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-amber-950">4. Paid Student Unlock (Razorpay)</h2>
                  <p className="text-xs text-amber-700 font-medium">Require students to pay via Razorpay to unlock this paper</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {isPaid ? (
              <div className="space-y-2 pt-2 border-t border-amber-200/60">
                <label className="text-xs font-black text-amber-900 uppercase">
                  Unlock Price (₹ INR)
                </label>
                <div className="relative max-w-xs">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-700 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    required={isPaid}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="99"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-extrabold rounded-2xl border border-amber-300 bg-white focus:border-amber-600 outline-none text-slate-900"
                  />
                </div>
                <p className="text-xs text-amber-800 font-medium">
                  Students will see a <strong>🔒 Locked (₹{price})</strong> button and must complete Razorpay payment to view the PDF.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paper is <strong>FREE</strong> for all students to view and download immediately.</span>
              </div>
            )}
          </Card>

          {/* 5. Paper Status & Approval */}
          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Publish Status (Visible to Students)</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isActive
                    ? 'Active: Paper will be visible to targeted students immediately upon publishing.'
                    : 'Inactive: Paper will be saved as draft and hidden from student dashboards.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Paper Instructions / Syllabus Details (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify marking scheme, total marks, chapter weightages, or special instructions..."
                className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-violet-600 outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/pyq')}
                className="rounded-2xl text-xs font-bold h-12 px-6"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm h-12 px-8 gap-2 shadow-lg shadow-violet-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{submitting ? 'Publishing...' : 'Publish & Approve PYQ Paper 🚀'}</span>
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
