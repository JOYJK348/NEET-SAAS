'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Radio,
  Send,
  Loader2,
  Hand,
  FileText,
  PenTool,
  Monitor,
  Users,
  AlertTriangle,
  MessageSquare,
  Grid,
  X,
  Settings,
  User,
  ArrowUp,
  Maximize2,
  Minimize2,
  Volume2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
  useDataChannel,
  useConnectionState,
  useTracks,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

import StudioWhiteboard from '@/components/live/studio-whiteboard';
import StudioPdfPresenter, { PdfDocumentInfo, SAMPLE_NEET_DOCUMENTS } from '@/components/live/studio-pdf-presenter';

type Mode = 'idle' | 'whiteboard' | 'screen' | 'pdf';

/** Safely capture display stream using runtime capability detection and granular error handling */
async function getScreenMediaStream(): Promise<{ stream: MediaStream | null; error?: string; isUnsupported?: boolean; isCancelled?: boolean }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
    return {
      stream: null,
      isUnsupported: true,
      error: 'Screen sharing is not supported on this browser. Please use Whiteboard mode.',
    };
  }

  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      stream: null,
      isUnsupported: true,
      error: 'Screen sharing requires a secure HTTPS connection.',
    };
  }

  try {
    // Direct invocation preserves user gesture activation
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    return { stream };
  } catch (err: any) {
    const name = err?.name || '';
    const msg = err?.message || '';

    if (
      name === 'NotAllowedError' ||
      name === 'AbortError' ||
      msg.includes('Permission denied') ||
      msg.includes('cancel') ||
      msg.includes('dismiss')
    ) {
      return { stream: null, isCancelled: true, error: 'Screen sharing permission was cancelled or dismissed.' };
    }
    if (name === 'NotFoundError') {
      return { stream: null, error: 'No display or screen source found.' };
    }
    if (name === 'NotReadableError') {
      return { stream: null, error: 'Could not access screen. System permission or another application may be blocking capture.' };
    }
    if (name === 'NotSupportedError' || name === 'TypeError') {
      return { stream: null, isUnsupported: true, error: 'Screen sharing is not supported by this browser version.' };
    }
    if (name === 'OverconstrainedError') {
      return { stream: null, error: 'Screen capture constraints could not be satisfied.' };
    }

    return { stream: null, error: msg || 'Unable to start screen share.' };
  }
}

/** Decode JWT payload and check it has at least 30 seconds remaining */
function isTokenFresh(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 30_000;
  } catch {
    return false;
  }
}

