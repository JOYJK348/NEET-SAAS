'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
  useDataChannel,
  useConnectionState,
  useTracks,
  useRoomContext,
  TrackReference,
} from '@livekit/components-react';
import { ConnectionState, Track, RoomEvent } from 'livekit-client';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

import StudioWhiteboard from '@/components/live/studio-whiteboard';
import StudioPdfPresenter, {
  PdfDocumentInfo,
  SAMPLE_NEET_DOCUMENTS,
} from '@/components/live/studio-pdf-presenter';
import LivekitDebugPanel from '@/components/live/livekit-debug-panel';

type Mode = 'idle' | 'whiteboard' | 'screen' | 'pdf';

/** Safely capture display stream using runtime capability detection */
async function getScreenMediaStream(): Promise<{
  stream: MediaStream | null;
  error?: string;
  isUnsupported?: boolean;
  isCancelled?: boolean;
}> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getDisplayMedia !== 'function'
  ) {
    return {
      stream: null,
      isUnsupported: true,
      error: 'Screen sharing is not supported on this browser.',
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
      return {
        stream: null,
        isCancelled: true,
        error: 'Screen sharing permission was cancelled or dismissed.',
      };
    }
    if (name === 'NotFoundError') {
      return { stream: null, error: 'No display or screen source found.' };
    }
    if (name === 'NotReadableError') {
      return {
        stream: null,
        error:
          'Could not access screen. System permission or another application may be blocking capture.',
      };
    }

    return { stream: null, error: msg || 'Unable to start screen share.' };
  }
}

