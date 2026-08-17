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
  Sparkles,
  Search,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function StudentPyqPage() {
  const [pyqs, setPyqs] = useState<StudentPYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

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
          const res = await api.get<StudentPYQ[]>(url, { skipGlobalToast: true });
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

      // 1. Create Order via Backend API
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const checkoutEndpoints = [
        `/pyq/${paper.id}/checkout`,
        `/api/v1/pyq/${paper.id}/checkout`,
        `http://${host}:3000/api/v1/pyq/${paper.id}/checkout`,
        `/v1/pyq/${paper.id}/checkout`,
        `http://${host}:3000/v1/pyq/${paper.id}/checkout`,
      ];

      let checkoutData: any = null;
      for (const url of checkoutEndpoints) {
        try {
          checkoutData = await api.post(url, undefined, { skipGlobalToast: true });
          if (checkoutData) break;
        } catch {}
      }

      if (!checkoutData) {
        checkoutData = await api.post(`/pyq/${paper.id}/checkout`);
      }

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

            // 2. Verify Payment via Backend API
            const verifyRes: any = await api.post(`/pyq/${paper.id}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast.dismiss('pyq-verify');
            toast.success(verifyRes.message || 'Payment verified! Paper unlocked.');

            // Update state locally
            setPyqs((prev) =>
              prev.map((p) =>
                p.id === paper.id
                  ? { ...p, isUnlocked: true, paperUrl: verifyRes.paperUrl, solutionUrl: verifyRes.solutionUrl }
                  : p,
              ),
            );
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
          color: '#7C3AED',
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
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20">
                Exam Preparation Hub
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Previous Years Question Papers (PYQ)
            </h1>
            <p className="text-violet-200 text-xs sm:text-sm font-medium">
              Practice subject-wise real exam question papers and detailed solutions.
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PYQ papers by subject or title..."
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
            <h3 className="text-lg font-bold text-slate-800">No Papers Available</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Check back soon! Question papers for Physics, Chemistry, Biology & Maths are added regularly.
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
                  className={`rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                    !isPaperActive ? 'opacity-85 border-rose-200 bg-slate-50/50' : 'border-slate-200'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black uppercase tracking-wider">
                        {paper.subjectName}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {paper.year}
                        </span>

                        {!isPaperActive ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-black flex items-center gap-1 border border-rose-200">
                            <Lock className="w-3.5 h-3.5 text-rose-600" />
                            INACTIVE
                          </span>
                        ) : paper.isUnlocked ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            {isFree ? 'FREE' : 'UNLOCKED'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            LOCKED (₹{paper.price})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-2">
                        {paper.title}
                      </h3>
                      {paper.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">
                          {paper.description}
                        </p>
                      )}

                      {!isPaperActive && (
                        <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-900 font-medium">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>This question paper is currently deactivated by Admin. Please contact Institute Admin for access.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isPaperActive ? (
                      <Button
                        disabled
                        className="w-full py-3 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs gap-2 cursor-not-allowed opacity-80"
                      >
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Paper Deactivated (Contact Admin)</span>
                      </Button>
                    ) : paper.isUnlocked ? (
                      <div className="flex items-center gap-2 w-full">
                        {paper.paperUrl && (
                          <a
                            href={paper.paperUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View Paper 📄
                          </a>
                        )}
                        {paper.solutionUrl && (
                          <a
                            href={paper.solutionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            title="View Solutions"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Solutions 🔑
                          </a>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleUnlockPaper(paper)}
                        disabled={unlockingId === paper.id}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-orange-500/20 gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>
                          {unlockingId === paper.id
                            ? 'Opening Razorpay...'
                            : `Unlock Paper for ₹${paper.price}`}
                        </span>
                      </Button>
                    )}
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
