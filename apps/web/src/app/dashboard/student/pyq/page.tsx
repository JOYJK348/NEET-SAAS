'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  FileText,
  Lock,
  Unlock,
  CheckCircle,
  Calendar,
  Search,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface StudentPYQ {
  id: string;
  title: string;
  year: number;
  subjectId: string;
  subjectName: string;
  examType: string;
  paperUrl?: string | null;
  solutionUrl?: string | null;
  price: number;
  isPaid: boolean;
  isActive?: boolean;
  isUnlocked: boolean;
  description?: string | null;
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

async function fetchPyqsData(): Promise<StudentPYQ[]> {
  const res = await api.get<StudentPYQ[]>('/pyq');
  return Array.isArray(res) ? res : (res as any)?.data || [];
}

export default function StudentPyqPage() {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const {
    data: pyqs = [],
    isLoading: loading,
    refetch: fetchPyqs,
  } = useQuery({
    queryKey: ['student-pyq-all'],
    queryFn: fetchPyqsData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleUnlockPaper = async (paper: StudentPYQ) => {
    try {
      setUnlockingId(paper.id);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setUnlockingId(null);
        return;
      }

      const checkoutData = await api.post<any>(`/pyq/${paper.id}/checkout`);

      if (checkoutData.free || checkoutData.alreadyPurchased) {
        toast.success('Paper unlocked!');
        fetchPyqs();
        setUnlockingId(null);
        return;
      }

      const options = {
        key: checkoutData.keyId,
        amount: checkoutData.amountInPaise,
        currency: checkoutData.currency || 'INR',
        name: 'NEET Academy PYQ Store',
        description: `Unlock ${paper.title}`,
        order_id: checkoutData.orderId,
        handler: async (response: any) => {
          try {
            toast.loading('Verifying payment signature...', { id: 'pyq-verify' });

            const verifyRes: any = await api.post(`/pyq/${paper.id}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast.dismiss('pyq-verify');
            toast.success(verifyRes.message || 'Payment verified! Paper unlocked.');

            fetchPyqs();
          } catch (err: any) {
            toast.dismiss('pyq-verify');
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          } finally {
            setUnlockingId(null);
          }
        },
        prefill: {
          name: 'Student User',
        },
        theme: {
          color: '#0052CC',
        },
        modal: {
          ondismiss: () => {
            setUnlockingId(null);
            toast.info('Payment window closed');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate unlock checkout');
      setUnlockingId(null);
    }
  };

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
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Student Hub</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Previous Years Question Papers</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
            Previous Years Question Papers (PYQ)
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Practice subject-wise real NEET exam question papers with detailed step-by-step
            solutions.
          </p>
        </div>

        {/* Filters & Search Strip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-80 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PYQ papers by subject or title..."
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

        {/* Papers Grid */}
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading question papers...
          </div>
        ) : filteredPyqs.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-200">
              <FileText className="w-6 h-6 text-[#0052CC]" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B2447]">No Papers Available</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              Check back soon! Question papers for Physics, Chemistry, Biology & Maths are added
              regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPyqs.map((paper) => {
              const isFree = !paper.isPaid || paper.price === 0;
              const isPaperActive = paper.isActive !== false;

              return (
                <Card
                  key={paper.id}
                  className={`group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between ${
                    !isPaperActive ? 'opacity-75 bg-slate-50' : ''
                  }`}
                >
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-4 text-slate-900 border-b border-blue-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0052CC] border border-blue-200 text-[10px] font-extrabold uppercase">
                        {paper.subjectName}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {paper.year}
                        </span>

                        {!isPaperActive ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            INACTIVE
                          </span>
                        ) : paper.isUnlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            {isFree ? 'FREE' : 'UNLOCKED'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" />
                            LOCKED (₹{paper.price})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-[#0B2447] leading-snug line-clamp-2">
                        {paper.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {paper.description && (
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                          {paper.description}
                        </p>
                      )}

                      {!isPaperActive && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-900 font-medium">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>This paper is currently deactivated by Admin.</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!isPaperActive ? (
                        <Button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs gap-2 cursor-not-allowed border border-slate-200"
                        >
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Paper Deactivated</span>
                        </Button>
                      ) : paper.isUnlocked ? (
                        <div className="flex items-center gap-2 w-full">
                          {paper.paperUrl && (
                            <a
                              href={getPermanentFileUrl(paper.paperUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2.5 px-3 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <FileText className="w-4 h-4" />
                              View Paper
                            </a>
                          )}
                          {paper.solutionUrl && (
                            <a
                              href={getPermanentFileUrl(paper.solutionUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5"
                              title="View Solutions"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Solutions
                            </a>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleUnlockPaper(paper)}
                          disabled={unlockingId === paper.id}
                          className="w-full py-2.5 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs gap-2 transition-all cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          <span>
                            {unlockingId === paper.id
                              ? 'Opening Checkout...'
                              : `Unlock Paper (₹${paper.price})`}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