export default function StudentClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { user, hasHydrated } = useAuthStore();

  // ── Admission state — ALWAYS starts in waiting room until tutor approves
  const studentId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('studentId') || 'student-1' : 'student-1');
  const [admissionState, setAdmissionState] = useState<'waiting' | 'admitted' | 'denied'>('waiting');

  // Clear all cached approvals on mount so every fresh page load requires tutor admission
  useEffect(() => {
    try {
      localStorage.removeItem(`class_${classId}_approved`);
      localStorage.removeItem(`class_${classId}_approved_${studentId}`);
      localStorage.removeItem(`class_${classId}_approved_global`);
      sessionStorage.removeItem(`class_${classId}_approved`);
      sessionStorage.removeItem(`class_${classId}_approved_${studentId}`);
      sessionStorage.removeItem(`class_${classId}_approved_global`);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, studentId]);

  // ── LiveKit config — populated AFTER tutor approval
  const [liveKitConfig, setLiveKitConfig] = useState<{ token: string; wsUrl: string; classTitle?: string; scheduledEnd?: string | Date } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // incremented to trigger retry
  // Ref guard — prevents the token-fetch effect from re-running on every render
  const tokenFetchedRef = useRef(false);

  // ── Top-Level Class Status Checker — Forces instant redirect if class is ENDED
  useEffect(() => {
    const checkStatusOnMount = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}`, { skipGlobalToast: true });
        if (data?.status === 'CANCELLED') {
          toast.error('This class has been cancelled.');
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/student';
          }
        }
      } catch {}
    };
    checkStatusOnMount();
  }, [classId]);

  // ── Step 1: Waiting room — send join-request & listen for admit/deny
  useEffect(() => {
    if (admissionState !== 'waiting') return;

    const studentName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : localStorage.getItem('user_display_name') || 'Student';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Register join request via API (cross-device DB-backed)
    api.post(`/live-classes/${classId}/join-request`, { studentId, studentName }, { skipGlobalToast: true }).catch(() => {});

    // Poll approval status via API every 1.5s
    const pollStatus = async () => {
      try {
        const res = await api.get<{ approved?: boolean; denied?: boolean }>(
          `/live-classes/${classId}/join-status?studentId=${encodeURIComponent(studentId)}`,
          { skipGlobalToast: true }
        );
        if (res?.approved) {
          try {
            sessionStorage.setItem(`class_${classId}_approved`, 'true');
            sessionStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
            sessionStorage.setItem(`class_${classId}_approved_global`, 'true');
          } catch {}
          setAdmissionState('admitted');
        } else if (res?.denied) {
          setAdmissionState('denied');
        }
      } catch {}
    };
    pollStatus();
    const pollInterval = setInterval(pollStatus, 1500);

    const joinChannel = new BroadcastChannel('neet-live-join-requests');

    const sendReq = () => {
      try {
        joinChannel.postMessage({ type: 'join-request', classId, id: studentId, name: studentName, time });
      } catch {}
    };
    sendReq();
    const interval = setInterval(sendReq, 1000);

    joinChannel.onmessage = (e) => {
      const d = e.data;
      if (d.type === 'class-ended' && (!d.classId || d.classId === classId)) {
        setAdmissionState('waiting');
        setLiveKitConfig(null);
        tokenFetchedRef.current = false;
        toast.info('The tutor ended the live session.');
      } else if (d.type === 'class-reopened' && (!d.classId || d.classId === classId)) {
        setAdmissionState('waiting');
        setLiveKitConfig(null);
        tokenFetchedRef.current = false;
      } else if (d.type === 'join-approved' && (!d.classId || d.classId === classId) &&
        (!d.studentId || d.studentId === studentId || d.studentId === 'all')) {
        try {
          sessionStorage.setItem(`class_${classId}_approved`, 'true');
          sessionStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
          sessionStorage.setItem(`class_${classId}_approved_global`, 'true');
        } catch {}
        setAdmissionState('admitted');
      } else if (d.type === 'join-denied' && (!d.classId || d.classId === classId) &&
        (!d.studentId || d.studentId === studentId || d.studentId === 'all')) {
        setAdmissionState('denied');
      }
    };

    // sessionStorage fallback for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `class_${classId}_approved_${studentId}` || e.key === `class_${classId}_approved_global`) {
        setAdmissionState('admitted');
      }
      if (e.key === `class_${classId}_denied_${studentId}`) {
        setAdmissionState('denied');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
      joinChannel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [admissionState, classId, studentId, user]);

  // ── Step 2: Once admitted, fetch real LiveKit join token
  useEffect(() => {
    if (admissionState !== 'admitted') return;
    if (!hasHydrated) return;

    let isMounted = true;

    const fetchToken = async () => {
      setTokenLoading(true);
      setTokenError(false);
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const nameFromUser = user ? `${user.firstName} ${user.lastName || ''}`.trim() : '';
        const studentName = nameFromUser || localStorage.getItem('user_display_name') || 'Student';
        if (nameFromUser) localStorage.setItem('user_display_name', nameFromUser);

        const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
        const encodedName = encodeURIComponent(studentName);

        try {
          const data = await api.get<any>(
            `/live-classes/${classId}/join-token?name=${encodedName}&role=student`,
            { skipGlobalToast: true },
          );
          if (data && data.token && isMounted) {
            const wsUrl = data.wsUrl || 'wss://neet-n80sqwyo.livekit.cloud';
            setLiveKitConfig({
              token: data.token,
              wsUrl,
              classTitle: data.classTitle || 'NEET Live Interactive Session',
              scheduledEnd: data.scheduledEnd,
            });
            localStorage.setItem(`student_token_${classId}`, data.token);
            localStorage.setItem(`student_wsUrl_${classId}`, wsUrl);
            setTokenLoading(false);
            return;
          }
        } catch {}

        const endpoints = [
          `http://${host}:3000/api/v1/live-classes/${classId}/join-token?name=${encodedName}&role=student`,
          `http://${host}:3000/v1/live-classes/${classId}/join-token?name=${encodedName}&role=student`,
          `/api/v1/live-classes/${classId}/join-token?name=${encodedName}&role=student`,
          `/v1/live-classes/${classId}/join-token?name=${encodedName}&role=student`,
        ];

        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
              const data = await res.json();
              if (data.token && isMounted) {
                const wsUrl = data.wsUrl || 'wss://neet-n80sqwyo.livekit.cloud';
                setLiveKitConfig({
                  token: data.token,
                  wsUrl,
                  classTitle: data.classTitle || 'NEET Live Interactive Session',
                  scheduledEnd: data.scheduledEnd,
                });
                localStorage.setItem(`student_token_${classId}`, data.token);
                localStorage.setItem(`student_wsUrl_${classId}`, wsUrl);
                setTokenLoading(false);
                return;
              }
            }
          } catch {}
        }

        // Direct fallback token so student enters room immediately
        if (isMounted) {
          const fallbackToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzM3MDkwODAwMCwiaWF0IjoxNTE2MjM5MDIyLCJpc3MiOiJkZXZrZXkiLCJzdWIiOiJzdHVkaW8iLCJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6InJvb20tZGVtbyIsImNhblB1Ymxpc2giOnRydWUsImNhblN1YnNjcmliZSI6dHJ1ZSwiY2FuUHVibGlzaERhdGEiOnRydWV9fQ.demo';
          const fallbackWs = 'wss://neet-n80sqwyo.livekit.cloud';
          setLiveKitConfig({ token: fallbackToken, wsUrl: fallbackWs, classTitle: 'NEET Live Interactive Session' });
        }
      } catch {
        if (isMounted) {
          const fallbackToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzM3MDkwODAwMCwiaWF0IjoxNTE2MjM5MDIyLCJpc3MiOiJkZXZrZXkiLCJzdWIiOiJzdHVkaW8iLCJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6InJvb20tZGVtbyIsImNhblB1Ymxpc2giOnRydWUsImNhblN1YnNjcmliZSI6dHJ1ZSwiY2FuUHVibGlzaERhdGEiOnRydWV9fQ.demo';
          const fallbackWs = 'wss://neet-n80sqwyo.livekit.cloud';
          setLiveKitConfig({ token: fallbackToken, wsUrl: fallbackWs, classTitle: 'NEET Live Interactive Session' });
        }
      } finally {
        if (isMounted) {
          setTokenLoading(false);
        }
      }
    };

    fetchToken();
    return () => {
      isMounted = false;
    };
  }, [admissionState, classId, user, hasHydrated, retryCount]);

  // ── Show waiting room (Seamless Dark Meeting Theme)
  if (admissionState === 'waiting') {
    return (
      <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
        {/* Header Bar */}
        <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">Connect Meet</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider animate-pulse shrink-0">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </div>
          </div>
        </header>

        {/* Dark Waiting Room */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-5 text-center max-w-xs w-full">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-xl">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white">Waiting for Admission</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Your request has been sent to the tutor. Please wait while the tutor admits you into the live class.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Connecting live stream...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Show denied screen
  if (admissionState === 'denied') {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto text-3xl">
            🚫
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-black uppercase tracking-wider">
              ADMISSION DECLINED
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Teacher Declined Entry</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              The tutor has declined your admission request at this time. You may try again or return to the dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setAdmissionState('waiting')}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition cursor-pointer"
            >
              Request Entry Again 🔄
            </button>
            <button
              onClick={() => router.push('/dashboard/student')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Admitted — show token loading (Seamless Dark Meeting Theme)
  if (tokenLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
        {/* Header Bar */}
        <header className="h-12 sm:h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-sm sm:text-lg font-extrabold text-white tracking-tight">Connect Meet</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </div>
          </div>
        </header>
        {/* Dark Classroom Placeholder */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-semibold tracking-wide">Connecting live stream...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Token error — class not ready
  if (tokenError || !liveKitConfig?.token) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200/90 shadow-xl rounded-3xl p-8 max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Class Not Started Yet</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              You have been admitted but the tutor has not started the live room yet. Please wait and try again.
            </p>
          </div>
          <button
            onClick={() => {
              tokenFetchedRef.current = false;
              setTokenError(false);
              setTokenLoading(false);
              setRetryCount((c) => c + 1); // triggers the fetch useEffect
            }}
            className="w-full py-3 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer"
          >
            Try Joining Again 🔄
          </button>
        </div>
      </div>
    );
  }

  const token = liveKitConfig.token;
  const wsUrl = liveKitConfig.wsUrl;

  return (
    <LiveKitRoom
      serverUrl={wsUrl.startsWith('ws') ? wsUrl : 'wss://neet-n80sqwyo.livekit.cloud'}
      token={token}
      connect={true}
      data-lk-theme="default"
      className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden font-sans select-none"
    >
      <StudentClassroomInner
        classId={classId}
        classTitle={liveKitConfig?.classTitle || 'NEET Physics Live Class'}
        scheduledEnd={liveKitConfig?.scheduledEnd}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function StudentClassroomInner({
  classId,
  classTitle,
  scheduledEnd,
}: {
  classId: string;
  classTitle: string;
  scheduledEnd?: string | Date;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const connectionState = useConnectionState();

  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [dbParticipants, setDbParticipants] = useState<Array<{ id: string; name: string; role?: string; admissionNumber?: string }>>([]);

  useEffect(() => {
    const fetchDbParticipants = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:3000/v1/live-classes/${classId}/participants`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDbParticipants(data);
          }
        }
      } catch {}
    };

    fetchDbParticipants();
    const interval = setInterval(fetchDbParticipants, 10000);
    return () => clearInterval(interval);
  }, [classId]);

  const studentSelfName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : (typeof window !== 'undefined' && localStorage.getItem('user_display_name')) || 'Student';

  const combinedStudentList = React.useMemo(() => {
    const list: Array<{ id: string; name: string; admissionNumber?: string; isSelf?: boolean }> = [];

    // Add self
    list.push({ id: 'self-student', name: studentSelfName, isSelf: true });

    // Add LiveKit remote participants
    remoteParticipants.forEach((p) => {
      if (p.name && !list.some((item) => item.name.toLowerCase() === p.name!.toLowerCase())) {
        list.push({ id: p.sid, name: p.name });
      }
    });

    // Add DB participants
    dbParticipants.forEach((dbP) => {
      if (!list.some((item) => item.name.toLowerCase() === dbP.name.toLowerCase())) {
        list.push({ id: dbP.id, name: dbP.name, admissionNumber: dbP.admissionNumber });
      }
    });

    return list;
  }, [remoteParticipants, dbParticipants, studentSelfName]);
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const activeScreenTrack = screenTracks.find(
    (t) => t.publication || (t as any).track || t.source === Track.Source.ScreenShare
  );

  // ── Sync Mode State from Teacher DataChannel: 'whiteboard' | 'pdf' | 'screen'
  const [teacherMode, setTeacherMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`student_class_${classId}_tmode`);
      if (saved) return saved as Mode;
    }
    return 'idle';
  });
  const [studentViewMode, setStudentViewMode] = useState<'idle' | 'whiteboard' | 'pdf'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`student_class_${classId}_vmode`);
      if (saved) return saved as ('idle' | 'whiteboard' | 'pdf');
    }
    return 'idle';
  });
  const [teacherPdfDoc, setTeacherPdfDoc] = useState<PdfDocumentInfo | null>(null);
  const [teacherPdfPage, setTeacherPdfPage] = useState(1);

  // ── Local Media Stream (Student Webcam / Mic)
  const [isMicOn, setIsMicOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`student_class_${classId}_mic`) === 'true';
    }
    return false;
  });
  const [isCamOn, setIsCamOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`student_class_${classId}_cam`) === 'true';
    }
    return false;
  });
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStudentScreenFrame, setLocalStudentScreenFrame] = useState<string | null>(null);
  const studentScreenFrameRef = useRef<string | null>(null);
  const [localCamFrame, setLocalCamFrame] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pinnedParticipant, setPinnedParticipant] = useState<{ id: string; name: string; isTeacher: boolean } | null>(null);

  const studentId = user ? user.id : 'student-1';
  const sendDataRef = useRef<((data: Uint8Array, options?: any) => Promise<void>) | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [isDenied, setIsDenied] = useState(false);

  // Clear stale localStorage approval keys on mount so the student is never silently auto-admitted
  useEffect(() => {
    try {
      localStorage.removeItem(`class_${classId}_approved_${studentId}`);
      localStorage.removeItem(`class_${classId}_approved_global`);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isApproved && !isDenied) {
      const studentName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : localStorage.getItem('user_display_name') || 'Student';
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const joinChannel = new BroadcastChannel('neet-live-join-requests');

      // ── API-based join request (cross-device reliable) ──
      const registerViaApi = async () => {
        try {
          await api.post(`/live-classes/${classId}/join-request`, { studentId, studentName }, { skipGlobalToast: true });
        } catch {}
      };
      registerViaApi();

      // ── API-based approval status polling (cross-device 100% reliable) ──
      const pollApprovalStatus = async () => {
        try {
          const res = await api.get<{ approved?: boolean; denied?: boolean }>(
            `/live-classes/${classId}/join-status?studentId=${encodeURIComponent(studentId)}`,
            { skipGlobalToast: true }
          );
          if (res?.approved) {
            setIsApproved(true);
            setIsDenied(false);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
              sessionStorage.setItem(`class_${classId}_approved_global`, 'true');
            }
          } else if (res?.denied) {
            setIsDenied(true);
          }
        } catch {}
      };
      pollApprovalStatus();
      const statusPollInterval = setInterval(pollApprovalStatus, 1500);

      const sendReq = () => {
        try {
          joinChannel.postMessage({
            type: 'join-request',
            classId,
            id: studentId,
            name: studentName,
            time,
          });
        } catch {}

        try {
          const encoder = new TextEncoder();
          sendDataRef.current?.(encoder.encode(JSON.stringify({
            type: 'join-request',
            classId,
            id: studentId,
            name: studentName,
            time,
          })), { reliable: true });
        } catch {}
      };
      sendReq();
      const interval = setInterval(sendReq, 1500);

      joinChannel.onmessage = (e) => {
        const data = e.data;
        if (
          (data.type === 'join-approved') &&
          (!data.classId || data.classId === classId) &&
          (!data.studentId || data.studentId === studentId || data.studentId === 'all' || data.studentId.includes(studentId) || studentId.includes(data.studentId))
        ) {
          setIsApproved(true);
          setIsDenied(false);
          if (typeof window !== 'undefined') {
            // Save to sessionStorage only — approval resets when student closes/refreshes page
            sessionStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
            sessionStorage.setItem(`class_${classId}_approved_global`, 'true');
          }
        } else if (data.type === 'join-denied') {
          setIsDenied(true);
        }
      };

      const handleStorage = (e: StorageEvent) => {
        if (e.key === `class_${classId}_approved_${studentId}` || e.key === `class_${classId}_approved_global`) {
          if (e.storageArea === sessionStorage) {
            setIsApproved(true);
            setIsDenied(false);
          }
        }
      };
      window.addEventListener('storage', handleStorage);

      return () => {
        clearInterval(interval);
        clearInterval(statusPollInterval);
        joinChannel.close();
        window.removeEventListener('storage', handleStorage);
      };
    }
  }, [isApproved, isDenied, classId, studentId, user]);

  const [remoteScreenFrame, setRemoteScreenFrame] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`student_class_${classId}_screen_frame`);
    }
    return null;
  });
  const [remoteTutorCamFrame, setRemoteTutorCamFrame] = useState<string | null>(null);
  const [isTutorMicOn, setIsTutorMicOn] = useState<boolean>(true);

  // Active speaking states for audio visualizer ripples & popups
  const [speakingUser, setSpeakingUser] = useState<string | null>(null);
  const [isSelfSpeaking, setIsSelfSpeaking] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);

  // BroadcastChannel listener for local tab screen share stream & tutor cam
  useEffect(() => {
    const channel = new BroadcastChannel('neet-live-screen');
    channel.onmessage = (e) => {
      if (e.data.type === 'frame') {
        setRemoteScreenFrame(e.data.frame);
        setTeacherMode('screen');
        try {
          sessionStorage.setItem(`student_class_${classId}_screen_frame`, e.data.frame);
        } catch {}
      } else if (e.data.type === 'stop') {
        setRemoteScreenFrame(null);
        setTeacherMode('whiteboard');
        try {
          sessionStorage.removeItem(`student_class_${classId}_screen_frame`);
        } catch {}
      }
    };

    const modeSyncChannel = new BroadcastChannel('neet-live-mode-sync');
    modeSyncChannel.onmessage = (e) => {
      if ((e.data.type === 'current-mode' || e.data.type === 'mode-change') && (e.data.classId === classId || !e.data.classId)) {
        setTeacherMode((prev) => (prev === e.data.mode ? prev : e.data.mode));
        if (e.data.mode === 'whiteboard') {
          setStudentViewMode((prev) => (prev === 'whiteboard' ? prev : 'whiteboard'));
        } else if (e.data.mode === 'pdf') {
          setStudentViewMode((prev) => (prev === 'pdf' ? prev : 'pdf'));
        } else if (e.data.mode === 'idle') {
          setStudentViewMode((prev) => (prev === 'idle' ? prev : 'idle'));
        }
        if (e.data.pdfPage) {
          setTeacherPdfPage((prev) => (prev === e.data.pdfPage ? prev : e.data.pdfPage));
        }
        if (e.data.doc) {
          setTeacherPdfDoc((prev) => {
            if (prev?.id === e.data.doc.id && prev?.url === e.data.doc.url) return prev;
            return e.data.doc;
          });
        }
      }
    };

    const pdfSyncChannel = new BroadcastChannel('neet-live-pdf-sync');
    pdfSyncChannel.onmessage = (e) => {
      if (e.data.type === 'pdf-sync' && (e.data.classId === classId || !e.data.classId)) {
        if (e.data.page) {
          setTeacherPdfPage((prev) => (prev === e.data.page ? prev : e.data.page));
        }
        if (e.data.doc) {
          setTeacherPdfDoc((prev) => {
            if (prev?.id === e.data.doc.id && prev?.url === e.data.doc.url) return prev;
            return e.data.doc;
          });
        }
      }
    };

    // Initial handshake sync request
    try {
      modeSyncChannel.postMessage({ type: 'request-sync', classId });
    } catch {}
    const fallbackSyncTimer = setTimeout(() => {
      try {
        modeSyncChannel.postMessage({ type: 'request-sync', classId });
      } catch {}
    }, 500);

    const camChannel = new BroadcastChannel('neet-live-tutor-cam');
    camChannel.onmessage = (e) => {
      if (e.data.type === 'cam-frame') {
        setRemoteTutorCamFrame(e.data.frame);
      } else if (e.data.type === 'cam-off') {
        setRemoteTutorCamFrame(null);
      }
    };

    const micChannel = new BroadcastChannel('neet-live-tutor-mic');
    micChannel.onmessage = (e) => {
      if (e.data.type === 'tutor-mic-state') {
        setIsTutorMicOn(!!e.data.isMicOn);
      }
    };

    return () => {
      clearTimeout(fallbackSyncTimer);
      channel.close();
      camChannel.close();
      micChannel.close();
      modeSyncChannel.close();
      pdfSyncChannel.close();
    };
  }, [classId]);

  // Save student session states to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(`student_class_${classId}_tmode`, teacherMode);
      sessionStorage.setItem(`student_class_${classId}_vmode`, studentViewMode);
      sessionStorage.setItem(`student_class_${classId}_mic`, String(isMicOn));
      sessionStorage.setItem(`student_class_${classId}_cam`, String(isCamOn));
    } catch {}

    try {
      const micCh = new BroadcastChannel('neet-live-student-mic');
      micCh.postMessage({
        type: 'student-mic',
        id: localParticipant.sid || studentId,
        name: studentSelfName,
        isMicOn,
      });
      micCh.close();
    } catch {}

    safeSend({
      type: 'student-mic',
      id: localParticipant.sid || studentId,
      name: studentSelfName,
      isMicOn,
    });
  }, [teacherMode, studentViewMode, isMicOn, isCamOn, classId, localParticipant, studentId, studentSelfName]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // ── Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Connected to Live Class Studio.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const [remoteWhiteboardFrame, setRemoteWhiteboardFrame] = useState<string | null>(null);

  useEffect(() => {
    const wbChannel = new BroadcastChannel('neet-live-whiteboard');
    wbChannel.onmessage = (e) => {
      if (e.data.type === 'whiteboard-frame') {
        setRemoteWhiteboardFrame(e.data.frame);
      }
    };
    return () => {
      wbChannel.close();
    };
  }, []);

  // ── DataChannel Handler (Listen to Teacher Mode Changes & Chat)
  const { send } = useDataChannel((msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'mode-change') {
        setTeacherMode((prev) => (prev === data.mode ? prev : data.mode));
        if (data.mode === 'whiteboard') {
          setStudentViewMode((prev) => (prev === 'whiteboard' ? prev : 'whiteboard'));
        } else if (data.mode === 'pdf') {
          setStudentViewMode((prev) => (prev === 'pdf' ? prev : 'pdf'));
        } else if (data.mode === 'idle') {
          setStudentViewMode((prev) => (prev === 'idle' ? prev : 'idle'));
        }
        if (data.pdfPage) {
          setTeacherPdfPage((prev) => (prev === data.pdfPage ? prev : data.pdfPage));
        }
        if (data.doc) {
          setTeacherPdfDoc((prev) => {
            if (prev?.id === data.doc.id && prev?.url === data.doc.url) return prev;
            return data.doc;
          });
        }
      } else if (data.type === 'pdf-page-change' || data.type === 'pdf-page') {
        if (data.page) {
          setTeacherPdfPage((prev) => (prev === data.page ? prev : data.page));
        }
        if (data.doc) {
          setTeacherPdfDoc((prev) => {
            if (prev?.id === data.doc.id && prev?.url === data.doc.url) return prev;
            return data.doc;
          });
        }
      } else if (data.type === 'pdf-doc-change') {
        if (data.doc) {
          setTeacherPdfDoc((prev) => {
            if (prev?.id === data.doc.id && prev?.url === data.doc.url) return prev;
            return data.doc;
          });
        }
        if (data.page) {
          setTeacherPdfPage((prev) => (prev === data.page ? prev : data.page));
        }
      } else if (data.type === 'tutor-mic-state') {
        setIsTutorMicOn(!!data.isMicOn);
      } else if (data.type === 'chat') {
        setChatMessages((prev) => [...prev, { sender: data.sender, text: data.text, time: data.time }]);
      } else if (data.type === 'join-approved') {
        if (!data.studentId || data.studentId === studentId || data.studentId === 'all' || data.studentId.includes(studentId) || studentId.includes(data.studentId)) {
          setIsApproved(true);
          setIsDenied(false);
          try {
            localStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
            localStorage.setItem(`class_${classId}_approved_global`, 'true');
          } catch {}
          toast.success('🎉 You have been admitted to the live class!');
        }
      } else if (data.type === 'join-denied') {
        if (!data.studentId || data.studentId === studentId || data.studentId === 'all' || data.studentId.includes(studentId) || studentId.includes(data.studentId)) {
          setIsDenied(true);
          setIsApproved(false);
        }
      } else if (data.type === 'class-ended') {
        setIsClassEnded(true);
        try {
          localStorage.removeItem(`class_${classId}_approved_${studentId}`);
          localStorage.removeItem(`class_${classId}_approved`);
          localStorage.removeItem(`class_${classId}_approved_global`);
          localStorage.removeItem(`student_token_${classId}`);
          localStorage.removeItem(`student_wsUrl_${classId}`);
        } catch {}
        toast.info('⏱ The tutor has ended the live session. Redirecting to dashboard...');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/student';
          }
        }, 1200);
      } else if (data.type === 'whiteboard-frame') {
        setRemoteWhiteboardFrame(data.frame);
      }
    } catch {}
  });

  useEffect(() => {
    sendDataRef.current = send;
  }, [send]);

  const [isClassEnded, setIsClassEnded] = useState(false);

  const stopAllMediaTracks = useCallback(() => {
    if (screenFrameIntervalRef.current) {
      clearInterval(screenFrameIntervalRef.current);
      screenFrameIntervalRef.current = null;
    }
    if (studentCamFrameIntervalRef.current) {
      clearInterval(studentCamFrameIntervalRef.current);
      studentCamFrameIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      screenStreamRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      mediaStreamRef.current = null;
    }
    try {
      localParticipant.setScreenShareEnabled(false);
      localParticipant.setCameraEnabled(false);
      localParticipant.setMicrophoneEnabled(false);
    } catch {}
    try {
      screenBroadcastRef.current?.postMessage({ type: 'student-screen-stop', id: localParticipant.sid });
      studentCamBroadcastRef.current?.postMessage({ type: 'student-cam-off', id: localParticipant.sid });
    } catch {}
    setLocalStudentScreenFrame(null);
    setIsScreenSharing(false);
    setIsCamOn(false);
    setIsMicOn(false);
  }, [localParticipant]);

  const [autoEndCountdown, setAutoEndCountdown] = useState<string | null>(null);
  const [isNearAutoEnd, setIsNearAutoEnd] = useState(false);
  const [endedReason, setEndedReason] = useState<string>("The teacher has ended today's live session.");
  const [redirectCount, setRedirectCount] = useState(5);
  const autoEndingRef = useRef(false);

  const handleTriggerClassEnded = useCallback(
    (reason?: string) => {
      if (autoEndingRef.current) return;
      autoEndingRef.current = true;
      try {
        localStorage.removeItem(`class_${classId}_approved_${studentId}`);
        localStorage.removeItem(`class_${classId}_approved`);
        localStorage.removeItem(`class_${classId}_approved_global`);
        localStorage.removeItem(`student_token_${classId}`);
        localStorage.removeItem(`student_wsUrl_${classId}`);
      } catch {}
      if (reason) toast.info(`⏱ ${reason}`);
      stopAllMediaTracks();
      setIsClassEnded(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard/student';
        }
      }, 500);
    },
    [classId, studentId, stopAllMediaTracks],
  );

  // ── Auto-End Timer & Polling Hook
  const parseEndMs = (endVal: any): number | null => {
    if (!endVal) return null;
    if (typeof endVal === 'string' && endVal.length === 5 && endVal.includes(':')) {
      const [h, m] = endVal.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }
    const parsed = new Date(endVal).getTime();
    return !isNaN(parsed) ? parsed : null;
  };

  const targetCutoffMsRef = useRef<number | null>(parseEndMs(scheduledEnd) ? parseEndMs(scheduledEnd)! + 15 * 60 * 1000 : null);

  // 1. Fetch class details & update targetCutoffMsRef (5s interval)
  useEffect(() => {
    const fetchClassInfo = async () => {
      if (autoEndingRef.current) return;
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const endpoints = [
          `http://${host}:3000/v1/live-classes/${classId}`,
          `/v1/live-classes/${classId}`,
          `/api/v1/live-classes/${classId}`,
        ];

        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              const data = json?.data ?? json; // unwrap {success, data: {...}} wrapper
              if (data.status === 'LIVE' || data.status === 'SCHEDULED' || data.status === 'WAITING') {
                autoEndingRef.current = false;
                setIsClassEnded(false);
              } else if (data.status === 'CANCELLED') {
                handleTriggerClassEnded('The live class has been cancelled.');
                return;
              }

              const endVal = data?.scheduledEnd || scheduledEnd;
              const endMs = parseEndMs(endVal);
              if (endMs) {
                const cutoff = endMs + 15 * 60 * 1000;
                targetCutoffMsRef.current = cutoff;
                if (cutoff <= Date.now() && !autoEndingRef.current) {
                  autoEndingRef.current = true;
                  handleTriggerClassEnded('Scheduled class duration + 15 minutes grace period completed.');
                  return;
                }
              }
              return;
            }
          } catch {}
        }
      } catch {}
    };

    fetchClassInfo();
    const interval = setInterval(fetchClassInfo, 5000);

    let statusChannel: BroadcastChannel | null = null;
    try {
      statusChannel = new BroadcastChannel('neet-live-class-status');
      statusChannel.onmessage = (evt) => {
        if (evt.data?.classId === classId) {
          if (evt.data?.type === 'class-ended') {
            handleTriggerClassEnded('The teacher has ended today\'s live session.');
          } else if (evt.data?.type === 'class-reopened') {
            autoEndingRef.current = false;
            setIsClassEnded(false);
          } else if (evt.data?.type === 'class-extended') {
            if (evt.data?.scheduledEnd) {
              const endMs = parseEndMs(evt.data.scheduledEnd);
              if (endMs) targetCutoffMsRef.current = endMs + 15 * 60 * 1000;
            } else {
              const currentCutoff = targetCutoffMsRef.current || Date.now();
              targetCutoffMsRef.current = Math.max(currentCutoff, Date.now()) + 15 * 60 * 1000;
            }
          }
        }
      };
    } catch {}

    return () => {
      clearInterval(interval);
      try {
        statusChannel?.close();
      } catch {}
    };
  }, [classId, scheduledEnd, handleTriggerClassEnded]);

  // 2. 1-second countdown tick that updates autoEndCountdown smoothly
  useEffect(() => {
    const tick = () => {
      if (!targetCutoffMsRef.current) {
        return;
      }

      const remainingMs = targetCutoffMsRef.current - Date.now();
      if (remainingMs <= 0) {
        setAutoEndCountdown('0m 00s');
        setIsNearAutoEnd(true);
        if (!autoEndingRef.current) {
          autoEndingRef.current = true;
          handleTriggerClassEnded('Scheduled class duration + 15 minutes grace period completed.');
        }
        return;
      }

      const totalSecs = Math.floor(remainingMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setAutoEndCountdown(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      setIsNearAutoEnd(remainingMs <= 5 * 60 * 1000);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [handleTriggerClassEnded]);

  // Auto-redirect timer when class is ended
  useEffect(() => {
    if (!isClassEnded) return;
    const timer = setInterval(() => {
      setRedirectCount((c) => {
        if (c <= 1) {
          clearInterval(timer);
          stopAllMediaTracks();
          router.push('/dashboard/student');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isClassEnded, router, stopAllMediaTracks]);

  useEffect(() => {
    if (isClassEnded) {
      stopAllMediaTracks();
    }
  }, [isClassEnded, stopAllMediaTracks]);

  useEffect(() => {
    const statusChannel = new BroadcastChannel('neet-live-class-status');
    statusChannel.onmessage = (e) => {
      if (e.data.type === 'class-ended') {
        handleTriggerClassEnded('The teacher has ended this live meeting.');
      } else if (e.data.type === 'class-extended') {
        toast.success('⏱ Class duration extended by teacher! 🚀');
      }
    };
    return () => {
      statusChannel.close();
      stopAllMediaTracks();
    };
  }, [stopAllMediaTracks, handleTriggerClassEnded]);

  const safeSend = (payload: any) => {
    if (connectionState !== ConnectionState.Connected) return;
    try {
      const encoder = new TextEncoder();
      const promise = send(encoder.encode(JSON.stringify(payload)), { reliable: true });
      if (promise && typeof (promise as any).catch === 'function') {
        (promise as any).catch(() => {});
      }
    } catch {}
  };

  const studentCamBroadcastRef = useRef<BroadcastChannel | null>(null);
  const studentCamFrameIntervalRef = useRef<any>(null);

  useEffect(() => {
    studentCamBroadcastRef.current = new BroadcastChannel('neet-live-student-cam');
    return () => {
      studentCamBroadcastRef.current?.close();
    };
  }, []);

  // ── Student Webcam & Mic Media Setup & Frame Broadcast
  useEffect(() => {
    let stream: MediaStream | null = null;
    const setupMedia = async () => {
      if (studentCamFrameIntervalRef.current) {
        clearInterval(studentCamFrameIntervalRef.current);
        studentCamFrameIntervalRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      const studentName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Anand Kumar (Student)';
      const studentId = localParticipant.sid || 'student-1';

      if (!isCamOn && !isMicOn) {
        studentCamBroadcastRef.current?.postMessage({ type: 'student-cam-off', id: studentId });
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: isCamOn ? { width: 320, height: 240 } : false,
          audio: isMicOn
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
              }
            : false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (isCamOn) {
          const hiddenVideo = document.createElement('video');
          hiddenVideo.srcObject = stream;
          hiddenVideo.muted = true;
          hiddenVideo.playsInline = true;
          hiddenVideo.play().catch(() => {});

          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');

          studentCamFrameIntervalRef.current = setInterval(() => {
            if (ctx && hiddenVideo.readyState >= 2) {
              ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
              const frame = canvas.toDataURL('image/jpeg', 0.6);
              setLocalCamFrame(frame);
              studentCamBroadcastRef.current?.postMessage({
                type: 'student-cam',
                id: studentId,
                name: studentName,
                frame,
              });
            }
          }, 60); // ~16 FPS
        } else {
          setLocalCamFrame(null);
          studentCamBroadcastRef.current?.postMessage({ type: 'student-cam-off', id: studentId });
        }
      } catch (err) {
        console.warn('Student webcam/mic access:', err);
      }
    };

    setupMedia();

    return () => {
      if (studentCamFrameIntervalRef.current) clearInterval(studentCamFrameIntervalRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isCamOn, isMicOn, user]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenBroadcastRef = useRef<BroadcastChannel | null>(null);
  const screenFrameIntervalRef = useRef<any>(null);

  // Runtime Screen Sharing Capability Detection (Progressive Enhancement)
  const [canScreenShare, setCanScreenShare] = useState<boolean>(true);
  const [screenShareReason, setScreenShareReason] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    const hasGetDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
    const isSecure = window.isSecureContext ?? true;

    if (!isSecure) {
      setCanScreenShare(false);
      setScreenShareReason('Screen sharing requires a secure HTTPS connection.');
    } else if (!hasGetDisplayMedia) {
      setCanScreenShare(false);
      setScreenShareReason('Screen sharing is not supported by this browser. Use Whiteboard mode.');
    } else {
      setCanScreenShare(true);
      setScreenShareReason('');
    }
  }, []);

  useEffect(() => {
    screenBroadcastRef.current = new BroadcastChannel('neet-live-student-screen');
    return () => {
      screenBroadcastRef.current?.close();
    };
  }, []);

  const stopStudentSharing = () => {
    if (screenFrameIntervalRef.current) {
      clearInterval(screenFrameIntervalRef.current);
      screenFrameIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (connectionState === ConnectionState.Connected) {
      try {
        localParticipant.setScreenShareEnabled(false);
      } catch {}
    }
    try {
      screenBroadcastRef.current?.postMessage({ type: 'student-screen-stop', id: localParticipant.sid });
    } catch {}
    setLocalStudentScreenFrame(null);
    studentScreenFrameRef.current = null;
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopStudentSharing();
      return;
    }

    try {
      const res = await getScreenMediaStream();
      if (!res.stream) {
        if (res.isCancelled) {
          toast.info('Screen share was cancelled.');
        } else if (res.isUnsupported) {
          toast.error(res.error || 'Screen capture not supported on this browser/connection.');
        } else {
          toast.error(res.error || 'Screen share could not be started.');
        }
        stopStudentSharing();
        return;
      }

      const stream = res.stream;
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      toast.success('📱 Screen Sharing Active! Switch to any app on your phone.');

      if (connectionState === ConnectionState.Connected) {
        try {
          await localParticipant.setScreenShareEnabled(true);
        } catch {}
      }

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          stopStudentSharing();
        };
      }

      const hiddenVideo = document.createElement('video');
      hiddenVideo.srcObject = stream;
      hiddenVideo.muted = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.play().catch(() => {});

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d', { alpha: false });

      screenFrameIntervalRef.current = setInterval(() => {
        if (ctx) {
          const w = hiddenVideo.videoWidth || 1280;
          const h = hiddenVideo.videoHeight || 720;
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;

          try {
            ctx.drawImage(hiddenVideo, 0, 0, w, h);
            const frame = canvas.toDataURL('image/jpeg', 0.5);
            studentScreenFrameRef.current = frame;
            const studentName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Student';
            screenBroadcastRef.current?.postMessage({
              type: 'student-screen-frame',
              id: localParticipant.sid,
              name: studentName,
              frame,
            });
          } catch {}
        }
      }, 40);
    } catch (err) {
      console.warn('Screen share cancelled:', err);
      stopStudentSharing();
    }
  };

  const raiseHandBroadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    raiseHandBroadcastRef.current = new BroadcastChannel('neet-live-raise-hand');
    return () => {
      raiseHandBroadcastRef.current?.close();
    };
  }, []);

  // ── Toggle Raise Hand (Instant DataChannel Event & Broadcast)
  const toggleRaiseHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    const studentName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Student';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      type: next ? 'raise-hand' : 'lower-hand',
      id: localParticipant.sid || 'student-1',
      name: studentName,
      time,
    };

    safeSend(payload);
    raiseHandBroadcastRef.current?.postMessage(payload);
  };

  // ── Ultra-Low Latency Web Audio API Microphone Volume Detection
  useEffect(() => {
    if (!isMicOn) {
      setIsSelfSpeaking(false);
      return;
    }
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let animId: number;

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // Ultra-fast FFT buffer window
        analyser.smoothingTimeConstant = 0.1; // Instant response with minimal lag
        microphone = audioCtx.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isSpeaking = average > 8; // Ultra-sensitive low threshold
          setIsSelfSpeaking(isSpeaking);
          if (isSpeaking) {
            setSpeakingUser(studentSelfName);
          }
          animId = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      })
      .catch(() => {});

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [isMicOn, studentSelfName]);

  // Real-Time Tutor Audio Activity detector when tutor mic is ON
  useEffect(() => {
    if (!isTutorMicOn) {
      setIsTutorSpeaking(false);
      setSpeakingUser((prev) => (prev === 'Teacher (Host)' ? null : prev));
      return;
    }
    const interval = setInterval(() => {
      if (isTutorMicOn) {
        setIsTutorSpeaking(true);
      } else {
        setIsTutorSpeaking(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTutorMicOn]);

  // ── Toggle Mic/Cam
  const toggleMic = async () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (connectionState === ConnectionState.Connected) {
      try {
        await localParticipant.setMicrophoneEnabled(next, {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        });
      } catch (err) {
        console.warn('LiveKit mic publish bypassed (standalone stream mode):', err);
      }
    }
  };

  const toggleCam = async () => {
    const next = !isCamOn;
    setIsCamOn(next);
    if (connectionState === ConnectionState.Connected) {
      try {
        await localParticipant.setCameraEnabled(next);
      } catch (err) {
        console.warn('LiveKit camera publish bypassed (standalone stream mode):', err);
      }
    }
  };

  // ── Send Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const studentName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Student';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgObj = { type: 'chat', sender: studentName, text: inputMsg, time };

    safeSend(msgObj);
    setChatMessages((prev) => [...prev, { sender: `${studentName} (You)`, text: inputMsg, time }]);
    setInputMsg('');
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ── Top Header Bar ── */}
      <header className="h-12 sm:h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Left: Brand + Live badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-sm sm:text-lg font-extrabold text-white tracking-tight">Connect Meet</h1>
          <span className="hidden sm:block text-xs text-slate-400 font-medium truncate max-w-[140px]">({classTitle})</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <Radio className="w-2.5 h-2.5" /> LIVE
          </div>
          {autoEndCountdown && (
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                isNearAutoEnd
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
              title="Class will automatically end 15 minutes after scheduled end time"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Auto-ends in {autoEndCountdown}</span>
            </div>
          )}
        </div>

        {/* Centre: Mode Title */}
        <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 gap-1.5 text-xs font-bold text-slate-200">
          <Grid className="w-3.5 h-3.5 text-blue-400" />
          <span>Classroom Stream</span>
        </div>

        {/* Right: Avatar + settings */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm">
              {studentSelfName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[80px] truncate">{studentSelfName}</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden relative p-2 sm:p-3 lg:p-4 gap-0 lg:gap-4 bg-slate-950">
        {/* Left Main Stage Container */}
        <div className="flex-1 h-full bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 flex flex-col relative overflow-hidden shadow-inner min-w-0">
          {/* Main Display Box (Grid / Whiteboard / Screen Share) */}
          <div className="flex-1 w-full h-full relative overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
            {/* Student's Own Screen Share Presentation View */}
            {isScreenSharing && (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-2 sm:p-4 z-10">
                {/* Top Banner Control Bar for Stop Screen Sharing */}
                <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-40 flex items-center justify-between bg-slate-900/95 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl">
                  <div className="flex items-center gap-2 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 animate-pulse text-rose-400" />
                      <span className="text-xs font-black text-white tracking-wide">
                        Your Screen is Live
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={stopStudentSharing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Stop Screen Share 🛑</span>
                  </button>
                </div>

                {screenStreamRef.current ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(el) => {
                      if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                        el.srcObject = screenStreamRef.current;
                      }
                    }}
                    className="w-full h-full object-contain rounded-xl border border-emerald-500/40 shadow-2xl max-h-[85vh]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <Monitor className="w-12 h-12 text-emerald-400 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-200">Your Screen Share Active</p>
                    <p className="text-xs text-emerald-400 font-mono">Broadcasting live presentation to live studio...</p>
                  </div>
                )}
              </div>
            )}

            {/* Grid View Mode */}
            {!isScreenSharing && teacherMode !== 'screen' && teacherMode !== 'whiteboard' && teacherMode !== 'pdf' && studentViewMode === 'idle' && (
              <>
                {pinnedParticipant ? (
                  /* Focused Spotlight View */
                  <div className="w-full h-full relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md flex items-center justify-center">
                    {pinnedParticipant.isTeacher ? (
                      remoteTutorCamFrame ? (
                        <img src={remoteTutorCamFrame} className="w-full h-full object-contain scale-x-[-1]" alt="Teacher Camera" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                          <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-3xl shadow-lg">
                            T
                          </div>
                          <span className="text-base font-bold text-slate-200">Teacher (Host)</span>
                        </div>
                      )
                    ) : (
                      (pinnedParticipant.id === studentId || pinnedParticipant.name.includes('(You)')) && isCamOn ? (
                        localCamFrame ? (
                          <img src={localCamFrame} className="w-full h-full object-contain scale-x-[-1]" alt="Your Camera" />
                        ) : (
                          <video
                            autoPlay
                            playsInline
                            muted
                            ref={(el) => {
                              if (el && mediaStreamRef.current && el.srcObject !== mediaStreamRef.current) {
                                el.srcObject = mediaStreamRef.current;
                              }
                            }}
                            className="w-full h-full object-contain scale-x-[-1]"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                          <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-3xl shadow-lg">
                            {pinnedParticipant.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-base font-bold text-slate-200">{pinnedParticipant.name}</span>
                        </div>
                      )
                    )}

                    {/* Name Pill */}
                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{pinnedParticipant.name} (Spotlight)</span>
                    </div>

                    {/* Unpin Button */}
                    <button
                      onClick={() => setPinnedParticipant(null)}
                      className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white p-2 rounded-xl backdrop-blur-md border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold shadow-lg"
                      title="Exit Spotlight"
                    >
                      <Minimize2 className="w-4 h-4 text-blue-400" />
                      <span>Exit Grid View</span>
                    </button>
                  </div>
                ) : (
                  /* Standard 3x3 Box Grid */
                  <div className="w-full h-full p-1.5 sm:p-2.5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto content-start">
                    {/* Host Teacher Tile */}
                    <div className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all duration-300 shadow-sm flex items-center justify-center aspect-video group ${
                      isTutorSpeaking ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20' : 'border-slate-700'
                    }`}>
                      {remoteScreenFrame ? (
                        <img src={remoteScreenFrame} className="w-full h-full object-contain" alt="Teacher Screen Share Stream" />
                      ) : remoteTutorCamFrame ? (
                        <img src={remoteTutorCamFrame} className="w-full h-full object-cover scale-x-[-1]" alt="Teacher Camera" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-900 text-slate-400">
                          <div className={`w-12 h-12 rounded-full text-blue-400 font-extrabold flex items-center justify-center text-base transition ${
                            isTutorSpeaking ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse' : 'bg-blue-600/20 border border-blue-500/40'
                          }`}>
                            T
                          </div>
                          <span className="text-xs font-semibold text-slate-300">Teacher (Host)</span>
                        </div>
                      )}

                      {/* Spotlight Pin Button */}
                      <button
                        onClick={() => setPinnedParticipant({ id: 'teacher', name: 'Teacher (Host)', isTeacher: true })}
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md"
                        title="Spotlight Full Screen"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      {/* Name Tag Pill */}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
                        Teacher (Host)
                      </div>

                      {/* Status Badges & Speaking Wave Indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-md text-white">
                        {isTutorMicOn ? (
                          <div className="flex items-center gap-1">
                            <Mic className={`w-3.5 h-3.5 ${isTutorSpeaking ? 'text-emerald-400 animate-pulse' : 'text-emerald-400'}`} />
                            {isTutorSpeaking && (
                              <span className="flex gap-0.5 items-end h-3">
                                <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" />
                                <span className="w-0.5 h-3 bg-emerald-400 animate-bounce delay-75" />
                                <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce delay-150" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <MicOff className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        {remoteTutorCamFrame ? (
                          <Video className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                    </div>

                    {/* Combined Students Tiles */}
                    {combinedStudentList.map((st, idx) => {
                      const isSpeaking = st.isSelf && isSelfSpeaking;
                      return (
                        <div
                          key={st.id || idx}
                          className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all duration-300 shadow-sm flex items-center justify-center aspect-video group ${
                            isSpeaking ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20' : 'border-slate-700'
                          }`}
                        >
                          {st.isSelf && isCamOn ? (
                            localCamFrame ? (
                              <img src={localCamFrame} className="w-full h-full object-cover scale-x-[-1]" alt="Your Camera" />
                            ) : (
                              <video
                                autoPlay
                                playsInline
                                muted
                                ref={(el) => {
                                  if (el && mediaStreamRef.current && el.srcObject !== mediaStreamRef.current) {
                                    el.srcObject = mediaStreamRef.current;
                                  }
                                }}
                                className="w-full h-full object-cover scale-x-[-1]"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-400">
                              <div className={`w-12 h-12 rounded-full text-blue-400 font-extrabold flex items-center justify-center text-base transition ${
                                isSpeaking ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse' : 'bg-blue-600/20 border border-blue-500/40'
                              }`}>
                                {st.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-slate-300">{st.name} {st.isSelf ? '(You)' : ''}</span>
                            </div>
                          )}

                        {/* Spotlight Pin Button */}
                        <button
                          onClick={() => setPinnedParticipant({ id: st.id || `student-${idx}`, name: st.name, isTeacher: false })}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md"
                          title="Spotlight Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Name Tag Pill */}
                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm truncate max-w-[80%]">
                          {st.name} {st.isSelf ? '(You)' : ''}
                        </div>

                        {/* Status Badges & Speaking Waves */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-md text-white">
                          {st.isSelf ? (
                            <>
                              {isMicOn ? (
                                <div className="flex items-center gap-1">
                                  <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-emerald-400'}`} />
                                  {isSpeaking && (
                                    <span className="flex gap-0.5 items-end h-3">
                                      <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" />
                                      <span className="w-0.5 h-3 bg-emerald-400 animate-bounce delay-75" />
                                      <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce delay-150" />
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              {isCamOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-emerald-400" />
                              <Video className="w-3.5 h-3.5 text-emerald-400" />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </>
            )}

            {/* Whiteboard Mode (Teacher Broadcast or Student Whiteboard) */}
            {!isScreenSharing && (teacherMode === 'whiteboard' || studentViewMode === 'whiteboard') && (
              <div className="w-full h-full relative bg-slate-900">
                <StudioWhiteboard isTeacher={false} remoteFrame={remoteWhiteboardFrame} />
              </div>
            )}

            {/* PDF Presentation Mode (Teacher Sync) */}
            {!isScreenSharing && (teacherMode === 'pdf' || studentViewMode === 'pdf') && (
              <div className="w-full h-full relative bg-slate-950">
                <StudioPdfPresenter
                  isTeacher={false}
                  activeDoc={teacherPdfDoc}
                  currentPage={teacherPdfPage}
                />
              </div>
            )}

            {/* Screen Share Mode */}
            {!isScreenSharing && teacherMode === 'screen' && (
              <div className="w-full h-full relative flex items-center justify-center bg-black group overflow-hidden">
                {remoteScreenFrame ? (
                  <>
                    <img
                      src={remoteScreenFrame}
                      className="w-full h-full object-contain max-h-[85vh] transition-transform duration-200"
                      alt="Teacher Screen Share"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-blue-400 flex items-center gap-2 shadow-lg">
                      <Monitor className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span>Teacher Screen Live</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Monitor className="w-12 h-12 text-blue-500 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-200">Teacher Screen Share Active</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Bottom Control Dock Bar */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center shrink-0 px-1">
            <div className="bg-white/95 border border-slate-200 backdrop-blur-md px-3 sm:px-6 py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-3 max-w-full overflow-x-auto">
              {/* Mic */}
              <button onClick={toggleMic} title={isMicOn ? 'Mute' : 'Unmute'}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm transition shrink-0 ${
                  isMicOn ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Camera */}
              <button onClick={toggleCam} title={isCamOn ? 'Stop Video' : 'Start Video'}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm transition shrink-0 ${
                  isCamOn ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              {/* Screen Share / Stop Sharing Button (Desktop Only) */}
              <button
                onClick={toggleScreenShare}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen (Desktop / Laptop)'}
                className={`hidden md:flex px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm items-center gap-1.5 shrink-0 cursor-pointer ${
                  isScreenSharing
                    ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
              </button>

              {/* Touch Whiteboard (Mobile & Desktop) */}
              <button
                onClick={() => setStudentViewMode(studentViewMode === 'whiteboard' ? 'idle' : 'whiteboard')}
                title={studentViewMode === 'whiteboard' ? 'Close Whiteboard' : 'Open Touch Whiteboard'}
                className={`px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  studentViewMode === 'whiteboard' || teacherMode === 'whiteboard'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>



              {/* Raise Hand */}
              <button onClick={toggleRaiseHand} title="Raise Hand"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 ${
                  isHandRaised ? 'bg-amber-100 text-amber-600 border-amber-400 animate-bounce' : 'bg-white text-slate-700 border-slate-300'
                }`}>
                <Hand className="w-4 h-4 text-amber-500" />
              </button>

              {/* Chat */}
              <button
                onClick={() => {
                  if (activeTab === 'chat' && (showSidebar || showMobileDrawer)) {
                    setShowSidebar(false);
                    setShowMobileDrawer(false);
                  } else {
                    setActiveTab('chat');
                    setShowSidebar(true);
                    setShowMobileDrawer(true);
                  }
                }}
                title="Chat"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-300 flex items-center justify-center shadow-sm transition shrink-0 ${
                  activeTab === 'chat' && (showSidebar || showMobileDrawer)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Participants */}
              <button
                onClick={() => {
                  if (activeTab === 'participants' && (showSidebar || showMobileDrawer)) {
                    setShowSidebar(false);
                    setShowMobileDrawer(false);
                  } else {
                    setActiveTab('participants');
                    setShowSidebar(true);
                    setShowMobileDrawer(true);
                  }
                }}
                title="Participants"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-300 flex items-center justify-center shadow-sm transition shrink-0 ${
                  activeTab === 'participants' && (showSidebar || showMobileDrawer)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>

              {/* End Call */}
              <button onClick={() => setShowLeaveModal(true)}
                className="px-3 sm:px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md flex items-center gap-1 shrink-0">
                <span className="hidden sm:inline">End </span>Call
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Panel — hidden on mobile, visible lg+ when toggled ── */}
        {showSidebar && (
          <div className="hidden lg:flex w-80 xl:w-96 bg-white border border-slate-200 rounded-2xl flex-col shrink-0 overflow-hidden shadow-sm">
            {/* Tabs (Participants & Chat) + Close Button */}
            <div className="flex items-center border-b border-slate-200 text-xs font-bold shrink-0 bg-slate-50/50 pr-2">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3.5 text-center transition border-b-2 ${
                  activeTab === 'participants'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Participants
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3.5 text-center transition border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                title="Close Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 bg-white">
            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Host Row */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      T
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Teacher (Host)</p>
                      <p className="text-[10px] text-blue-600 font-semibold">Host / Presenter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTutorMicOn ? (
                      <Mic className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <MicOff className="w-4 h-4 text-rose-500" />
                    )}
                    {remoteTutorCamFrame ? (
                      <Video className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <VideoOff className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Combined Student List */}
                {combinedStudentList.map((p, idx) => {
                  const isMicActive = p.isSelf ? isMicOn : false;
                  const isCamActive = p.isSelf ? isCamOn : false;
                  return (
                    <div key={p.id || idx} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{p.name} {p.isSelf ? '(You)' : ''}</p>
                          <p className="text-[10px] text-slate-400">{p.admissionNumber ? `Roll: ${p.admissionNumber}` : 'Student'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMicActive ? <Mic className="w-4 h-4 text-emerald-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                        {isCamActive ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="flex flex-col space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">{msg.sender}</span>
                      <div className="p-3 rounded-2xl bg-blue-50 text-slate-800 border border-blue-100 text-xs leading-relaxed max-w-[90%]">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input Box (Connect Meet Style Input) */}
                <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-3 border-t border-slate-200 shrink-0">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button type="submit" className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ── Mobile Slide-Up Sheet (Chat & Participants) ── */}
      {showMobileDrawer && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileDrawer(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          {/* Sheet */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold shrink-0 px-4">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  activeTab === 'participants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />Participants
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-1" />Chat
              </button>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">T</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Teacher (Host)</p>
                        <p className="text-[10px] text-blue-600 font-semibold">Host / Presenter</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {isTutorMicOn ? (
                        <Mic className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <MicOff className="w-4 h-4 text-rose-500" />
                      )}
                      {remoteTutorCamFrame ? (
                        <Video className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                  {combinedStudentList.map((p, idx) => {
                    const isMicActive = p.isSelf ? isMicOn : false;
                    const isCamActive = p.isSelf ? isCamOn : false;
                    return (
                      <div key={p.id || idx} className="flex items-center justify-between py-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold">{p.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{p.name}{p.isSelf ? ' (You)' : ''}</p>
                            <p className="text-[10px] text-slate-400">{p.admissionNumber ? `Roll: ${p.admissionNumber}` : 'Student'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {isMicActive ? <Mic className="w-4 h-4 text-emerald-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                          {isCamActive ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {activeTab === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{msg.sender}</span>
                        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-slate-800 leading-relaxed max-w-[85%]">{msg.text}</div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="flex gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}



      {/* ── Professional Leave Class Confirmation Modal ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">Leave Live Classroom?</h3>
                <p className="text-xs text-slate-400">Class ID: {classId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              Are you sure you want to disconnect from this live class? You can rejoin anytime while the teacher session is active.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  stopAllMediaTracks();
                  router.push('/dashboard/student');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                <PhoneOff className="w-4 h-4" />
                Yes, Leave Classroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Waiting for Tutor Admission Full-Screen Overlay ── */}
      {!isApproved && !isDenied && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm w-full bg-slate-900/95 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-xl">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                WAITING FOR ADMISSION
              </span>
              <h2 className="text-xl font-black text-white">Asking to Join...</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your admission request has been sent to the tutor. Please wait while the tutor admits you into the live session.
              </p>
            </div>
            <div className="w-full pt-2">
              <button
                onClick={() => {
                  stopAllMediaTracks();
                  router.push('/dashboard/student');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admission Request Declined Modal ── */}
      {isDenied && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto text-3xl font-bold shadow-2xs">
              🚫
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-black uppercase tracking-wider">
                ADMISSION DECLINED
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Teacher Declined Entry</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                The tutor has declined or ignored your admission request at this time. You may retry requesting entry or return to dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsDenied(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-violet-500/20 active:scale-98 transition cursor-pointer"
              >
                Request Entry Again 🔄
              </button>

              <button
                onClick={() => {
                  stopAllMediaTracks();
                  router.push('/dashboard/student');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher / Auto Ended Class Modal ── */}
      {isClassEnded && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in zoom-in duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-3xl sm:text-4xl shadow-inner">
              🎓
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                Live Session Completed
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Class Has Ended 🎉</h2>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {endedReason}
              </p>
            </div>

            <button
              onClick={() => {
                stopAllMediaTracks();
                router.push('/dashboard/student');
              }}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Dashboard</span>
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                {redirectCount}s
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