export default function StudentClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { user, hasHydrated } = useAuthStore();

  const studentId =
    user?.id ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('studentId') || 'student-1'
      : 'student-1');

  const [admissionState, setAdmissionState] = useState<'waiting' | 'admitted' | 'denied'>(
    'waiting',
  );

  useEffect(() => {
    try {
      localStorage.removeItem(`class_${classId}_approved`);
      localStorage.removeItem(`class_${classId}_approved_${studentId}`);
      localStorage.removeItem(`class_${classId}_approved_global`);
      sessionStorage.removeItem(`class_${classId}_approved`);
      sessionStorage.removeItem(`class_${classId}_approved_${studentId}`);
      sessionStorage.removeItem(`class_${classId}_approved_global`);
    } catch {}
  }, [classId, studentId]);

  const [liveKitConfig, setLiveKitConfig] = useState<{
    token: string;
    wsUrl: string;
    classTitle?: string;
    scheduledEnd?: string | Date;
  } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Top-Level Class Status Checker
  useEffect(() => {
    const checkStatusOnMount = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}`, { skipGlobalToast: true });
        const classObj = data?.data ?? data;
        if (classObj?.status === 'CANCELLED') {
          toast.error('This class has been cancelled.');
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/student';
          }
        }
      } catch {}
    };
    checkStatusOnMount();
  }, [classId]);

  // Step 1: Waiting Room — Register request and poll admission status
  useEffect(() => {
    if (admissionState !== 'waiting') return;

    const studentName = user
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : localStorage.getItem('user_display_name') || 'Student';

    // Register join request via API
    api
      .post(
        `/live-classes/${classId}/join-request`,
        { studentId, studentName },
        { skipGlobalToast: true },
      )
      .catch(() => {});

    // Poll approval status every 1.5s
    const pollStatus = async () => {
      try {
        const res = await api.get<{ approved?: boolean; denied?: boolean }>(
          `/live-classes/${classId}/join-status?studentId=${encodeURIComponent(studentId)}`,
          { skipGlobalToast: true },
        );
        if (res?.approved) {
          try {
            sessionStorage.setItem(`class_${classId}_approved_${studentId}`, 'true');
          } catch {}
          setAdmissionState('admitted');
        } else if (res?.denied) {
          setAdmissionState('denied');
        }
      } catch {}
    };

    pollStatus();
    const pollInterval = setInterval(pollStatus, 1500);

    return () => {
      clearInterval(pollInterval);
    };
  }, [admissionState, classId, studentId, user]);

  // Step 2: Once admitted, fetch real LiveKit token for the class room
  useEffect(() => {
    if (admissionState !== 'admitted') return;
    if (!hasHydrated) return;

    let isMounted = true;

    const fetchToken = async () => {
      setTokenLoading(true);
      setTokenError(false);
      try {
        const nameFromUser = user ? `${user.firstName} ${user.lastName || ''}`.trim() : '';
        const studentName = nameFromUser || localStorage.getItem('user_display_name') || 'Student';
        const encodedName = encodeURIComponent(studentName);

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

        if (isMounted) {
          setTokenError(true);
        }
      } catch (err) {
        console.error('[LiveKit Student] Failed to fetch join token:', err);
        if (isMounted) {
          setTokenError(true);
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

  if (admissionState === 'waiting') {
    return (
      <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
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

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-5 text-center max-w-xs w-full">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-xl">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white">Waiting for Admission</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your request has been sent to the tutor. Please wait while the tutor admits you into
                the live class.
              </p>
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

  if (admissionState === 'denied') {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-3xl">
            🚫
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider">
              ADMISSION DECLINED
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Teacher Declined Entry
            </h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              The tutor has declined your admission request at this time. You may try again or
              return to the dashboard.
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
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tokenLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
        <header className="h-12 sm:h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-sm sm:text-lg font-extrabold text-white tracking-tight">
              Connect Meet
            </h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </div>
          </div>
        </header>
        <div className="flex-1 bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-semibold tracking-wide">
              Connecting LiveKit session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (tokenError || !liveKitConfig?.token) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-100">
        <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-3xl p-8 max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Class Not Started Yet</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              You have been admitted, but the room session could not be established. Please retry.
            </p>
          </div>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
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
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
          stopMicTrackOnMute: true,
        },
      }}
      data-lk-theme="default"
      className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden font-sans select-none"
      onConnected={() => {
        console.log('[LiveKit Student] Connected to room:', classId);
      }}
      onDisconnected={(reason) => {
        console.log('[LiveKit Student] Disconnected from room:', reason);
      }}
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
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const connectionState = useConnectionState();

  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [dbParticipants, setDbParticipants] = useState<
    Array<{ id: string; name: string; role?: string; admissionNumber?: string }>
  >([]);

  // ── Audio Autoplay Policy Recovery
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    if (!room) return;
    const updateAudioStatus = () => {
      setAudioBlocked(!room.canPlaybackAudio);
    };
    updateAudioStatus();
    room.on(RoomEvent.AudioPlaybackStatusChanged, updateAudioStatus);
    return () => {
      room.off(RoomEvent.AudioPlaybackStatusChanged, updateAudioStatus);
    };
  }, [room]);

  const handleUnlockAudio = async () => {
    try {
      if (room) {
        await room.startAudio();
        setAudioBlocked(false);
        toast.success('Audio playback unlocked!');
      }
    } catch (e) {
      console.error('[LiveKit Student] Failed to unlock audio:', e);
    }
  };

  // ── Observability & Structured WebRTC Logging
  useEffect(() => {
    if (!room) return;

    const onTrackSubscribed = (track: any, pub: any, participant: any) => {
      console.log(
        `[LiveKit Student] TrackSubscribed: kind=${track.kind} source=${pub.source} from participant=${participant.identity} (${participant.name || 'Unknown'})`,
      );
    };
    const onTrackUnsubscribed = (track: any, pub: any, participant: any) => {
      console.log(
        `[LiveKit Student] TrackUnsubscribed: kind=${track.kind} source=${pub.source} from participant=${participant.identity}`,
      );
    };
    const onLocalTrackPublished = (pub: any) => {
      console.log(
        `[LiveKit Student] LocalTrackPublished: kind=${pub.kind} source=${pub.source} trackSid=${pub.trackSid}`,
      );
    };
    const onReconnecting = () => {
      console.log('[LiveKit Student] Reconnecting to live room...');
      toast.warning('Reconnecting...');
    };
    const onReconnected = () => {
      console.log('[LiveKit Student] Successfully reconnected to live room!');
      toast.success('Reconnected to live room!');
    };

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);

    return () => {
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [room]);

  useEffect(() => {
    const fetchDbParticipants = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}/participants`, {
          skipGlobalToast: true,
        });
        if (Array.isArray(data) && data.length > 0) {
          setDbParticipants(data);
        }
      } catch {}
    };

    fetchDbParticipants();
    const interval = setInterval(fetchDbParticipants, 15000);
    return () => clearInterval(interval);
  }, [classId]);

  const studentSelfName = user
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (typeof window !== 'undefined' && localStorage.getItem('user_display_name')) || 'Student';

  const combinedStudentList = React.useMemo(() => {
    const list: Array<{ id: string; name: string; admissionNumber?: string; isSelf?: boolean }> =
      [];

    list.push({ id: 'self-student', name: studentSelfName, isSelf: true });

    remoteParticipants.forEach((p) => {
      const isTeacher =
        p.identity.startsWith('host-') ||
        p.name?.toLowerCase().includes('teacher') ||
        p.name?.toLowerCase().includes('host');
      if (
        !isTeacher &&
        p.name &&
        !list.some((item) => item.name.toLowerCase() === p.name!.toLowerCase())
      ) {
        list.push({ id: p.sid, name: p.name });
      }
    });

    dbParticipants.forEach((dbP) => {
      if (!list.some((item) => item.name.toLowerCase() === dbP.name.toLowerCase())) {
        list.push({ id: dbP.id, name: dbP.name, admissionNumber: dbP.admissionNumber });
      }
    });

    return list;
  }, [remoteParticipants, dbParticipants, studentSelfName]);

  // ── Authoritative LiveKit Track Collections
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const tutorRP =
    remoteParticipants.find(
      (p) =>
        p.identity.startsWith('host-') ||
        p.identity.startsWith('tutor-') ||
        p.name?.toLowerCase().includes('teacher') ||
        p.name?.toLowerCase().includes('host') ||
        p.name?.toLowerCase().includes('tutor'),
    ) || remoteParticipants[0];

  const tutorCameraTrack =
    cameraTracks.find(
      (t) =>
        !t.participant.isLocal &&
        (t.participant.identity.startsWith('host-') ||
          t.participant.identity.startsWith('tutor-') ||
          t.participant.name?.toLowerCase().includes('teacher') ||
          t.participant.name?.toLowerCase().includes('host') ||
          t.participant.name?.toLowerCase().includes('tutor') ||
          t.participant.sid === tutorRP?.sid),
    ) || cameraTracks.find((t) => !t.participant.isLocal);
  const activeScreenTrack = screenTracks[0];
  const selfCameraTrack = cameraTracks.find((t) => t.participant.isLocal);

  const [teacherMode, setTeacherMode] = useState<Mode>('idle');
  const [teacherPdfDoc, setTeacherPdfDoc] = useState<PdfDocumentInfo | null>(null);
  const [teacherPdfPage, setTeacherPdfPage] = useState(1);
  const [remoteWhiteboardFrame, setRemoteWhiteboardFrame] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pinnedParticipant, setPinnedParticipant] = useState<{
    id: string;
    name: string;
    isTeacher: boolean;
  } | null>(null);

  // ── Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: 'System',
      text: 'Connected to Live Class Studio.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // ── DataChannel Handler for Real-Time Synchronization
  const { send: studentDataSend } = useDataChannel((msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'mode-change' || data.type === 'mode-sync') {
        if (data.mode) setTeacherMode(data.mode);
        if (data.pdfPage) setTeacherPdfPage(data.pdfPage);
        if (data.doc) setTeacherPdfDoc(data.doc);
        if (data.whiteboardFrame) setRemoteWhiteboardFrame(data.whiteboardFrame);
      } else if (data.type === 'pdf-page-change') {
        if (data.page) setTeacherPdfPage(data.page);
        if (data.doc) setTeacherPdfDoc(data.doc);
      } else if (data.type === 'pdf-doc-change') {
        if (data.doc) setTeacherPdfDoc(data.doc);
        if (data.page) setTeacherPdfPage(data.page);
      } else if (data.type === 'whiteboard-frame') {
        setRemoteWhiteboardFrame(data.frame);
      } else if (data.type === 'chat') {
        setChatMessages((prev) => [
          ...prev,
          { sender: data.sender, text: data.text, time: data.time },
        ]);
      } else if (data.type === 'class-ended') {
        toast.info('The tutor ended the live session.');
        router.push('/dashboard/student');
      }
    } catch {}
  });

  const safeSend = useCallback(
    (payload: any) => {
      if (connectionState !== ConnectionState.Connected) return;
      try {
        const encoder = new TextEncoder();
        const promise = studentDataSend(encoder.encode(JSON.stringify(payload)), {
          reliable: true,
        });
        if (promise && typeof (promise as any).catch === 'function') {
          (promise as any).catch(() => {});
        }
      } catch {}
    },
    [connectionState, studentDataSend],
  );

  // ── Native LiveKit Track Toggles (Microphone, Camera, Screen Share)
  const toggleMic = async () => {
    try {
      const next = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(next, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      console.log('[LiveKit Student] Microphone toggled:', next);
    } catch (err: any) {
      console.error('[LiveKit Student] Mic error:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const toggleCam = async () => {
    try {
      const next = !isCameraEnabled;
      await localParticipant.setCameraEnabled(next, {
        resolution: { width: 640, height: 360, frameRate: 24 },
        facingMode: 'user',
      });
      console.log('[LiveKit Student] Camera toggled:', next);
    } catch (err: any) {
      console.error('[LiveKit Student] Cam error:', err);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const toggleScreenShare = async () => {
    try {
      const next = !isScreenShareEnabled;
      if (next) {
        const res = await getScreenMediaStream();
        if (!res.stream) {
          if (res.isCancelled) toast.info('Screen share was cancelled.');
          else toast.error(res.error || 'Screen capture not supported.');
          return;
        }
        res.stream.getTracks().forEach((t) => t.stop());
        await localParticipant.setScreenShareEnabled(true, { audio: false });
        console.log('[LiveKit Student] Screen share started');
        toast.success('📱 Screen Sharing Active!');
      } else {
        await localParticipant.setScreenShareEnabled(false);
        console.log('[LiveKit Student] Screen share stopped');
      }
    } catch (err) {
      console.warn('[LiveKit Student] Screen share error:', err);
    }
  };

  const toggleRaiseHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      type: next ? 'raise-hand' : 'lower-hand',
      id: localParticipant.sid || 'student-1',
      name: studentSelfName,
      time,
    };
    safeSend(payload);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgObj = { type: 'chat', sender: studentSelfName, text: inputMsg, time };

    safeSend(msgObj);
    setChatMessages((prev) => [...prev, msgObj]);
    setInputMsg('');
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ── Audio Autoplay Unlock Floating Pill ── */}
      {audioBlocked && (
        <button
          onClick={handleUnlockAudio}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer border-2 border-white"
        >
          <Volume2 className="w-4 h-4" />
          <span>Tap to Enable Audio 🔊</span>
        </button>
      )}

      {/* ── Top Header Bar ── */}
      <header className="h-12 sm:h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 shadow-md gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-extrabold text-white tracking-tight">Connect Meet</h1>
          <span className="hidden sm:block text-xs text-slate-400 font-medium truncate max-w-[160px]">
            ({classTitle})
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider animate-pulse shrink-0">
            <Radio className="w-2.5 h-2.5" /> LIVE
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleRaiseHand}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 shadow-md animate-bounce'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{isHandRaised ? 'Hand Raised ✋' : 'Raise Hand'}</span>
          </button>
          <div className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-800 border border-slate-700">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {studentSelfName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[80px] truncate">
              {studentSelfName}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Stage ── */}
      <div className="flex-1 flex overflow-hidden relative p-2 sm:p-3 lg:p-4 gap-0 lg:gap-4 bg-slate-950">
        <div className="flex-1 h-full bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 flex flex-col relative overflow-hidden shadow-inner min-w-0">
          {/* Main Content Area */}
          <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-0">
            {/* Spotlight Mode */}
            {pinnedParticipant ? (
              <div className="w-full h-full relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                {pinnedParticipant.isTeacher ? (
                  tutorCameraTrack &&
                  tutorCameraTrack.publication?.track &&
                  !tutorCameraTrack.publication.isMuted ? (
                    <VideoTrack
                      trackRef={tutorCameraTrack}
                      className="w-full h-full object-contain scale-x-[-1]"
                    />
                  ) : activeScreenTrack && activeScreenTrack.publication?.track ? (
                    <VideoTrack
                      trackRef={activeScreenTrack}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                      <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-3xl shadow-lg">
                        T
                      </div>
                      <span className="text-base font-bold text-slate-200">Teacher (Host)</span>
                    </div>
                  )
                ) : (() => {
                  const studentTrack = cameraTracks.find(
                    (t) =>
                      t.participant.sid === pinnedParticipant.id &&
                      t.publication?.track &&
                      !t.publication.isMuted,
                  );
                  if (studentTrack) {
                    return (
                      <VideoTrack
                        trackRef={studentTrack}
                        className="w-full h-full object-contain scale-x-[-1]"
                      />
                    );
                  }
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                      <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-3xl shadow-lg">
                        {pinnedParticipant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-base font-bold text-slate-200">
                        {pinnedParticipant.name}
                      </span>
                    </div>
                  );
                })()}

                <button
                  onClick={() => setPinnedParticipant(null)}
                  className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white p-2 rounded-xl backdrop-blur-md border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold shadow-lg z-20 cursor-pointer"
                  title="Exit Spotlight"
                >
                  <Minimize2 className="w-4 h-4 text-blue-400" />
                  <span>Exit Grid View</span>
                </button>
              </div>
            ) : teacherMode === 'idle' ? (
              /* Multi-Party Video Grid */
              <div className="w-full h-full p-1.5 sm:p-2.5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto content-start">
                {/* 1. Host Teacher Tile */}
                <div
                  className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all duration-300 shadow-sm flex items-center justify-center aspect-video group ${
                    (tutorRP?.isSpeaking || tutorCameraTrack?.participant?.isSpeaking)
                      ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  {tutorCameraTrack &&
                  tutorCameraTrack.publication?.track &&
                  !tutorCameraTrack.publication.isMuted ? (
                    <VideoTrack
                      trackRef={tutorCameraTrack}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : activeScreenTrack && activeScreenTrack.publication?.track ? (
                    <VideoTrack
                      trackRef={activeScreenTrack}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-900 text-slate-400">
                      <div
                        className={`w-12 h-12 rounded-full text-blue-400 font-extrabold flex items-center justify-center text-base transition ${
                          (tutorRP?.isSpeaking || tutorCameraTrack?.participant?.isSpeaking)
                            ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse'
                            : 'bg-blue-600/20 border border-blue-500/40'
                        }`}
                      >
                        T
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Teacher (Host)</span>
                    </div>
                  )}

                  {/* Spotlight Pin Button */}
                  <button
                    onClick={() =>
                      setPinnedParticipant({
                        id: 'teacher',
                        name: 'Teacher (Host)',
                        isTeacher: true,
                      })
                    }
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md cursor-pointer z-10"
                    title="Spotlight Full Screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  </button>

                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
                    Teacher (Host)
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-md text-white">
                    {(tutorRP?.isMicrophoneEnabled ?? tutorCameraTrack?.participant?.isMicrophoneEnabled) ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {tutorCameraTrack &&
                    tutorCameraTrack.publication?.track &&
                    !tutorCameraTrack.publication.isMuted ? (
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* 2. Combined Students Tiles */}
                {combinedStudentList.map((st, idx) => {
                  const isSelf = st.isSelf;
                  const rp = !isSelf
                    ? remoteParticipants.find(
                        (r) => r.sid === st.id || r.name?.toLowerCase() === st.name.toLowerCase(),
                      )
                    : localParticipant;

                  const studentTrack = cameraTracks.find(
                    (t) =>
                      t.participant.sid === rp?.sid &&
                      t.publication?.track &&
                      !t.publication.isMuted,
                  );
                  const isSpeaking = rp?.isSpeaking ?? false;

                  return (
                    <div
                      key={st.id || idx}
                      className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all duration-300 shadow-sm flex items-center justify-center aspect-video group ${
                        isSpeaking
                          ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20'
                          : 'border-slate-800'
                      }`}
                    >
                      {isSelf ? (
                        isCameraEnabled &&
                        selfCameraTrack &&
                        selfCameraTrack.publication?.track &&
                        !selfCameraTrack.publication.isMuted ? (
                          <VideoTrack
                            trackRef={selfCameraTrack}
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-400">
                            <div
                              className={`w-12 h-12 rounded-full text-blue-400 font-extrabold flex items-center justify-center text-base transition ${
                                localParticipant.isSpeaking
                                  ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse'
                                  : 'bg-blue-600/20 border border-blue-500/40'
                              }`}
                            >
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-300">
                              {st.name} (You)
                            </span>
                          </div>
                        )
                      ) : studentTrack ? (
                        <VideoTrack
                          trackRef={studentTrack}
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-400">
                          <div className="w-12 h-12 rounded-full text-blue-400 font-extrabold flex items-center justify-center text-base bg-blue-600/20 border border-blue-500/40">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-300 truncate max-w-[130px]">
                            {st.name}
                          </span>
                        </div>
                      )}

                      {/* Spotlight Pin Button */}
                      <button
                        onClick={() =>
                          setPinnedParticipant({
                            id: st.id || `student-${idx}`,
                            name: st.name,
                            isTeacher: false,
                          })
                        }
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md cursor-pointer z-10"
                        title="Spotlight Full Screen"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm truncate max-w-[80%]">
                        {st.name} {isSelf ? '(You)' : ''}
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-md text-white">
                        {rp?.isMicrophoneEnabled ? (
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <MicOff className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        {studentTrack || (isSelf && isCameraEnabled) ? (
                          <Video className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <VideoOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : teacherMode === 'whiteboard' ? (
              /* Whiteboard Presentation Mode */
              <div className="w-full h-full relative bg-slate-900">
                <StudioWhiteboard isTeacher={false} remoteFrame={remoteWhiteboardFrame} />
              </div>
            ) : teacherMode === 'pdf' ? (
              /* PDF Presentation Mode */
              <div className="w-full h-full relative bg-slate-950">
                <StudioPdfPresenter
                  isTeacher={false}
                  activeDoc={teacherPdfDoc}
                  currentPage={teacherPdfPage}
                />
              </div>
            ) : teacherMode === 'screen' ? (
              /* Screen Share Mode */
              <div className="w-full h-full relative flex items-center justify-center bg-black group overflow-hidden">
                {activeScreenTrack && activeScreenTrack.publication?.track ? (
                  <VideoTrack
                    trackRef={activeScreenTrack}
                    className="w-full h-full object-contain max-h-[85vh]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Monitor className="w-12 h-12 text-blue-500 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-200">
                      Teacher Screen Share Active
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Floating Bottom Control Dock Bar */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center shrink-0 px-1">
            <div className="bg-white/95 border border-slate-200 backdrop-blur-md px-3 sm:px-6 py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-3 max-w-full overflow-x-auto">
              {/* Mic */}
              <button
                onClick={toggleMic}
                title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
                  isMicrophoneEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isMicrophoneEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Camera */}
              <button
                onClick={toggleCam}
                title={isCameraEnabled ? 'Stop Video' : 'Start Video'}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
                  isCameraEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCameraEnabled ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </button>

              {/* Screen Share Button */}
              <button
                onClick={toggleScreenShare}
                title={isScreenShareEnabled ? 'Stop Screen Share' : 'Share Screen'}
                className={`hidden md:flex px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm items-center gap-1.5 shrink-0 cursor-pointer ${
                  isScreenShareEnabled
                    ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isScreenShareEnabled ? 'Stop Share' : 'Share Screen'}
                </span>
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => {
                  if (activeTab === 'chat' && showSidebar) {
                    setShowSidebar(false);
                  } else {
                    setActiveTab('chat');
                    setShowSidebar(true);
                  }
                }}
                title="Chat"
                className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
                  activeTab === 'chat' && showSidebar
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Participants Toggle */}
              <button
                onClick={() => {
                  if (activeTab === 'participants' && showSidebar) {
                    setShowSidebar(false);
                  } else {
                    setActiveTab('participants');
                    setShowSidebar(true);
                  }
                }}
                title="Participants"
                className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
                  activeTab === 'participants' && showSidebar
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Leave Call */}
              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-3 sm:px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Panel ── */}
        {showSidebar && (
          <div className="hidden lg:flex w-80 xl:w-96 bg-white border border-slate-200 rounded-2xl flex-col shrink-0 overflow-hidden shadow-sm">
            <div className="flex items-center border-b border-slate-200 text-xs font-bold shrink-0 bg-slate-50/50 pr-2">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3.5 text-center transition border-b-2 ${
                  activeTab === 'participants'
                    ? 'border-blue-600 text-blue-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Participants ({combinedStudentList.length + 1})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3.5 text-center transition border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-blue-600 text-blue-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                title="Close Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 bg-white">
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {/* Teacher Row */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        T
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Teacher (Host)</p>
                        <p className="text-[10px] text-blue-600 font-semibold">Host / Tutor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tutorCameraTrack?.participant?.isMicrophoneEnabled ? (
                        <Mic className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <MicOff className="w-4 h-4 text-rose-500" />
                      )}
                      {tutorCameraTrack ? (
                        <Video className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Student List */}
                  {combinedStudentList.map((st, idx) => {
                    const isSelf = st.isSelf;
                    const rp = !isSelf
                      ? remoteParticipants.find(
                          (r) =>
                            r.sid === st.id || r.name?.toLowerCase() === st.name.toLowerCase(),
                        )
                      : localParticipant;

                    const isOnline = isSelf || Boolean(rp);

                    return (
                      <div
                        key={st.id || idx}
                        className="flex items-center justify-between py-2 border-b border-slate-100/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelf ? 'bg-violet-600 text-white' : isOnline ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {st.name} {isSelf ? '(You)' : ''}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {st.admissionNumber ? `#${st.admissionNumber}` : 'Student'} •{' '}
                              {isOnline ? 'Active' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {rp?.isMicrophoneEnabled ? (
                            <Mic className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          {rp?.isCameraEnabled ? (
                            <Video className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <VideoOff className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          msg.sender === 'System'
                            ? 'bg-slate-100 text-slate-500 text-center font-medium'
                            : msg.sender === studentSelfName
                              ? 'bg-blue-50 text-blue-900 ml-4'
                              : 'bg-slate-100 text-slate-800 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[11px]">{msg.sender}</span>
                          <span className="text-[9px] text-slate-400">{msg.time}</span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="mt-3 flex gap-2 shrink-0">
                    <input
                      type="text"
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Leave Class Modal ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-black text-white">Leave Live Class?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to leave the live interactive session? You can rejoin anytime
              while the class is active.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Stay in Class
              </button>
              <button
                onClick={() => router.push('/dashboard/student')}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition shadow-md cursor-pointer"
              >
                Leave Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Real-time Development Diagnostic HUD ── */}
      <LivekitDebugPanel classId={classId} role="student" />
    </div>
  );
}
