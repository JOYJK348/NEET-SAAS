'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Radio,
  Send,
  Loader2,
  Users,
  FileText,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Hand,
  Disc,
  X,
  AlertTriangle,
  MessageSquare,
  Grid,
  Layers,
  Menu,
  Settings,
  User,
  ArrowUp,
  Maximize2,
  Minimize2,
  Volume2,
  UserCheck,
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
  useTracks,
  useConnectionState,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import { useAuth } from '@/providers/auth-provider';

import StudioWhiteboard from '@/components/live/studio-whiteboard';

type Mode = 'idle' | 'whiteboard' | 'screen';

/** Decode JWT payload and check it has at least 30 seconds remaining */
function isTokenFresh(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 30_000;
  } catch {
    return false;
  }
}

interface LiveClassDetail {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
}

export default function TeacherStudioPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { user } = useAuth();

  // Always start null/true — consistent on both SSR and client to avoid hydration mismatch.
  // useEffect reads localStorage right after mount (~1 frame).
  const [liveKitConfig, setLiveKitConfig] = useState<{
    token: string;
    wsUrl: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const cachedToken = localStorage.getItem(`tutor_token_${classId}`);
      const cachedWsUrl = localStorage.getItem(`tutor_wsUrl_${classId}`);
      if (cachedToken && cachedWsUrl && isTokenFresh(cachedToken)) {
        return { token: cachedToken, wsUrl: cachedWsUrl };
      }
    }
    return null;
  });

  const [classDetail, setClassDetail] = useState<LiveClassDetail | null>(null);
  const [loading, setLoading] = useState(() => !liveKitConfig);

  // ── Top-Level Class Status Checker — Forces instant redirect if class is ENDED
  useEffect(() => {
    const checkStatusOnMount = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:3000/v1/live-classes/${classId}`);
        if (res.ok) {
          const json = await res.json();
          const data = json?.data ?? json;
          if (data?.status === 'ENDED' || data?.status === 'CANCELLED') {
            try {
              localStorage.removeItem(`tutor_admitted_students_${classId}`);
              localStorage.removeItem(`tutor_token_${classId}`);
              localStorage.removeItem(`tutor_wsUrl_${classId}`);
            } catch {}
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard/tutor';
            }
          }
        }
      } catch {}
    };
    checkStatusOnMount();
    const interval = setInterval(checkStatusOnMount, 2000);
    return () => clearInterval(interval);
  }, [classId]);

  useEffect(() => {
    const initClassroom = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const teacherName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Teacher (Host)';
        const accessToken = typeof window !== 'undefined'
          ? (localStorage.getItem('accessToken') || localStorage.getItem('token') || '')
          : '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };

        let res: Response | null = null;

        // Try API endpoints with Authorization header
        const startEndpoints = [
          `http://${host}:3000/v1/live-classes/${classId}/start`,
          `/v1/live-classes/${classId}/start`,
          `/api/v1/live-classes/${classId}/start`,
        ];

        for (const url of startEndpoints) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 800);
            res = await fetch(url, { method: 'POST', headers, signal: controller.signal });
            clearTimeout(timer);
            if (res && res.ok) break;
          } catch {}
        }

        if (res && res.ok) {
          const data = await res.json();
          if (data.token) {
            const wsUrl = data.wsUrl || 'wss://neet-n80sqwyo.livekit.cloud';
            setLiveKitConfig({ token: data.token, wsUrl });
            if (data.liveClass) setClassDetail(data.liveClass);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`tutor_token_${classId}`, data.token);
              localStorage.setItem(`tutor_wsUrl_${classId}`, wsUrl);
            }
            setLoading(false);
            return;
          }
        }

        // Fallback: Join token endpoint
        const encodedTeacher = encodeURIComponent(teacherName);
        let tokenRes: Response | null = null;
        const joinEndpoints = [
          `http://${host}:3000/v1/live-classes/${classId}/join-token?name=${encodedTeacher}&role=host`,
          `/v1/live-classes/${classId}/join-token?name=${encodedTeacher}&role=host`,
          `/api/v1/live-classes/${classId}/join-token?name=${encodedTeacher}&role=host`,
        ];

        for (const url of joinEndpoints) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 800);
            tokenRes = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timer);
            if (tokenRes && tokenRes.ok) break;
          } catch {}
        }

        if (tokenRes && tokenRes.ok) {
          const data = await tokenRes.json();
          if (data.token) {
            const wsUrl = data.wsUrl || 'wss://neet-n80sqwyo.livekit.cloud';
            setLiveKitConfig({ token: data.token, wsUrl });
            if (typeof window !== 'undefined') {
              localStorage.setItem(`tutor_token_${classId}`, data.token);
              localStorage.setItem(`tutor_wsUrl_${classId}`, wsUrl);
            }
            setLoading(false);
            return;
          }
        }

        // Final fallback: Generate interactive session configuration
        const fallbackToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzM3MDkwODAwMCwiaWF0IjoxNTE2MjM5MDIyLCJpc3MiOiJkZXZrZXkiLCJzdWIiOiJzdHVkaW8iLCJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6InJvb20tZGVtbyIsImNhblB1Ymxpc2giOnRydWUsImNhblN1YnNjcmliZSI6dHJ1ZSwiY2FuUHVibGlzaERhdGEiOnRydWV9fQ.demo';
        const fallbackWs = 'wss://demo-livekit.example.com';
        setLiveKitConfig({ token: fallbackToken, wsUrl: fallbackWs });
      } catch (err) {
        console.error('Failed to init live studio:', err);
      } finally {
        setLoading(false);
      }
    };

    initClassroom();
  }, [classId, user]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
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
        <div className="flex-1 bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-semibold tracking-wide">Initializing Teacher Live Studio...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!liveKitConfig?.token) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-6">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-1">Unable to Start Studio</p>
          <p className="text-sm text-slate-400">Could not get a valid session token. Check the API server is running.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const token = liveKitConfig.token;
  const wsUrl = liveKitConfig.wsUrl;
  const isValidJwt = token && token.split('.').length === 3 && !token.endsWith('.demo');

  return (
    <LiveKitRoom
      serverUrl={wsUrl.startsWith('ws') ? wsUrl : 'wss://neet-n80sqwyo.livekit.cloud'}
      token={token}
      connect={Boolean(isValidJwt)}
      data-lk-theme="default"
      className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden font-sans select-none"
    >
      <TeacherStudioInner
        classId={classId}
        classTitle={classDetail?.title || 'NEET Physics Live Studio'}
        scheduledEnd={classDetail?.scheduledEnd}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function TeacherStudioInner({
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

  const tutorName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Teacher (Host)';

  // ── Database Joined Participants Sync
  const [dbParticipants, setDbParticipants] = useState<Array<{ id: string; name: string; role?: string; admissionNumber?: string }>>([]);

  const [showEndModal, setShowEndModal] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const safeSendRef = useRef<((payload: any) => void) | null>(null);
  const stopMediaTracksRef = useRef<(() => void) | null>(null);

  const confirmEndClass = useCallback(async () => {
    setEndingClass(true);
    try {
      localStorage.removeItem(`tutor_admitted_students_${classId}`);
      localStorage.removeItem(`tutor_token_${classId}`);
      localStorage.removeItem(`tutor_wsUrl_${classId}`);
    } catch {}
    // Broadcast class-ended event to all connected students
    safeSendRef.current?.({ type: 'class-ended' });
    try {
      const statusChannel = new BroadcastChannel('neet-live-class-status');
      statusChannel.postMessage({ type: 'class-ended', classId });
      statusChannel.close();
    } catch {}

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      await fetch(`http://${host}:3000/v1/live-classes/${classId}/end`, { method: 'POST' });
    } catch {}

    stopMediaTracksRef.current?.();
    toast.info('⏱ Live class ended. Redirecting to dashboard...');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/tutor';
      }
    }, 400);
  }, [classId]);

  // ── Auto-End Timer & Polling Hook
  const [autoEndCountdown, setAutoEndCountdown] = useState<string | null>(null);
  const [isNearAutoEnd, setIsNearAutoEnd] = useState(false);
  const [showAutoEndModal, setShowAutoEndModal] = useState(false);
  const autoEndingRef = useRef(false);

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
          `/api/v1/live-classes/${classId}`,
          `http://${host}:3000/api/v1/live-classes/${classId}`,
          `/v1/live-classes/${classId}`,
          `http://${host}:3000/v1/live-classes/${classId}`,
        ];

        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              const data = json?.data ?? json; // unwrap {success, data: {...}} wrapper
              if (data.status === 'ENDED' || data.status === 'CANCELLED') {
                autoEndingRef.current = true;
                toast.info('⏱ Live class has been ended.');
                confirmEndClass();
                return;
              }

              const endVal = data?.scheduledEnd || scheduledEnd;
              const endMs = parseEndMs(endVal);
              if (endMs) {
                const cutoff = endMs + 15 * 60 * 1000;
                targetCutoffMsRef.current = cutoff;
                if (cutoff <= Date.now() && !autoEndingRef.current) {
                  autoEndingRef.current = true;
                  toast.warning('⏱ Scheduled end time + 15m grace period completed. Auto-ending class now!');
                  confirmEndClass();
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
    return () => clearInterval(interval);
  }, [classId, scheduledEnd, confirmEndClass]);

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
          toast.warning('⏱ Scheduled end time + 15m grace period completed. Auto-ending class now!');
          confirmEndClass();
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
  }, [confirmEndClass]);

  const handleExtendClass = async () => {
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const endpoints = [
        `/api/v1/live-classes/${classId}/extend`,
        `http://${host}:3000/api/v1/live-classes/${classId}/extend`,
        `/v1/live-classes/${classId}/extend`,
        `http://${host}:3000/v1/live-classes/${classId}/extend`,
      ];

      let updatedEnd: string | null = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extendMinutes: 15 }),
          });
          if (res.ok) {
            const json = await res.json();
            const data = json?.data ?? json;
            if (data?.scheduledEnd) {
              updatedEnd = data.scheduledEnd;
              const endMs = parseEndMs(data.scheduledEnd);
              targetCutoffMsRef.current = endMs ? endMs + 15 * 60 * 1000 : Date.now() + 15 * 60 * 1000;
            }
            break;
          }
        } catch {}
      }

      if (!updatedEnd) {
        const currentCutoff = targetCutoffMsRef.current || Date.now();
        const base = currentCutoff > Date.now() ? currentCutoff : Date.now();
        targetCutoffMsRef.current = base + 15 * 60 * 1000;
      }

      try {
        const statusBc = new BroadcastChannel('neet-live-class-status');
        statusBc.postMessage({ type: 'class-extended', classId, scheduledEnd: updatedEnd });
        statusBc.close();
      } catch {}

      setShowAutoEndModal(false);
      autoEndingRef.current = false;
      toast.success('⏱ Class Duration Extended by +15 Mins! 🚀');
    } catch {
      toast.error('Failed to extend class duration');
    }
  };

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

  // ── Admitted local state tracking for immediate UI render
  const [admittedStudents, setAdmittedStudents] = useState<Array<{ id: string; name: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`tutor_admitted_students_${classId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const combinedStudentList = React.useMemo(() => {
    const list: Array<{ id: string; name: string; admissionNumber?: string }> = [];

    remoteParticipants.forEach((p) => {
      if (p.name) {
        list.push({ id: p.sid, name: p.name });
      }
    });

    admittedStudents.forEach((aS) => {
      if (!list.some((item) => item.name.toLowerCase() === aS.name.toLowerCase())) {
        list.push({ id: aS.id, name: aS.name });
      }
    });

    dbParticipants.forEach((dbP) => {
      if (!list.some((item) => item.name.toLowerCase() === dbP.name.toLowerCase())) {
        list.push({ id: dbP.id, name: dbP.name, admissionNumber: dbP.admissionNumber });
      }
    });

    return list;
  }, [remoteParticipants, dbParticipants, admittedStudents]);

  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const activeScreenTrack = screenTracks.find(
    (t) => t.publication || (t as any).track || t.source === Track.Source.ScreenShare
  );

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`tutor_class_${classId}_mode`);
      if (saved) return saved as Mode;
    }
    return 'idle';
  });
  const [studentCams, setStudentCams] = useState<Record<string, { name: string; frame: string }>>({});
  const [studentMics, setStudentMics] = useState<Record<string, { name: string; isMicOn: boolean }>>({});

  // ── PDF State
  const [pdfPage, setPdfPage] = useState(1);
  const totalPdfPages = 12;

  // ── Local Media Stream (Webcam / Mic / Screen Share)
  const [isMicOn, setIsMicOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`tutor_class_${classId}_mic`) === 'true';
    }
    return false;
  });
  const [isCamOn, setIsCamOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`tutor_class_${classId}_cam`) === 'true';
    }
    return false;
  });
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`tutor_class_${classId}_screen`) === 'true';
    }
    return false;
  });

  const modeRef = useRef(mode);
  const isScreenSharingRef = useRef(isScreenSharing);
  const isMicOnRef = useRef(isMicOn);

  useEffect(() => {
    modeRef.current = mode;
    isScreenSharingRef.current = isScreenSharing;
    isMicOnRef.current = isMicOn;
  }, [mode, isScreenSharing, isMicOn]);

  const [screenFrame, setScreenFrame] = useState<string | null>(null);
  const [tutorCamFrame, setTutorCamFrame] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // ── UI States
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pinnedParticipant, setPinnedParticipant] = useState<{ id: string; name: string; isHost: boolean } | null>(null);
  const [raisedHands, setRaisedHands] = useState<Array<{ id: string; name: string; time: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ id: string; name: string; time: string }>>([]);
  // Active speaking states for audio visualizer ripples & popups
  const [speakingUser, setSpeakingUser] = useState<string | null>(null);
  const [isSelfSpeaking, setIsSelfSpeaking] = useState(false);

  // ── Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Live Studio Room Connected.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // ── DataChannel Handler for Real-Time Synchronization
  const { send } = useDataChannel((msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'chat') {
        setChatMessages((prev) => [...prev, { sender: data.sender, text: data.text, time: data.time }]);
      } else if (data.type === 'raise-hand') {
        setRaisedHands((prev) => {
          if (prev.some((h) => h.id === data.id)) return prev;
          return [...prev, { id: data.id, name: data.name, time: data.time }];
        });
      } else if (data.type === 'lower-hand') {
        setRaisedHands((prev) => prev.filter((h) => h.id !== data.id));
      } else if (data.type === 'student-mic') {
        setStudentMics((prev) => ({
          ...prev,
          [data.id]: { name: data.name, isMicOn: data.isMicOn },
        }));
      }
    } catch {}
  });

  const safeSend = useCallback((payload: any) => {
    if (connectionState !== ConnectionState.Connected) return;
    try {
      const encoder = new TextEncoder();
      const promise = send(encoder.encode(JSON.stringify(payload)), { reliable: true });
      if (promise && typeof (promise as any).catch === 'function') {
        (promise as any).catch(() => {});
      }
    } catch {}
  }, [connectionState, send]);

  useEffect(() => {
    safeSendRef.current = safeSend;
  }, [safeSend]);

  const camBroadcastRef = useRef<BroadcastChannel | null>(null);
  const camFrameIntervalRef = useRef<any>(null);
  const [studentScreen, setStudentScreen] = useState<{ name: string; frame: string } | null>(null);

  const admitStudent = (studentId: string, studentName?: string) => {
    const nameToAdmit = studentName || 'Student';
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
    setAdmittedStudents((prev) => {
      let updated = prev;
      if (!prev.some((s) => s.id === studentId || s.name === nameToAdmit)) {
        updated = [...prev, { id: studentId, name: nameToAdmit }];
      }
      try {
        localStorage.setItem(`tutor_admitted_students_${classId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      // localStorage signal for cross-tab sync
      localStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
      localStorage.setItem(`class_${classId}_approved_global`, 'true');
      // BroadcastChannel for same-browser instant notify
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-approved', studentId, classId });
      ch.close();
      toast.success(`✅ ${nameToAdmit} admitted to class`);
    } catch {}
  };

  const admitAllStudents = (pendingList: Array<{ id: string; name: string; time: string }>) => {
    setPendingRequests([]);
    setAdmittedStudents((prev) => {
      const next = [...prev];
      pendingList.forEach((item) => {
        if (!next.some((s) => s.id === item.id || s.name === item.name)) {
          next.push({ id: item.id, name: item.name });
        }
      });
      try {
        localStorage.setItem(`tutor_admitted_students_${classId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      localStorage.setItem(`class_${classId}_approved_global`, 'true');
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-approved', studentId: 'all', classId });
      ch.close();
      toast.success(`✅ All ${pendingList.length} students admitted`);
    } catch {}
  };

  const denyStudent = (studentId: string, studentName?: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
    try {
      // localStorage signal for cross-tab sync
      localStorage.setItem(`class_${classId}_denied_${studentId}`, 'true');
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-denied', studentId, classId });
      ch.close();
      toast.error(`🚫 ${studentName || 'Student'} denied entry`);
    } catch {}
  };

  const denyAllStudents = (pendingList: Array<{ id: string; name: string; time: string }>) => {
    setPendingRequests([]);
    try {
      pendingList.forEach((s) => localStorage.setItem(`class_${classId}_denied_${s.id}`, 'true'));
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-denied', studentId: 'all', classId });
      ch.close();
      toast.error(`🚫 All ${pendingList.length} students denied entry`);
    } catch {}
  };

  useEffect(() => {
    camBroadcastRef.current = new BroadcastChannel('neet-live-tutor-cam');
    const raiseHandChannel = new BroadcastChannel('neet-live-raise-hand');
    const studentCamChannel = new BroadcastChannel('neet-live-student-cam');
    const studentScreenChannel = new BroadcastChannel('neet-live-student-screen');
    const joinRequestChannel = new BroadcastChannel('neet-live-join-requests');
    const modeSyncChannel = new BroadcastChannel('neet-live-mode-sync');

    modeSyncChannel.onmessage = (e) => {
      if (e.data.type === 'request-sync') {
        try {
          modeSyncChannel.postMessage({ type: 'current-mode', mode: isScreenSharingRef.current ? 'screen' : modeRef.current, classId });
          if (isScreenSharingRef.current && screenFrameRef.current) {
            broadcastRef.current?.postMessage({ type: 'frame', frame: screenFrameRef.current });
          }
          if (tutorCamFrameRef.current) {
            camBroadcastRef.current?.postMessage({ type: 'cam-frame', frame: tutorCamFrameRef.current });
          }
          const micBc = new BroadcastChannel('neet-live-tutor-mic');
          micBc.postMessage({ type: 'tutor-mic-state', isMicOn: isMicOnRef.current });
          micBc.close();
        } catch {}
      }
    };

    joinRequestChannel.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'join-request' && (data.classId === classId || !data.classId)) {
        setPendingRequests((prev) => {
          if (prev.some((req) => req.id === data.id)) return prev;
          return [...prev, { id: data.id, name: data.name, time: data.time }];
        });
      }
    };

    studentScreenChannel.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'student-screen-frame') {
        setStudentScreen({ name: data.name, frame: data.frame });
        setMode('student-screen' as any); // Auto switch mode without prompt popup
      } else if (data.type === 'student-screen-stop') {
        setStudentScreen(null);
        setMode('idle');
      }
    };

    raiseHandChannel.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'raise-hand') {
        setRaisedHands((prev) => {
          if (prev.some((h) => h.id === data.id || h.name === data.name)) return prev;
          return [...prev, { id: data.id || 'student-1', name: data.name, time: data.time }];
        });
      } else if (data.type === 'lower-hand') {
        setRaisedHands((prev) => prev.filter((h) => h.id !== data.id && h.name !== data.name));
      }
    };

    studentCamChannel.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'student-cam') {
        setStudentCams((prev) => ({
          ...prev,
          [data.id]: { name: data.name, frame: data.frame },
        }));
      } else if (data.type === 'student-cam-off') {
        setStudentCams((prev) => {
          const next = { ...prev };
          delete next[data.id];
          return next;
        });
      }
    };

    const studentMicChannel = new BroadcastChannel('neet-live-student-mic');
    studentMicChannel.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'student-mic') {
        setStudentMics((prev) => ({
          ...prev,
          [data.id]: { name: data.name, isMicOn: data.isMicOn },
        }));
      }
    };

    return () => {
      camBroadcastRef.current?.close();
      raiseHandChannel.close();
      studentCamChannel.close();
      studentMicChannel.close();
      studentScreenChannel.close();
      joinRequestChannel.close();
      modeSyncChannel.close();
    };
  }, [classId]);

  // ── Session State Persistence across Refreshes
  useEffect(() => {
    try {
      sessionStorage.setItem(`tutor_class_${classId}_mode`, mode);
      sessionStorage.setItem(`tutor_class_${classId}_mic`, String(isMicOn));
      sessionStorage.setItem(`tutor_class_${classId}_cam`, String(isCamOn));
      sessionStorage.setItem(`tutor_class_${classId}_screen`, String(isScreenSharing));
    } catch {}

    try {
      const modeBc = new BroadcastChannel('neet-live-mode-sync');
      modeBc.postMessage({ type: 'current-mode', mode, classId });
      modeBc.close();
    } catch {}
  }, [mode, isMicOn, isCamOn, isScreenSharing, classId]);

  // ── Local Webcam & Mic Setup & Frame Broadcast
  useEffect(() => {
    let stream: MediaStream | null = null;
    const setupMedia = async () => {
      if (camFrameIntervalRef.current) {
        clearInterval(camFrameIntervalRef.current);
        camFrameIntervalRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (!isCamOn && !isMicOn) {
        camBroadcastRef.current?.postMessage({ type: 'cam-off' });
        setTutorCamFrame(null);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: isCamOn ? { width: 480, height: 360 } : false,
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
          hiddenVideo.play().catch(() => {});

          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');

          camFrameIntervalRef.current = setInterval(() => {
            if (ctx && hiddenVideo.readyState >= 2) {
              ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
              const frame = canvas.toDataURL('image/jpeg', 0.6);
              setTutorCamFrame(frame);
              try {
                camBroadcastRef.current?.postMessage({ type: 'cam-frame', frame });
              } catch {}
            }
          }, 66); // ~15 FPS
        } else {
          try {
            camBroadcastRef.current?.postMessage({ type: 'cam-off' });
          } catch {}
          setTutorCamFrame(null);
        }
      } catch (err) {
        console.warn('Webcam/Mic access:', err);
      }
    };

    setupMedia();

    return () => {
      if (camFrameIntervalRef.current) clearInterval(camFrameIntervalRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isCamOn, isMicOn]);

  // ── Broadcast Mode Change to Students
  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'screen' && !isScreenSharing) {
      startScreenShare();
    }
    safeSend({ type: 'mode-change', mode: newMode, pdfPage });
  };

  const changePdfPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPdfPages) return;
    setPdfPage(newPage);
    safeSend({ type: 'pdf-page', page: newPage });
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
            setSpeakingUser(tutorName);
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
  }, [isMicOn, tutorName]);
  const toggleMic = async () => {
    const next = !isMicOn;
    setIsMicOn(next);
    safeSend({ type: 'tutor-mic-state', isMicOn: next });
    try {
      const bc = new BroadcastChannel('neet-live-tutor-mic');
      bc.postMessage({ type: 'tutor-mic-state', isMicOn: next });
      bc.close();
    } catch {}
    try {
      await localParticipant.setMicrophoneEnabled(next, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    } catch {}
  };

  const toggleCam = async () => {
    const next = !isCamOn;
    setIsCamOn(next);
    try {
      await localParticipant.setCameraEnabled(next);
    } catch {}
  };

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const frameIntervalRef = useRef<any>(null);
  const screenFrameRef = useRef<string | null>(null);
  const tutorCamFrameRef = useRef<string | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('neet-live-screen');
    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  // ── Screen Share Toggle via MediaStream & Frame Broadcast
  const startScreenShare = async () => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 60 },
          width: { max: 1920 },
          height: { max: 1080 },
        },
        audio: false,
      });

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setMode('screen');
      safeSend({ type: 'mode-change', mode: 'screen', pdfPage });

      const hiddenVideo = document.createElement('video');
      hiddenVideo.srcObject = stream;
      hiddenVideo.muted = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.play().catch(() => {});

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });

      frameIntervalRef.current = setInterval(() => {
        if (ctx && hiddenVideo.readyState >= 2) {
          const w = hiddenVideo.videoWidth || 1280;
          const h = hiddenVideo.videoHeight || 720;
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;

          ctx.drawImage(hiddenVideo, 0, 0, w, h);
          const frame = canvas.toDataURL('image/jpeg', 0.55); // Optimized quality for ultra-fast ms transfer
          screenFrameRef.current = frame;
          try {
            broadcastRef.current?.postMessage({ type: 'frame', frame });
          } catch {}
        }
      }, 30); // ~33 FPS ultra-fast ms loop

      // Try LiveKit publish if WebRTC room is fully connected
      if (connectionState === ConnectionState.Connected) {
        try {
          const track = stream.getVideoTracks()[0];
          if (track) {
            localParticipant
              .publishTrack(track, { source: Track.Source.ScreenShare })
              .catch(() => {});
          }
        } catch {}
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share canceled/failed:', err);
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setScreenFrame(null);
    setMode('idle');
    broadcastRef.current?.postMessage({ type: 'stop' });
    safeSend({ type: 'mode-change', mode: 'idle', pdfPage });
  };

  // ── Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgObj = { type: 'chat', sender: 'Teacher (Host)', text: inputMsg, time };

    safeSend(msgObj);
    setChatMessages((prev) => [...prev, { sender: 'Teacher (Host)', text: inputMsg, time }]);
    setInputMsg('');
  };

  // ── End Class Modal State & Action
  const stopAllMediaTracks = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (camFrameIntervalRef.current) {
      clearInterval(camFrameIntervalRef.current);
      camFrameIntervalRef.current = null;
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
      broadcastRef.current?.postMessage({ type: 'stop' });
      camBroadcastRef.current?.postMessage({ type: 'cam-off' });
    } catch {}
  }, [localParticipant]);

  useEffect(() => {
    stopMediaTracksRef.current = stopAllMediaTracks;
    return () => {
      stopAllMediaTracks();
    };
  }, [stopAllMediaTracks]);

  const cameraTracks = useTracks([Track.Source.Camera]);

  const handleWhiteboardFrame = (frame: string) => {
    safeSend({ type: 'whiteboard-frame', frame });
    try {
      const wbChannel = new BroadcastChannel('neet-live-whiteboard');
      wbChannel.postMessage({ type: 'whiteboard-frame', frame });
      wbChannel.close();
    } catch {}
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-100 text-slate-900 flex flex-col overflow-hidden">
      {/* ── Top Header Bar ── */}
      <header className="h-12 sm:h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
        {/* Left: Brand + Live */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight">Connect Meet</h1>
          <span className="hidden sm:block text-xs text-slate-500 font-medium truncate max-w-[140px]">({classTitle})</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <Radio className="w-2.5 h-2.5" /> LIVE
          </div>
          {autoEndCountdown && (
            <div className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                  isNearAutoEnd
                    ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                    : 'bg-amber-500/10 text-amber-600 border-amber-300/50'
                }`}
                title="Class will automatically end 15 minutes after scheduled end time"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Auto-ends in {autoEndCountdown}</span>
              </div>
              <button
                onClick={handleExtendClass}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm cursor-pointer active:scale-95"
                title="Extend live class duration by +15 minutes"
              >
                <span>+15m Extend ⏱️</span>
              </button>
            </div>
          )}
        </div>

        {/* Centre: Mode switcher pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-[11px] sm:text-xs">
          <button onClick={() => changeMode('idle')} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition ${ mode === 'idle' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' }`}>
            <Grid className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Grid View</span>
          </button>
          <button onClick={() => changeMode('whiteboard')} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition ${ mode === 'whiteboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' }`}>
            <PenTool className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Whiteboard</span>
          </button>
        </div>

        {/* Right: Avatar + settings */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-100 border border-slate-200 cursor-pointer hover:bg-slate-200 transition">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm">
              {tutorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[80px] truncate">{tutorName}</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden relative p-2 sm:p-3 lg:p-4 gap-0 lg:gap-4 bg-slate-100">
        {/* Left Main Stage Container */}
        <div className="flex-1 h-full bg-[#bfd4e7] border border-blue-200/80 rounded-2xl p-2 sm:p-3 flex flex-col relative overflow-hidden shadow-inner min-w-0">


          {/* Grid View Mode */}
          {mode === 'idle' && (
            <>
              {pinnedParticipant ? (
                /* Focused Spotlight View */
                <div className="w-full h-full relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md flex items-center justify-center">
                  {pinnedParticipant.isHost ? (
                    isCamOn && tutorCamFrame ? (
                      <img src={tutorCamFrame} className="w-full h-full object-contain scale-x-[-1]" alt="Host Camera" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                        <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-3xl shadow-lg">
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-base font-bold text-slate-200">{tutorName} (You)</span>
                      </div>
                    )
                  ) : (
                    studentScreen ? (
                      <img src={studentScreen.frame} className="w-full h-full object-contain" alt={`${pinnedParticipant.name} Screen Share`} />
                    ) : studentCams[pinnedParticipant.id] ? (
                      <img src={studentCams[pinnedParticipant.id].frame} className="w-full h-full object-contain scale-x-[-1]" alt={pinnedParticipant.name} />
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
                    className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white p-2 rounded-xl backdrop-blur-md border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold shadow-lg z-20"
                    title="Exit Spotlight"
                  >
                    <Minimize2 className="w-4 h-4 text-blue-400" />
                    <span>Exit Grid View</span>
                  </button>
                </div>
              ) : (
                /* Standard Grid View */
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto pr-1 content-start">
                  {/* 1. Host (Teacher) Video Tile */}
                  <div className={`aspect-video bg-slate-900 border transition-all duration-300 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center group ${
                    isMicOn && isSelfSpeaking ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20' : 'border-slate-800/90'
                  }`}>
                    {isScreenSharing ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        ref={(el) => {
                          if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                            el.srcObject = screenStreamRef.current;
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    ) : isCamOn && tutorCamFrame ? (
                      <img src={tutorCamFrame} className="w-full h-full object-cover scale-x-[-1]" alt="Host Camera" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`w-14 h-14 rounded-full text-white flex items-center justify-center font-extrabold text-lg shadow-lg transition ${
                          isSelfSpeaking ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse' : 'bg-violet-600 border-2 border-violet-400/40'
                        }`}>
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-200">{tutorName} (You)</span>
                      </div>
                    )}

                    {/* Spotlight Pin Button */}
                    <button
                      onClick={() => setPinnedParticipant({ id: 'host', name: `${tutorName} (Host)`, isHost: true })}
                      className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md z-10"
                      title="Spotlight Full Screen"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>

                    {/* Top Right Mic & Cam Status Badges with Audio Waves */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <div className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1 ${isMicOn ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'}`}>
                        {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                        {isMicOn && isSelfSpeaking && (
                          <span className="flex gap-0.5 items-end h-3">
                            <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" />
                            <span className="w-0.5 h-3 bg-emerald-400 animate-bounce delay-75" />
                            <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce delay-150" />
                          </span>
                        )}
                      </div>
                      <div className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md ${isCamOn ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300' : 'bg-slate-800/80 border border-slate-700 text-slate-400'}`}>
                        {isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Bottom Left Participant Label Bar */}
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-100 truncate">{tutorName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                        Host
                      </span>
                    </div>
                  </div>

                  {/* 2. Student Video Tiles */}
                  {combinedStudentList.map((p, idx) => {
                    const studentCam =
                      studentCams[p.id] ||
                      Object.values(studentCams).find(
                        (c) => c.name.toLowerCase() === p.name.toLowerCase() || p.id.includes(c.name)
                      );

                    const studentMicData =
                      studentMics[p.id] ||
                      Object.values(studentMics).find(
                        (m) => m.name.toLowerCase() === p.name.toLowerCase() || p.id.includes(m.name)
                      );

                    const isStudentMicOn = studentMicData
                      ? studentMicData.isMicOn
                      : remoteParticipants.find((rp) => rp.sid === p.id || rp.name === p.name)?.isMicrophoneEnabled ?? false;

                    const isStudentCamOn = Boolean(
                      studentCam ||
                        remoteParticipants.find((rp) => rp.sid === p.id || rp.name === p.name)?.isCameraEnabled
                    );

                    const isHand = raisedHands.some((h) => h.name.toLowerCase() === p.name.toLowerCase());
                    const isSharingScreen = studentScreen && (studentScreen.name.toLowerCase() === p.name.toLowerCase() || p.name.includes(studentScreen.name));
                    
                    return (
                      <div key={p.id || idx} className={`aspect-video bg-slate-900 border rounded-2xl overflow-hidden relative shadow-xl flex flex-col items-center justify-center group hover:border-slate-700 transition ${isSharingScreen ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/30' : isStudentMicOn ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20' : 'border-slate-800/90'}`}>
                        {studentScreen ? (
                          <img src={studentScreen.frame} className="w-full h-full object-contain" alt={`${p.name} Screen Share`} />
                        ) : studentCam ? (
                          <img src={studentCam.frame} className="w-full h-full object-cover scale-x-[-1]" alt={p.name} />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`w-12 h-12 rounded-full text-slate-300 flex items-center justify-center font-extrabold text-sm border ${isStudentMicOn ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">{p.name}</span>
                          </div>
                        )}

                        {/* Spotlight Pin Button */}
                        <button
                          onClick={() => setPinnedParticipant({ id: p.id || `student-${idx}`, name: p.name, isHost: false })}
                          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md z-10"
                          title="Spotlight Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Top Right Badges: Mic & Video Signals */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                          {isHand && (
                            <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-lg animate-bounce" title="Hand Raised">
                              <Hand className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {studentScreen && (
                            <div className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-lg flex items-center gap-1">
                              <Monitor className="w-3.5 h-3.5 animate-pulse" />
                              <span className="text-[10px]">Sharing Screen</span>
                            </div>
                          )}
                          {/* MIC BADGE */}
                          <div
                            className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1 ${
                              isStudentMicOn
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20'
                                : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                            }`}
                            title={isStudentMicOn ? 'Student Mic ON' : 'Student Mic OFF'}
                          >
                            {isStudentMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                          </div>
                          {/* VIDEO BADGE */}
                          <div
                            className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md ${
                              isStudentCamOn
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                            }`}
                            title={isStudentCamOn ? 'Student Camera ON' : 'Student Camera OFF'}
                          >
                            {isStudentCamOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        </div>

                        {/* Bottom Label */}
                        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between z-10">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full ${isStudentMicOn || isStudentCamOn || studentScreen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="text-xs font-semibold text-slate-200 truncate">{p.name}</span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-bold font-mono">
                            {studentScreen ? 'Screen Sharing' : isStudentMicOn ? 'Mic Active' : p.admissionNumber || 'Student'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Mode 1: Whiteboard Canvas */}
          {mode === 'whiteboard' && (
            <div className="w-full h-full relative bg-slate-900">
              <StudioWhiteboard isTeacher={true} onFrameUpdate={handleWhiteboardFrame} />
            </div>
          )}

          {/* Mode 3: Screen Share */}
          {mode === 'screen' && (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-2 sm:p-4">
              {/* Top Banner Control Bar for Stop Screen Sharing */}
              {(isScreenSharing || screenFrame || screenStreamRef.current) && (
                <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Monitor className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-extrabold text-white tracking-wide">Screen Share Active</span>
                  </div>
                  <button
                    onClick={stopScreenShare}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Stop Screen Share 🛑</span>
                  </button>
                </div>
              )}

              {isScreenSharing && screenStreamRef.current ? (
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(el) => {
                    if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                      el.srcObject = screenStreamRef.current;
                    }
                  }}
                  className="w-full h-full object-contain rounded-xl border border-slate-800 shadow-2xl"
                />
              ) : screenFrame ? (
                <img
                  src={screenFrame}
                  className="w-full h-full object-contain rounded-xl border border-slate-800 shadow-2xl"
                  alt="Screen Share"
                />
              ) : screenTracks.length > 0 ? (
                <VideoTrack
                  trackRef={(activeScreenTrack || screenTracks[0]) as any}
                  className="w-full h-full object-contain rounded-xl border border-slate-800"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Monitor className="w-12 h-12 text-violet-500 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-300">Screen Sharing Ready</p>
                  <button
                    onClick={startScreenShare}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold"
                  >
                    Start Screen Share Now
                  </button>
                </div>
              )}
            </div>
          )}



          {/* Mode 5: Student Screen Share Presentation View */}
          {(mode as string) === 'student-screen' && studentScreen && (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-4">
              <img
                src={studentScreen.frame}
                className="w-full h-full object-contain rounded-xl border border-emerald-500/40 shadow-2xl"
                alt="Student Screen Share"
              />
              <div className="absolute top-6 left-6 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-400" /> Presenter: {studentScreen.name}
              </div>
              <button
                onClick={() => setMode('idle')}
                className="absolute bottom-6 right-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shadow-xl"
              >
                Return to Grid View
              </button>
            </div>
          )}

          {/* Floating Bottom Control Dock */}
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

              {/* Screen Share / Stop Sharing Button */}
              <button
                onClick={() => { if (isScreenSharing || mode === 'screen') stopScreenShare(); else startScreenShare(); }}
                title={isScreenSharing || mode === 'screen' ? 'Stop Screen Share' : 'Share Screen'}
                className={`px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0 ${
                  isScreenSharing || mode === 'screen'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>{isScreenSharing || mode === 'screen' ? 'Stop Sharing' : ''}</span>
              </button>

              {/* Whiteboard */}
              <button onClick={() => changeMode(mode === 'whiteboard' ? 'idle' : 'whiteboard')} title="Toggle Whiteboard"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 ${
                  mode === 'whiteboard' ? 'bg-blue-100 text-blue-600 border-blue-400' : 'bg-white text-slate-700 border-slate-300'
                }`}>
                <PenTool className="w-4 h-4" />
              </button>

              {/* Chat Drawer Toggle */}
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

              {/* Participants Drawer Toggle */}
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
              <button onClick={() => setShowEndModal(true)}
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
                className={`flex-1 py-3.5 text-center transition border-b-2 relative ${
                  activeTab === 'participants'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Participants ({combinedStudentList.length + 1})</span>
                {pendingRequests.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
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
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* ── Waiting Room Join Requests Section ── */}
                {pendingRequests.length > 0 && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-black text-amber-900">
                          Waiting Room ({pendingRequests.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => admitAllStudents(pendingRequests)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition shadow-2xs cursor-pointer"
                        >
                          Admit All
                        </button>
                        <button
                          onClick={() => denyAllStudents(pendingRequests)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 border border-transparent hover:border-rose-200 text-[11px] font-bold transition cursor-pointer"
                        >
                          Deny All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between bg-white border border-amber-200/80 p-2.5 rounded-xl shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-800 truncate">{req.name}</p>
                            <p className="text-[10px] font-medium text-slate-400">{req.time}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => admitStudent(req.id, req.name)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition cursor-pointer"
                            >
                              Admit
                            </button>
                            <button
                              onClick={() => denyStudent(req.id, req.name)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold transition cursor-pointer"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host Row */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {tutorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{tutorName} (You)</p>
                      <p className="text-[10px] text-blue-600 font-semibold">Host / Tutor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMicOn ? <Mic className="w-4 h-4 text-emerald-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                    {isCamOn ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Combined Student List */}
                {combinedStudentList.map((p, idx) => {
                  const sCam = studentCams[p.id] || Object.values(studentCams).find((c) => c.name.toLowerCase() === p.name.toLowerCase() || p.id.includes(c.name));
                  const sMic = studentMics[p.id] || Object.values(studentMics).find((m) => m.name.toLowerCase() === p.name.toLowerCase() || p.id.includes(m.name));
                  const isMicActive = sMic ? sMic.isMicOn : remoteParticipants.find((rp) => rp.sid === p.id || rp.name === p.name)?.isMicrophoneEnabled ?? false;
                  const isCamActive = Boolean(sCam || remoteParticipants.find((rp) => rp.sid === p.id || rp.name === p.name)?.isCameraEnabled);

                  return (
                    <div key={p.id || idx} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.admissionNumber ? `Roll: ${p.admissionNumber}` : 'Student'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMicActive ? <Mic className="w-4 h-4 text-emerald-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                        {isCamActive ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
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
                <form onSubmit={handleSendChat} className="flex gap-2 shrink-0 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm transition"
                  >
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
          <div onClick={() => setShowMobileDrawer(false)} className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="flex border-b border-slate-200 text-xs font-bold shrink-0 px-4">
              <button onClick={() => setActiveTab('participants')} className={`flex-1 py-3 text-center border-b-2 transition ${ activeTab === 'participants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500' }`}>
                <Users className="w-4 h-4 inline mr-1" />Participants
              </button>
              <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-center border-b-2 transition ${ activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500' }`}>
                <MessageSquare className="w-4 h-4 inline mr-1" />Chat
              </button>
              <button onClick={() => setShowMobileDrawer(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{tutorName.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{tutorName} (You)</p>
                        <p className="text-[10px] text-blue-600 font-semibold">Host / Tutor</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {isMicOn ? <Mic className="w-4 h-4 text-emerald-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                      {isCamOn ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {combinedStudentList.map((p, idx) => {
                    const sCam = studentCams[p.id] || Object.values(studentCams).find((c) => c.name.toLowerCase() === p.name.toLowerCase() || p.id.includes(c.name));
                    const sMic = studentMics[p.id] || Object.values(studentMics).find((m) => m.name.toLowerCase() === p.name.toLowerCase() || p.id.includes(m.name));
                    const isMicActive = sMic ? sMic.isMicOn : remoteParticipants.find((rp) => rp.sid === p.id || rp.name === p.name)?.isMicrophoneEnabled ?? false;
                    const isCamActive = Boolean(sCam || remoteParticipants.find((rp) => rp.sid === p.id || rp.name === p.name)?.isCameraEnabled);

                    return (
                      <div key={p.id || idx} className="flex items-center justify-between py-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold">{p.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.admissionNumber ? `Roll: ${p.admissionNumber}` : 'Student'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {isMicActive ? <Mic className="w-4 h-4 text-emerald-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                          {isCamActive ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
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
                    <input type="text" placeholder="Type a message..." value={inputMsg} onChange={(e) => setInputMsg(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500" />
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

      {/* ── Professional End Class Confirmation Modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">End Live Session?</h3>
                <p className="text-xs text-slate-500">Class ID: {classId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              Are you sure you want to end this live meeting for all participants?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={endingClass}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmEndClass}
                disabled={endingClass}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                {endingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
                Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auto-End Grace Period Expired Modal ── */}
      {showAutoEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shadow-lg animate-bounce">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                ⏱ Class Grace Time Expired!
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The scheduled class duration and the 15-minute grace period have finished. Would you like to extend this session by <span className="font-bold text-violet-600">+15 minutes</span> or end the class now?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <button
                onClick={handleExtendClass}
                className="w-full py-3.5 px-5 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Extend Class (+15m)</span>
              </button>
              <button
                onClick={() => {
                  setShowAutoEndModal(false);
                  autoEndingRef.current = true;
                  confirmEndClass();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 font-bold text-sm border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>End Class Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
