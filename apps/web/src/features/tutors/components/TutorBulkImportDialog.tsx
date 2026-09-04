'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  BookOpen,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCourseSubjects } from '@/features/master-data/hooks/use-course-subjects';
import { toast } from 'sonner';

interface BulkImportResult {
  importedCount: number;
  errors: string[];
  loginCredentials?: Array<{ email: string; password: string }>;
}

interface TutorBulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onImportComplete?: (result: BulkImportResult) => void;
  academicYears: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string; courseId?: string; branchId?: string }>;
  subjects: Array<{ id: string; name: string; code?: string }>;
}

export function TutorBulkImportDialog({
  isOpen,
  onClose,
  onSuccess,
  onImportComplete,
  academicYears,
  branches,
  courses,
  batches,
  subjects,
}: TutorBulkImportDialogProps) {
  // Dropdown states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [createLogin, setCreateLogin] = useState('true');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'logs'>('summary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch course-specific subjects
  const { data: courseSubjectsData = [] } = useCourseSubjects(selectedCourse, {
    enabled: !!selectedCourse,
  });
  const courseSubjectIds = courseSubjectsData.map((cs: any) => cs.subjectId);
  const filteredSubjects =
    selectedCourse && courseSubjectIds.length > 0
      ? subjects.filter((s) => courseSubjectIds.includes(s.id))
      : subjects;

  // Filtered lists
  const filteredCourses = selectedBranch ? courses : [];
  const filteredBatches = batches.filter(
    (b) =>
      (!selectedCourse || b.courseId === selectedCourse) &&
      (!selectedBranch || b.branchId === selectedBranch),
  );

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
    );
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.getAxiosInstance().get('/people/tutors/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tutors_bulk_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setUploadError('Failed to download tutors spreadsheet template.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
      setResult(null);
    }
  };

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId],
    );
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (selectedCourse) queryParams.append('courseId', selectedCourse);
    if (selectedYear) queryParams.append('academicYearId', selectedYear);
    if (selectedBranch) queryParams.append('branchId', selectedBranch);
    if (selectedBatches.length > 0) queryParams.append('batchIds', selectedBatches.join(','));
    if (selectedSubjects.length > 0) queryParams.append('subjectIds', selectedSubjects.join(','));
    queryParams.append('createLogin', createLogin);

    try {
      const url = `/people/tutors/import/upload?${queryParams.toString()}`;
      const res = await api.getAxiosInstance().post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const payload = res.data?.data ?? res.data;
      setResult(payload);

      if (onImportComplete) {
        onImportComplete(payload);
      }

      if (payload.importedCount > 0) {
        toast.success(`Import Completed! Successfully imported ${payload.importedCount} tutor(s).`);
        onSuccess();
      } else if (payload.errors.length > 0) {
        toast.error(
          `Import completed with errors! ${payload.errors.length} row(s) failed validation.`,
        );
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
    setSelectedBatches([]);
    setSelectedSubjects([]);
    setCreateLogin('true');
    setActiveTab('summary');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleReset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl bg-white text-[#0B2447] rounded-2xl p-0 border-slate-200 shadow-xl overflow-y-auto max-h-[90vh]">
        {/* ISML LMS Style Light Blue Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 border-b border-blue-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <FileSpreadsheet className="w-5 h-5 text-[#0052CC]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-extrabold text-[#0052CC] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block mb-0.5">
              BULK FACULTY REGISTRATION
            </span>
            <DialogTitle className="text-base font-extrabold text-[#0B2447] leading-snug">
              Bulk Faculty Import
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium mt-0.5">
              Register multiple teaching faculty members, specify designational details, and assign
              batches.
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: Batch Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0052CC] text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Batch Assignment & Mapping
              </h3>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="year"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Academic Year *
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger
                    id="year"
                    className="bg-white border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 rounded-xl h-10 text-xs font-medium transition-colors"
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
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Branch *
                </Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                  disabled={!selectedYear}
                >
                  <SelectTrigger
                    id="branch"
                    className="bg-white border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 rounded-xl h-10 text-xs font-medium transition-colors"
                  >
                    <SelectValue
                      placeholder={selectedYear ? 'Select Branch' : 'Select Year first'}
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
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Course *
                </Label>
                <Select
                  value={selectedCourse}
                  onValueChange={(val) => {
                    setSelectedCourse(val);
                    setSelectedBatches([]);
                    setSelectedSubjects([]);
                  }}
                  disabled={!selectedBranch}
                >
                  <SelectTrigger
                    id="course"
                    className="bg-white border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 rounded-xl h-10 text-xs font-medium transition-colors"
                  >
                    <SelectValue
                      placeholder={selectedBranch ? 'Select Course' : 'Select Branch first'}
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
                  htmlFor="createLogin"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Create Login Access *
                </Label>
                <Select value={createLogin} onValueChange={setCreateLogin}>
                  <SelectTrigger
                    id="createLogin"
                    className="bg-white border-slate-200 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 rounded-xl h-10 text-xs font-medium transition-colors"
                  >
                    <SelectValue placeholder="Allow access?" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="true">Yes — Allow tutor access to platform</SelectItem>
                    <SelectItem value="false">No — Restrict platform login access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-Select Batches Dropdown Container */}
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Assigned Batches (Select Multiple) *
                </Label>
                {!selectedCourse ? (
                  <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-3 text-center font-medium">
                    Select a course first to view and assign batches.
                  </p>
                ) : filteredBatches.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-3 text-center font-medium">
                    No active batches found for the selected course/branch.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto">
                    {filteredBatches.map((b) => {
                      const isSelected = selectedBatches.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBatchSelection(b.id)}
                          className={`flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-[#0052CC] bg-blue-50/60 text-[#0052CC] font-bold'
                              : 'border-slate-100 hover:border-slate-300 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{b.name}</span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-[#0052CC] shrink-0 ml-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Subject Multi-Select */}
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#0052CC]" />
                  Subjects (Select Multiple)
                </Label>
                {!selectedCourse ? (
                  <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-3 text-center font-medium">
                    Select a course first to view available subjects.
                  </p>
                ) : filteredSubjects.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-3 text-center font-medium">
                    No subjects found for the selected course.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto">
                    {filteredSubjects.map((s) => {
                      const isSelected = selectedSubjects.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSubjectSelection(s.id)}
                          className={`flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-[#0052CC] bg-blue-50/60 text-[#0052CC] font-bold'
                              : 'border-slate-100 hover:border-slate-300 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="block truncate font-semibold">{s.name}</span>
                            {s.code && (
                              <span className="text-[10px] text-slate-400 font-mono">{s.code}</span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-[#0052CC] shrink-0 ml-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Download Template */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0052CC] text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Get Template Sheet
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-[#0B2447]">
                  Tutors Template Spreadsheet
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Download the standard Excel template with mapped data validation column
                  structures.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto gap-2 border-blue-200 text-[#0052CC] bg-blue-50 hover:bg-blue-100 rounded-xl h-10 font-bold shrink-0 text-xs"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Section 3: Upload Spreadsheet */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0052CC] text-xs font-extrabold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Upload & Parse Spreadsheet
              </h3>
            </div>

            <div
              className={`border-2 border-dashed border-slate-300 hover:border-[#0052CC] rounded-xl p-8 flex flex-col items-center justify-center gap-2.5 bg-slate-50/50 cursor-pointer transition-all hover:bg-blue-50/20 ${
                file ? 'border-[#0052CC] bg-blue-50/20' : ''
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
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#0052CC]">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#0B2447]">{file.name}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-slate-600 font-bold">
                    Click to browse or drag Excel template here
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Excel workbook (.xlsx) formats only
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Error displays */}
          {uploadError && (
            <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertTitle className="font-extrabold text-xs">Import failed</AlertTitle>
              <AlertDescription className="text-xs font-medium">{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Success summary results */}
          {result && (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`text-xs font-extrabold pb-1.5 transition-colors relative ${
                    activeTab === 'summary'
                      ? 'text-[#0052CC] border-b-2 border-[#0052CC]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Import Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`text-xs font-extrabold pb-1.5 transition-colors relative flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'text-[#0052CC] border-b-2 border-[#0052CC]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Error Logs
                  {result.errors.length > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                      {result.errors.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'summary' ? (
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Import Completed Successfully!
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Successfully loaded and registered <strong>{result.importedCount}</strong> new
                    tutor profiles.
                    {result.errors.length > 0 &&
                      ` However, ${result.errors.length} rows failed validation rules. Check the "Error Logs" tab for details.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {result.errors.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="h-4 w-4" />
                        Row Validation Errors List
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                        {result.errors.map((err, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-rose-700 font-medium flex gap-2 items-start"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium text-center py-4">
                      Clean import! No errors found.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 pt-4 p-5 sm:p-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isUploading}
            className="rounded-xl h-10 border-slate-200 font-bold text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="rounded-xl h-10 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs gap-2 shadow-2xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Start Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
