'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTutorSubmissionsBuckets } from '../../hooks/use-tutor-exams';
import type { TutorSubmissionListItem } from '../../types/tutor-exams';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  RotateCcw,
  Search,
  UserX,
} from 'lucide-react';

interface TutorSubmissionsBucketsProps {
  examId: string;
}

export function TutorSubmissionsBucketsView({ examId }: TutorSubmissionsBucketsProps) {
  const router = useRouter();
  const { data: buckets, isLoading } = useTutorSubmissionsBuckets(examId);

  const [activeTab, setActiveTab] = useState<
    'PENDING' | 'OVERDUE' | 'RETURNED' | 'COMPLETED' | 'ABSENT'
  >('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 font-medium">Loading exam submission workload...</div>
    );
  }

  if (!buckets) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <p className="text-slate-500 font-medium">Exam workload data not found.</p>
        <button
          onClick={() => router.push('/dashboard/tutor/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tutor Exams
        </button>
      </div>
    );
  }

  let listToDisplay: TutorSubmissionListItem[] = [];
  if (activeTab === 'PENDING') listToDisplay = buckets.todaysPending || [];
  if (activeTab === 'OVERDUE') listToDisplay = buckets.overdue || [];
  if (activeTab === 'RETURNED') listToDisplay = buckets.returned || [];
  if (activeTab === 'COMPLETED') listToDisplay = buckets.completed || [];
  if (activeTab === 'ABSENT') listToDisplay = buckets.absent || [];

  const filteredList = listToDisplay.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentAdmissionId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-800 min-h-screen bg-slate-50 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => router.push('/dashboard/tutor/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Tutor Exams
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            {buckets.title} — Submission Workload
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Total Submissions: {buckets.totalCount}</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 text-xs font-semibold shadow-sm">
          {[
            { key: 'PENDING', label: `Today's Pending (${buckets.todaysPending?.length || 0})` },
            { key: 'OVERDUE', label: `Overdue (${buckets.overdue?.length || 0})` },
            { key: 'RETURNED', label: `Returned (${buckets.returned?.length || 0})` },
            { key: 'COMPLETED', label: `Completed (${buckets.completed?.length || 0})` },
            { key: 'ABSENT', label: `Absent (${buckets.absent?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No submissions in this bucket.
                  </td>
                </tr>
              ) : (
                filteredList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-sm">{sub.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {sub.studentAdmissionId}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-slate-600">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                      v{sub.evaluationVersion || 1}
                    </td>

                    <td className="py-4 px-4">
                      {sub.evaluationStatus === 'RE_EVALUATION' ? (
                        <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                          RETURNED BY ADMIN
                        </span>
                      ) : sub.evaluationStatus === 'COMPLETED' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
                          PENDING
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/dashboard/tutor/exams/${examId}/evaluate/${sub.id}`}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Evaluate Paper <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
