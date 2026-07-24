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
} from 'lucide-react';
import { api } from '@/lib/api';

// For multi-select checkmarks styling
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface TutorBulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onImportComplete?: (result: { importedCount: number; errors: string[] }) => void;
  academicYears: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string; courseId?: string; branchId?: string }>;
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
}: TutorBulkImportDialogProps) {
  // Dropdown states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [createLogin, setCreateLogin] = useState('true');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; errors: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'logs'>('summary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered lists
  const filteredCourses = selectedBranch ? courses : [];
  const filteredBatches = batches.filter(
    (b) =>
      (!selectedCourse || b.courseId === selectedCourse) &&
      (!selectedBranch || b.branchId === selectedBranch)
  );

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
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
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
        toast.error(`Import completed with errors! ${payload.errors.length} row(s) failed validation.`);
      } else {
        toast.info('Spreadsheet processed with empty rows.');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to upload and parse Excel template.';
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
    setCreateLogin('true');
    setActiveTab('summary');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleReset(); onClose(); } }}>
      <DialogContent className="max-w-3xl bg-white text-[#111827] rounded-[28px] p-8 border-[#E5E7EB] shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0">
              <FileSpreadsheet className="h-6 w-6 text-purple-600 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-extrabold tracking-tight text-gray-900">
                Bulk Tutor Registration
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm font-medium mt-0.5">
                Register multiple teaching faculty members, specify designational details and assign batches.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6 border-t border-gray-100 mt-4">
          
          {/* Section 1: Batch Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Batch Assignment</h3>
            </div>
            
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100/85 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-xs font-bold text-gray-600 uppercase tracking-wider">Academic Year *</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year" className="bg-white border-[#E5E7EB] hover:border-purple-300 rounded-xl h-11 transition-colors">
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch" className="text-xs font-bold text-gray-600 uppercase tracking-wider">Branch *</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                  disabled={!selectedYear}
                >
                  <SelectTrigger id="branch" className="bg-white border-[#E5E7EB] hover:border-purple-300 rounded-xl h-11 transition-colors">
                    <SelectValue placeholder={selectedYear ? "Select Branch" : "Select Year first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="course" className="text-xs font-bold text-gray-600 uppercase tracking-wider">Course *</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={(val) => {
                    setSelectedCourse(val);
                    setSelectedBatches([]);
                  }}
                  disabled={!selectedBranch}
                >
                  <SelectTrigger id="course" className="bg-white border-[#E5E7EB] hover:border-purple-300 rounded-xl h-11 transition-colors">
                    <SelectValue placeholder={selectedBranch ? "Select Course" : "Select Branch first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="createLogin" className="text-xs font-bold text-gray-600 uppercase tracking-wider">Create Login Access *</Label>
                <Select value={createLogin} onValueChange={setCreateLogin}>
                  <SelectTrigger id="createLogin" className="bg-white border-[#E5E7EB] hover:border-purple-300 rounded-xl h-11 transition-colors">
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
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned Batches (Select Multiple) *</Label>
                {!selectedCourse ? (
                  <p className="text-xs text-muted-foreground bg-white border border-gray-200 rounded-xl p-3 text-center">
                    Select a course first to view and assign batches.
                  </p>
                ) : filteredBatches.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-white border border-gray-200 rounded-xl p-3 text-center">
                    No active batches found for the selected course/branch.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 bg-white border border-gray-200 rounded-xl p-3 max-h-32 overflow-y-auto">
                    {filteredBatches.map((b) => {
                      const isSelected = selectedBatches.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBatchSelection(b.id)}
                          className={`flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50/30 text-purple-900 font-bold'
                              : 'border-gray-100 hover:border-gray-300 bg-gray-50/10 text-gray-700'
                          }`}
                        >
                          <span>{b.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 ml-1.5" />}
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
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">2</span>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Get Template Sheet</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-gray-800">Tutors Template Spreadsheet</span>
                <p className="text-xs text-muted-foreground font-medium">Download the standard CSV/Excel template with mapped data validation column structures.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadTemplate} 
                className="w-full sm:w-auto gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl h-11 font-semibold shrink-0"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Section 3: Upload Spreadsheet */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Upload & Parse Spreadsheet</h3>
            </div>

            <div
              className={`border-2 border-dashed border-[#D1D5DB] hover:border-purple-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-[#FAFAFA] cursor-pointer transition-all hover:bg-purple-50/5 ${
                file ? 'border-purple-500 bg-purple-50/10' : ''
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
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-extrabold text-gray-850">{file.name}</span>
                  <span className="text-xs text-muted-foreground font-semibold">{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">Click to browse or drag Excel template here</span>
                  <span className="text-xs text-muted-foreground font-medium">Excel workbook (.xlsx) formats only</span>
                </>
              )}
            </div>
          </div>

          {/* Error displays */}
          {uploadError && (
            <Alert variant="destructive" className="rounded-2xl border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-655" />
              <AlertTitle className="font-extrabold">Import failed</AlertTitle>
              <AlertDescription className="text-xs font-medium">{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Success summary results & structured Error Logs Tabs */}
          {result && (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-[#E5E7EB] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`text-sm font-bold pb-1.5 transition-colors relative ${
                    activeTab === 'summary'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Import Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`text-sm font-bold pb-1.5 transition-colors relative flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Error Logs
                  {result.errors.length > 0 && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                      {result.errors.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'summary' ? (
                <div className="space-y-3 p-5 bg-green-50/20 rounded-2xl border border-green-100">
                  <div className="flex items-center gap-2.5 text-green-700 font-bold text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Import Completed Successfully!
                  </div>
                  <p className="text-xs text-gray-600 font-medium pl-7">
                    Successfully loaded and registered **{result.importedCount}** new tutor profiles. 
                    {result.errors.length > 0 && ` However, ${result.errors.length} rows failed validation rules. Check the "Error Logs" tab for details.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                  {result.errors.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="h-4 w-4" />
                        Row Validation Errors List
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 bg-red-50/20 p-3 rounded-xl border border-red-100">
                        {result.errors.map((err, idx) => (
                          <div key={idx} className="text-xs text-red-700 font-medium flex gap-2 items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-medium text-center py-4">
                      Clean import! No errors found.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-[#E5E7EB] pt-4">
          <Button variant="ghost" size="sm" onClick={() => { handleReset(); onClose(); }} disabled={isUploading} className="rounded-xl h-10">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="rounded-xl h-10 bg-purple-600 hover:bg-purple-700 text-white gap-2"
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
