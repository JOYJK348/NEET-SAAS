'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
  BookOpen,
  Award,
  Download,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ReportStudentItem {
  id: string;
  name: string;
  rollNo?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | string;
  remarks?: string;
}

export interface AttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionDetails: {
    title?: string;
    subjectName?: string;
    batchName?: string;
    date?: string;
    time?: string;
    tutorName?: string;
  };
  students: ReportStudentItem[];
}

export function AttendanceReportModal({
  isOpen,
  onClose,
  sessionDetails,
  students,
}: AttendanceReportModalProps) {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Statistics
  const totalStudents = students.length;
  const presentCount = students.filter(
    (s) => s.status?.toUpperCase() === 'PRESENT' || s.status?.toUpperCase() === 'LATE',
  ).length;
  const purelyPresentCount = students.filter(
    (s) => s.status?.toUpperCase() === 'PRESENT',
  ).length;
  const lateCount = students.filter((s) => s.status?.toUpperCase() === 'LATE').length;
  const absentCount = students.filter((s) => s.status?.toUpperCase() === 'ABSENT').length;
  const unmarkedCount = students.filter((s) => !s.status).length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesSearch =
        !searchQuery ||
        st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.rollNo?.toLowerCase().includes(searchQuery.toLowerCase());

      const statusUpper = (st.status || 'UNMARKED').toUpperCase();
      let matchesStatus = true;
      if (filterStatus === 'PRESENT') {
        matchesStatus = statusUpper === 'PRESENT' || statusUpper === 'LATE';
      } else if (filterStatus === 'ABSENT') {
        matchesStatus = statusUpper === 'ABSENT';
      } else if (filterStatus === 'LATE') {
        matchesStatus = statusUpper === 'LATE';
      }

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, filterStatus]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.warning('No student records to export.');
      return;
    }

    try {
      const generatedDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const rows: string[][] = [
        ['NEET ACADEMY - LIVE CLASS ATTENDANCE REPORT'],
        ['Generated On', generatedDate],
        ['Subject', sessionDetails.subjectName || 'N/A'],
        ['Batch', sessionDetails.batchName || 'N/A'],
        ['Date', sessionDetails.date || 'N/A'],
        ['Time', sessionDetails.time || 'N/A'],
        ['Tutor / Host', sessionDetails.tutorName || 'N/A'],
        [],
        ['SUMMARY STATISTICS'],
        ['Total Enrolled', String(totalStudents)],
        ['Present Count', `${presentCount} (${attendanceRate}%)`],
        ['Late Count', String(lateCount)],
        ['Absent Count', String(absentCount)],
        [],
        ['S.No', 'Student Name', 'Admission / Roll No', 'Attendance Status', 'Remarks'],
      ];

      students.forEach((st, idx) => {
        rows.push([
          String(idx + 1),
          `"${(st.name || '').replace(/"/g, '""')}"`,
          `"${(st.rollNo || 'N/A').replace(/"/g, '""')}"`,
          st.status || 'UNMARKED',
          `"${(st.remarks || '').replace(/"/g, '""')}"`,
        ]);
      });

      const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const safeBatch = (sessionDetails.batchName || 'Batch').replace(/[^a-zA-Z0-9]/g, '_');
      const safeDate = (sessionDetails.date || new Date().toISOString().split('T')[0]).replace(
        /[^a-zA-Z0-9]/g,
        '_',
      );
      link.href = url;
      link.download = `Attendance_Report_${safeBatch}_${safeDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Attendance CSV downloaded successfully! 📊');
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export CSV report');
    }
  };

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #attendance-printable-area,
          #attendance-printable-area * {
            visibility: visible;
          }
          #attendance-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B2447] to-[#19376D] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  Attendance Report
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  {sessionDetails.date || new Date().toISOString().split('T')[0]}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white truncate max-w-md">
                {sessionDetails.title ||
                  `${sessionDetails.subjectName || 'Live Class'} - ${sessionDetails.batchName || 'Batch'}`}
              </h2>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Download CSV / Excel spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-all ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area Content */}
        <div id="attendance-printable-area" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Subject</span>
              <span className="text-xs font-bold text-[#0B2447]">
                {sessionDetails.subjectName || 'General'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Batch</span>
              <span className="text-xs font-bold text-[#0B2447]">
                {sessionDetails.batchName || 'All Students'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Date & Time</span>
              <span className="text-xs font-bold text-[#0B2447]">
                {sessionDetails.date} {sessionDetails.time ? `(${sessionDetails.time})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Tutor / Host</span>
              <span className="text-xs font-bold text-[#0B2447]">
                {sessionDetails.tutorName || 'Faculty'}
              </span>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Total Roster</span>
                <span className="text-xl font-black text-blue-950">{totalStudents}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            {/* Present */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Present</span>
                <span className="text-xl font-black text-emerald-950">
                  {presentCount}{' '}
                  <span className="text-xs font-bold text-emerald-600">({attendanceRate}%)</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Absent */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Absent</span>
                <span className="text-xl font-black text-rose-950">{absentCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>

            {/* Late */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Late</span>
                <span className="text-xl font-black text-amber-950">{lateCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar (hidden in print) */}
          <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll no..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['ALL', 'PRESENT', 'ABSENT', 'LATE'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                    filterStatus === tab
                      ? 'bg-white text-[#0052CC] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {tab === 'ALL' && `All (${totalStudents})`}
                  {tab === 'PRESENT' && `Present (${presentCount})`}
                  {tab === 'ABSENT' && `Absent (${absentCount})`}
                  {tab === 'LATE' && `Late (${lateCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-extrabold w-12 text-center">#</th>
                  <th className="py-2.5 px-4 font-extrabold">Student Name</th>
                  <th className="py-2.5 px-4 font-extrabold">Roll / Admission ID</th>
                  <th className="py-2.5 px-4 font-extrabold text-center">Status</th>
                  <th className="py-2.5 px-4 font-extrabold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No student records found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const statusUpper = (st.status || '').toUpperCase();
                    const isPresent = statusUpper === 'PRESENT';
                    const isLate = statusUpper === 'LATE';
                    const isAbsent = statusUpper === 'ABSENT';

                    return (
                      <tr key={st.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {st.name || 'Unknown Student'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {st.rollNo || 'STU-' + (idx + 1).toString().padStart(3, '0')}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PRESENT
                            </span>
                          ) : isLate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              LATE
                            </span>
                          ) : isAbsent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              ABSENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              UNMARKED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {st.remarks || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="no-print px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Award className="w-4 h-4 text-blue-600" />
            <span>NEET Academy Official LMS Attendance Register</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel / CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
