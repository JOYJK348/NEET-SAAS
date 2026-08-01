'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  useCoursesForAdmission,
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
  useBatchesForAdmission,
} from '@/features/admissions/hooks/use-admissions';

function BulkImportContent() {
  const router = useRouter();

  // Cascading dropdown data hooks
  const { years: academicYears } = useAcademicYearsForAdmission();
  const { branches } = useBranchesForAdmission();
  const { courses } = useCoursesForAdmission();
  const { batches } = useBatchesForAdmission();

  // Cascading dropdown states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; errors: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'logs'>('summary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered lists based on selections
  const filteredCourses = selectedBranch ? courses : [];
  const filteredBatches = batches.filter(
    (b) =>
      (!selectedCourse || b.courseId === selectedCourse) &&
      (!selectedBranch || b.branchId === selectedBranch),
  );

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.getAxiosInstance().get('/students/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_bulk_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Excel template downloaded successfully');
    } catch {
      setUploadError('Failed to download spreadsheet template.');
      toast.error('Failed to download spreadsheet template.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (selectedCourse) queryParams.append('courseId', selectedCourse);
    if (selectedBatch) queryParams.append('batchId', selectedBatch);
    if (selectedYear) queryParams.append('academicYearId', selectedYear);
    if (selectedBranch) queryParams.append('branchId', selectedBranch);

    try {
      const url = `/students/import/upload?${queryParams.toString()}`;
      const res = await api.getAxiosInstance().post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const payload = res.data?.data ?? res.data;
      setResult(payload);

      if (payload.importedCount > 0) {
        toast.success(`Successfully imported ${payload.importedCount} student record(s)!`);
      } else if (payload.errors && payload.errors.length > 0) {
        toast.error(`Import completed with validation errors!`);
        setActiveTab('logs');
      } else {
        toast.info('Spreadsheet processed with empty rows.');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload and parse Excel template.';
      setUploadError(errMsg);
      toast.error(`Upload Failed: ${errMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setUploadError(null);
    setSelectedYear('');
    setSelectedBranch('');
    setSelectedCourse('');
    setSelectedBatch('');
    setActiveTab('summary');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Top Back Action Bar */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push('/dashboard/students')}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="hidden sm:inline">Back to Student Directory</span>
            <span className="sm:hidden">Back</span>
          </button>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="rounded-xl text-xs font-bold text-slate-600 shrink-0 px-3 sm:px-4 py-2 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Reset Form
          </Button>
        </div>

        {/* Dedicated Screen Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <FileSpreadsheet className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                    Bulk Student Enrollment Engine
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Bulk Student Registration & Import 📊
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Import multiple student records from Excel sheets, allocate default batches, and
                  parse errors.
                </p>
              </div>
            </div>

            <Button
              onClick={handleDownloadTemplate}
              className="gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-sm shrink-0 rounded-xl text-xs"
            >
              <Download className="w-4 h-4 text-violet-600" /> Download Excel Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Step 1 (Academic Parameters) & Step 2 (Upload File) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Academic Settings */}
            <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Target Academic & Campus Parameters
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="year"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Academic Year *
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger
                      id="year"
                      className="bg-white border-[#E5E7EB] hover:border-violet-300 rounded-xl h-10 transition-colors text-xs font-medium"
                    >
                      <SelectValue placeholder="Select Academic Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {academicYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="branch"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Campus Branch *
                  </Label>
                  <Select
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                    disabled={!selectedYear}
                  >
                    <SelectTrigger
                      id="branch"
                      className="bg-white border-[#E5E7EB] hover:border-violet-300 rounded-xl h-10 transition-colors text-xs font-medium"
                    >
                      <SelectValue
                        placeholder={selectedYear ? 'Select Branch' : 'Select Year First'}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="course"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Course (Optional)
                  </Label>
                  <Select
                    value={selectedCourse}
                    onValueChange={setSelectedCourse}
                    disabled={!selectedBranch}
                  >
                    <SelectTrigger
                      id="course"
                      className="bg-white border-[#E5E7EB] hover:border-violet-300 rounded-xl h-10 transition-colors text-xs font-medium"
                    >
                      <SelectValue
                        placeholder={selectedBranch ? 'Select Course' : 'Select Branch First'}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {filteredCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="batch"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Target Batch (Optional)
                  </Label>
                  <Select
                    value={selectedBatch}
                    onValueChange={setSelectedBatch}
                    disabled={!selectedCourse}
                  >
                    <SelectTrigger
                      id="batch"
                      className="bg-white border-[#E5E7EB] hover:border-violet-300 rounded-xl h-10 transition-colors text-xs font-medium"
                    >
                      <SelectValue
                        placeholder={selectedCourse ? 'Select Batch' : 'Select Course First'}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {filteredBatches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Step 2: Upload Excel File Dropzone */}
            <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Upload Excel Spreadsheet (.xlsx)
                </h3>
              </div>

              <div
                className={`border-2 border-dashed border-slate-200 hover:border-violet-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 cursor-pointer transition-all hover:bg-violet-50/10 ${
                  file ? 'border-violet-500 bg-violet-50/20' : ''
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 border border-violet-200">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-extrabold text-slate-900 block">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
                        {(file.size / 1024).toFixed(1)} KB &bull; Excel File Ready
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-slate-700 font-bold block">
                        Click to browse or drag Excel template file here
                      </span>
                      <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                        Supports Microsoft Excel Workbook (.xlsx) format
                      </span>
                    </div>
                  </>
                )}
              </div>

              {uploadError && (
                <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <AlertTitle className="font-extrabold text-rose-800">Upload Error</AlertTitle>
                  <AlertDescription className="text-xs font-medium text-rose-700">
                    {uploadError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full sm:w-auto gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs px-6 py-2.5 shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing & Importing Records...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Start Bulk Import
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Crystal-Clear Validation & Error Logs Panel */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4 min-h-[400px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4.5 h-4.5 text-violet-600" /> Import Summary & Logs
                </h3>
                {result && result.errors.length > 0 && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                    {result.errors.length} Error Logs
                  </span>
                )}
              </div>

              {!result ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">
                    No Import Operation Performed Yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Select target academic parameters, upload your Excel file, and click "Start Bulk
                    Import" to view parsed logs.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Successfully Imported
                      </p>
                      <p className="text-2xl font-black text-emerald-900">{result.importedCount}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-800 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                        Validation Failures
                      </p>
                      <p className="text-2xl font-black text-rose-900">{result.errors.length}</p>
                    </div>
                  </div>

                  {/* Crystal-Clear Error Logs List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" /> Crystal-Clear Error Logs
                    </h4>

                    {result.errors.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 text-center space-y-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-emerald-800">100% Clean Import!</p>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          All spreadsheet rows passed validation rules cleanly.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                        {result.errors.map((errLog, idx) => {
                          // Parse row number if present (e.g. "Row 3: Error message")
                          const matchRow = errLog.match(/Row\s*(\d+)[\:\s]*(.*)/i);
                          const rowNum = matchRow ? matchRow[1] : null;
                          const errText = matchRow ? matchRow[2] : errLog;

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-rose-50/40 border border-rose-200/70 text-xs text-rose-900 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                {rowNum ? (
                                  <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200">
                                    ROW #{rowNum}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200">
                                    LOG #{idx + 1}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                  Validation Error
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-800 leading-relaxed pt-0.5">
                                {errText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BulkImportPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <BulkImportContent />
    </ProtectedRoute>
  );
}
