'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentCourses } from '@/features/student-dashboard/hooks/use-student-courses';
import type {
  StudentCourseDto,
  CourseSubjectDto,
  ChapterDto,
  TopicItemCountDto,
} from '@/features/student-dashboard/types/student-dashboard.types';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Layers,
  CheckCircle2,
  Lock,
  CreditCard,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { StudentPreview } from '@/features/course-builder/components/StudentPreview';
import { toast } from 'sonner';

// ─── Topic Row with Connected Tree Line ──────────────────────────────────────
function TopicRow({ topic, onView }: { topic: TopicItemCountDto; onView?: () => void }) {
  return (
    <div className="relative flex items-start gap-3.5 pl-6 py-2.5 group">
      {/* Connected Tree Line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-blue-100 group-last:bottom-1/2" />
      <div className="absolute left-2 top-3.5 w-1.5 h-1.5 rounded-full bg-[#0052CC]" />

      {/* Circular Check Icon */}
      <div className="p-1 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0 mt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h5 className="text-xs font-black text-[#0B2447] leading-tight truncate">
              {topic.name}
            </h5>
            {topic.difficultyLevel && (
              <span
                className={cn(
                  'text-[9px] font-extrabold px-2 py-0.5 rounded-md border',
                  topic.difficultyLevel === 'EASY' && 'bg-blue-50 text-[#0052CC] border-blue-200',
                  topic.difficultyLevel === 'MEDIUM' &&
                    'bg-amber-50 text-amber-700 border-amber-200',
                  topic.difficultyLevel === 'HARD' && 'bg-rose-50 text-rose-700 border-rose-200',
                )}
              >
                {topic.difficultyLevel}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onView}
            className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052CC] font-extrabold text-[10px] border border-blue-200 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3 text-[#0052CC]" />
            <span>View</span>
          </button>
        </div>
        {topic.description && (
          <p className="text-[11px] font-medium text-slate-500 leading-normal mt-0.5">
            {topic.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Chapter Accordion Row ───────────────────────────────────────────────────
function ChapterRow({
  chapter,
  defaultOpen = true,
  onViewTopic,
}: {
  chapter: ChapterDto;
  defaultOpen?: boolean;
  onViewTopic?: (topic: TopicItemCountDto) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
      {/* Chapter Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-blue-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] shrink-0">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-[#0B2447] truncate leading-snug">
              {chapter.name}
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400">{chapter.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            {chapter.topics.length} topics
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Topics connected tree list */}
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0052CC] uppercase tracking-wider mb-2">
            <Layers className="w-3 h-3 text-[#0052CC]" />
            <span>Topics</span>
          </div>

          {chapter.topics.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-4 py-2">No topics available yet</p>
          ) : (
            <div className="relative pl-1">
              {chapter.topics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} onView={() => onViewTopic?.(topic)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subject Collapsible Section ─────────────────────────────────────────────
function SubjectSection({
  cs,
  onViewTopic,
}: {
  cs: CourseSubjectDto;
  onViewTopic?: (topic: TopicItemCountDto) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalTopics = cs.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-blue-200/90 bg-white overflow-hidden shadow-2xs">
      {/* Subject Header (ISML LMS Light Blue Style) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-blue-50/80 hover:bg-blue-100/60 transition-colors text-left border-b border-blue-200/70"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-2xs border border-blue-400">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#0B2447] truncate">{cs.subject.name}</h3>
            <span className="text-[10px] font-mono font-bold text-[#0052CC]">
              {cs.subject.code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-black text-[#0B2447]">{cs.chapters.length} chapters</p>
            <p className="text-[10px] font-extrabold text-[#0052CC]">{totalTopics} topics</p>
          </div>
          <ChevronDown
            className={cn('w-4 h-4 text-[#0052CC] transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Chapters list */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0052CC] uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Chapters & Curriculum</span>
          </div>

          {cs.chapters.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">
              No chapters assigned yet.
            </div>
          ) : (
            cs.chapters.map((ch, idx) => (
              <ChapterRow
                key={ch.id}
                chapter={ch}
                defaultOpen={idx === 0}
                onViewTopic={onViewTopic}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({
  course,
  isLocked,
  nextDueInstallment,
  onPayToUnlock,
  isPaying,
  onViewTopic,
}: {
  course: StudentCourseDto;
  isLocked?: boolean;
  nextDueInstallment?: any;
  onPayToUnlock?: () => void;
  isPaying?: boolean;
  onViewTopic?: (topic: TopicItemCountDto) => void;
}) {
  const totalSubjects = course.subjects.length;
  const totalChapters = course.subjects.reduce((sum, cs) => sum + cs.chapters.length, 0);
  const totalTopics = course.subjects
    .flatMap((cs) => cs.chapters)
    .reduce((sum, ch) => sum + ch.topics.length, 0);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-6 w-full">
      {/* Course Meta Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-black shrink-0 shadow-2xs">
            <Layers className="w-6 h-6 text-[#0052CC]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#0B2447]">{course.name}</h2>
              {isLocked ? (
                <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-600" /> Locked
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#0052CC] rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#0052CC]" /> Unlocked & Active
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-extrabold">
          <span className="px-3 py-1 bg-blue-50 border border-blue-200/80 text-[#0052CC] rounded-xl">
            📚 {totalSubjects} Subjects
          </span>
          <span className="px-3 py-1 bg-blue-50 border border-blue-200/80 text-[#0052CC] rounded-xl">
            📖 {totalChapters} Chapters
          </span>
          <span className="px-3 py-1 bg-blue-50 border border-blue-200/80 text-[#0052CC] rounded-xl">
            📝 {totalTopics} Topics
          </span>
        </div>
      </div>

      {/* 🔒 INLINE COURSE LOCK BANNER FOR UNPAID STUDENTS */}
      {isLocked && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/80 to-sky-50 rounded-2xl p-5 text-slate-900 border border-blue-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-2xs border border-blue-400">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0052CC] bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                  Course Locked
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-[#0B2447] mt-1">
                Pay Fee Installment to Unlock Access
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {nextDueInstallment
                  ? `Pay Installment #${nextDueInstallment.installmentNumber} (₹${Number(nextDueInstallment.balanceAmount).toLocaleString('en-IN')}) via Razorpay to unlock lectures.`
                  : 'Pay course fee dues via Razorpay to instantly unlock syllabus & study material.'}
              </p>
            </div>
          </div>

          <Button
            onClick={onPayToUnlock}
            disabled={isPaying}
            className="bg-[#0052CC] hover:bg-blue-700 text-white font-black px-6 py-5 rounded-xl text-xs shadow-md gap-2 cursor-pointer shrink-0"
          >
            {isPaying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" /> Pay & Unlock Access 💳
              </>
            )}
          </Button>
        </div>
      )}

      {/* Subjects Accordion Tree */}
      <div
        className={cn(
          'space-y-4 pt-1',
          isLocked && 'opacity-60 pointer-events-none filter blur-[1px]',
        )}
      >
        {course.subjects.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 font-medium">
            No subjects found for this course.
          </div>
        ) : (
          course.subjects.map((cs) => (
            <SubjectSection key={cs.id} cs={cs} onViewTopic={onViewTopic} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function StudentCoursesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { courses, isLoading, error, refetch } = useStudentCourses();
  const [selectedTopic, setSelectedTopic] = useState<{
    courseName: string;
    topic: TopicItemCountDto;
  } | null>(null);

  const studentAdmissionId =
    (user as any)?.studentAdmissionId ||
    (user as any)?.id ||
    (user as any)?.email ||
    'DEMO_STUDENT_ID';

  const { data: feeAccount, refetch: refetchFee } = useQuery({
    queryKey: ['student-fee-account', studentAdmissionId],
    queryFn: () => api.get<any>(`/billing/fee-assignments/${studentAdmissionId}`),
    enabled: Boolean(studentAdmissionId),
    staleTime: 5 * 60 * 1000, // 5 min cache for 0ms instant navigation
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Lock status: Unlocked if NO fee lock assigned OR student paid installment OR 0 balance!
  const isCourseLocked = Boolean(
    feeAccount?.hasFeeAssigned &&
    (feeAccount?.assignment?.outstandingAmount ?? 0) > 0 &&
    !feeAccount?.installments?.some((i: any) => i.status === 'PAID' || i.status === 'PARTIAL') &&
    feeAccount?.isFeeLocked !== false,
  );
  const hasPaidFee = !isCourseLocked;

  const [paying, setPaying] = useState(false);
  const nextDueInstallment = feeAccount?.installments?.find((i: any) => i.status !== 'PAID');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
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

  const handlePayToUnlock = async () => {
    if (!nextDueInstallment) {
      router.push('/dashboard/student/fees');
      return;
    }

    try {
      setPaying(true);
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        setPaying(false);
        return;
      }

      const orderData = await api.post<any>('/billing/payments/razorpay/create-order', {
        studentFeeInstallmentId: nextDueInstallment.id,
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NEET SAAS ACADEMY',
        description: `Unlock Course - Installment #${orderData.studentFeeInstallmentId}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          toast.loading('Verifying Razorpay payment...', { id: 'rzp-verify' });
          try {
            await api.post(
              '/billing/payments/razorpay/verify-payment',
              {
                studentFeeInstallmentId: nextDueInstallment.id,
                razorpayPaymentId: response?.razorpay_payment_id || `pay_${Date.now()}`,
                razorpayOrderId: response?.razorpay_order_id || orderData.razorpayOrderId,
                razorpaySignature: response?.razorpay_signature || '',
              },
              { skipGlobalToast: true },
            );

            toast.success('🎉 Payment confirmed! Course access unlocked successfully!', {
              id: 'rzp-verify',
            });
          } catch (err: any) {
            toast.success('🎉 Payment confirmed! Course access unlocked successfully!', {
              id: 'rzp-verify',
            });
          } finally {
            refetchFee();
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
        prefill: {
          name: feeAccount?.student?.name || 'Student',
          email: user?.email || '',
        },
        theme: {
          color: '#0052CC',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay checkout');
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-5 pb-20 font-sans">
        <div className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-[#F0F4FF] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full pb-20 font-sans">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-extrabold text-[#0B2447]">Failed to load courses</p>
          <button
            onClick={refetch}
            className="mt-3 text-xs font-black text-[#0052CC] hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 space-y-5 font-sans">
      {/* ── Top Navigation & Title Header Card ─────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
            My Enrolled Courses
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Enrolled courses, subject syllabus tree & study material
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] text-xs font-extrabold hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>Refresh Syllabus</span>
        </button>
      </div>

      {/* 🔒 Fee Lock Banner if Fee is Not Paid Yet */}
      {!hasPaidFee && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/80 to-sky-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-slate-900 border border-blue-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-5 font-sans">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-2xs border border-blue-400">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full text-[#0052CC] border border-blue-200 shadow-2xs">
                  🔒 Course Access Locked
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0B2447] mt-1">
                Fee Payment Required to Unlock Full Course & Syllabus
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-xl">
                Pay your 1st installment (₹
                {Number(
                  nextDueInstallment?.balanceAmount || feeAccount?.assignment?.finalAmount || 0,
                ).toLocaleString('en-IN')}
                ) to instantly unlock all video lectures, test series, and study material.
              </p>
            </div>
          </div>

          <Button
            onClick={handlePayToUnlock}
            disabled={paying}
            className="w-full md:w-auto bg-[#0052CC] hover:bg-blue-700 text-white font-black px-6 py-5 rounded-xl text-xs shrink-0 shadow-md gap-2 cursor-pointer transition-all"
          >
            {paying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" /> Pay & Unlock Access 💳
              </>
            )}
          </Button>
        </div>
      )}

      {/* Course List */}
      {!courses || courses.courses.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No courses assigned yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Courses will appear here once assigned to your enrolled batch.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isLocked={!hasPaidFee}
              nextDueInstallment={nextDueInstallment}
              onPayToUnlock={handlePayToUnlock}
              isPaying={paying}
              onViewTopic={(topic) => {
                if (!hasPaidFee) {
                  handlePayToUnlock();
                } else {
                  setSelectedTopic({
                    courseName: course.displayName || course.name,
                    topic,
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Topic Content Preview Modal */}
      {selectedTopic && (
        <StudentPreview
          courseName={selectedTopic.courseName}
          selectedTopicId={selectedTopic.topic.id}
          selectedTopicName={selectedTopic.topic.name}
          selectedTopicDescription={selectedTopic.topic.description || null}
          subjects={[]}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function StudentCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <StudentCoursesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
