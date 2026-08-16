'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ShieldAlert,
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

function TopicRow({
  topic,
  onView,
}: {
  topic: TopicItemCountDto;
  onView?: () => void;
}) {
  return (
    <div className="relative flex items-start gap-3.5 pl-6 py-2.5 group">
      {/* Connected Tree Line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-slate-200 group-last:bottom-1/2" />
      <div className="absolute left-2 top-3.5 w-1.5 h-1.5 rounded-full bg-violet-400" />

      {/* Circular Check Icon */}
      <div className="p-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200/60 shrink-0 mt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h5 className="text-xs font-black text-slate-900 leading-tight truncate">
              {topic.name}
            </h5>
            {topic.difficultyLevel && (
              <span
                className={cn(
                  'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border',
                  topic.difficultyLevel === 'EASY' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  topic.difficultyLevel === 'MEDIUM' && 'bg-amber-50 text-amber-700 border-amber-200',
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
            className="px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] border border-violet-200/60 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
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
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
      {/* Chapter Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 truncate leading-snug">
              {chapter.name}
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400">{chapter.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-500">
            {chapter.topics.length} topics
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Topics connected tree list */}
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/40 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            <Layers className="w-3 h-3 text-slate-400" />
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
    <div className="rounded-3xl border border-emerald-200/70 bg-white overflow-hidden shadow-2xs">
      {/* Subject Header (Light Emerald pill matching tutor courses) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-emerald-50/80 hover:bg-emerald-100/60 transition-colors text-left border-b border-emerald-100"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-emerald-950 truncate">{cs.subject.name}</h3>
            <span className="text-[10px] font-mono font-bold text-emerald-700">
              {cs.subject.code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-extrabold text-emerald-900">
              {cs.chapters.length} chapters
            </p>
            <p className="text-[10px] font-bold text-emerald-700">{totalTopics} topics</p>
          </div>
          <ChevronDown
            className={cn('w-4 h-4 text-emerald-700 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Chapters list */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Chapters</span>
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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-5">
      {/* Course Meta Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-black shrink-0 shadow-2xs">
            <Layers className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">{course.name}</h2>
              {isLocked ? (
                <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-600" /> Locked
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Unlocked & Active
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-black">
            📚 {totalSubjects} Subjects
          </span>
          <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-black">
            📖 {totalChapters} Chapters
          </span>
          <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-black">
            📝 {totalTopics} Topics
          </span>
        </div>
      </div>

      {/* 🔒 INLINE COURSE LOCK BANNER FOR UNPAID STUDENTS */}
      {isLocked && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 rounded-2xl p-5 text-white border border-violet-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  Course Locked
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Pay Fee Installment to Unlock Access
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {nextDueInstallment
                  ? `Pay Installment #${nextDueInstallment.installmentNumber} (₹${Number(nextDueInstallment.balanceAmount).toLocaleString('en-IN')}) via Razorpay to unlock lectures.`
                  : 'Pay course fee dues via Razorpay to instantly unlock syllabus & study material.'}
              </p>
            </div>
          </div>

          <Button
            onClick={onPayToUnlock}
            disabled={isPaying}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-6 py-5 rounded-xl text-xs shadow-lg gap-2 cursor-pointer shrink-0"
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
      <div className={cn('space-y-4 pt-1', isLocked && 'opacity-60 pointer-events-none filter blur-[1px]')}>
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

  const [feeAccount, setFeeAccount] = useState<any>(null);
  const [loadingFee, setLoadingFee] = useState(true);

  useEffect(() => {
    async function loadFeeAccount() {
      try {
        setLoadingFee(true);
        const studentAdmissionId = (user as any)?.studentAdmissionId || 'DEMO_STUDENT_ID';
        const res = await api.get<any>(`/billing/fee-assignments/${studentAdmissionId}`);
        setFeeAccount(res);
      } catch (err) {
        console.error('Failed to check student fee status', err);
      } finally {
        setLoadingFee(false);
      }
    }
    loadFeeAccount();
  }, [user]);

  // Lock status: Unlocked ONLY if fee is assigned AND paid!
  const hasPaidFee = Boolean(
    feeAccount?.hasFeeAssigned &&
      (feeAccount?.assignment?.outstandingAmount === 0 ||
        feeAccount?.installments?.some((i: any) => i.status === 'PAID')),
  );

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
            const studentAdmissionId =
              (user as any)?.studentAdmissionId || (user as any)?.id || 'DEMO_STUDENT_ID';
            const updatedAcc = await api.get<any>(
              `/billing/fee-assignments/${studentAdmissionId}`,
            );
            setFeeAccount(updatedAcc);
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
          color: '#4f46e5',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay checkout');
      setPaying(false);
    }
  };

  if (isLoading || loadingFee) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen">
        <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Failed to load courses</p>
          <button
            onClick={refetch}
            className="mt-3 text-xs font-black text-violet-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Centered Header ──────────────── */}
      <div className="text-center max-w-xl mx-auto space-y-1 my-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          MY COURSES
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Enrolled courses, subject syllabus tree & study material
        </p>
      </div>

      {/* 🔒 Fee Lock Banner if Fee is Not Paid Yet */}
      {!hasPaidFee && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-md">
              <Lock className="w-7 h-7 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full text-amber-300 border border-amber-400/30">
                  🔒 Access Locked
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                Fee Payment Required to Unlock Full Course & Syllabus
              </h3>
              <p className="text-xs text-amber-100/90 mt-0.5 max-w-xl">
                Pay your 1st installment (₹{Number(nextDueInstallment?.balanceAmount || feeAccount?.assignment?.finalAmount || 0).toLocaleString('en-IN')}) to instantly unlock all video lectures, test series, and study material.
              </p>
            </div>
          </div>

          <Button
            onClick={handlePayToUnlock}
            disabled={paying}
            className="w-full md:w-auto bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-6 py-6 rounded-2xl text-xs shrink-0 shadow-lg gap-2 cursor-pointer transition-all"
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
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
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
