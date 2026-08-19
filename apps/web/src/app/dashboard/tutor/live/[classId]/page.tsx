'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  BookOpen,
  ClipboardList,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
  useDataChannel,
  useTracks,
  useConnectionState,
  useRoomContext,
  TrackReference,
} from '@livekit/components-react';
import { Track, ConnectionState, RoomEvent, Room } from 'livekit-client';
import { useAuth } from '@/providers/auth-provider';
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
      error:
        'Screen sharing is not supported on this browser. Please use Whiteboard or PDF presentation.',
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
    if (name === 'NotSupportedError' || name === 'TypeError') {
      return {
        stream: null,
        isUnsupported: true,
        error: 'Screen sharing is not supported by this browser version.',
      };
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

interface LiveClassDetail {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  scheduledEnd?: string;
  recordingEnabled?: boolean;
}

export default function TeacherStudioPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { user } = useAuth();

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

  // ── Top-Level Class Status Checker — Only redirects if class is explicitly CANCELLED
  useEffect(() => {
    const checkStatusOnMount = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}`, { skipGlobalToast: true });
        const classObj = data?.data ?? data;
        if (classObj?.status === 'CANCELLED') {
          toast.error('This class has been cancelled.');
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/tutor';
          }
        }
      } catch {}
    };
    checkStatusOnMount();
  }, [classId]);

  useEffect(() => {
    const initClassroom = async () => {
      try {
        const teacherName = user
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : 'Teacher (Host)';

        try {
          const data = await api.post<any>(
            `/live-classes/${classId}/start`,
            {},
            { skipGlobalToast: true },
          );
          if (data && data.token) {
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
        } catch {}

        // Fallback: Join token via API
        const encodedTeacher = encodeURIComponent(teacherName);
        try {
          const data = await api.get<any>(
            `/live-classes/${classId}/join-token?name=${encodedTeacher}&role=host`,
            { skipGlobalToast: true },
          );
          if (data && data.token) {
            const wsUrl = data.wsUrl || 'wss://neet-n80sqwyo.livekit.cloud';
            setLiveKitConfig({ token: data.token, wsUrl });
            if (typeof window !== 'undefined') {
              localStorage.setItem(`tutor_token_${classId}`, data.token);
              localStorage.setItem(`tutor_wsUrl_${classId}`, wsUrl);
            }
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('[LiveKit Studio] Failed to init studio token:', err);
        }
      } catch (err) {
        console.error('[LiveKit Studio] Failed to init live studio:', err);
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
              Initializing Teacher Live Studio...
            </span>
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
          <p className="text-sm text-slate-400">
            Could not get a valid session token. Check the API server is running.
          </p>
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
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
          stopMicTrackOnMute: true,
        },
      }}
      data-lk-theme="default"
      className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden font-sans select-none"
      onConnected={() => {
        console.log('[LiveKit Studio] Connected to room:', classId);
      }}
      onDisconnected={(reason) => {
        console.log('[LiveKit Studio] Disconnected from room:', reason);
      }}
    >
      <TeacherStudioInner
        classId={classId}
        classTitle={classDetail?.title || 'NEET Physics Live Studio'}
        scheduledEnd={classDetail?.scheduledEnd}
        recordingEnabled={classDetail?.recordingEnabled ?? false}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function TeacherStudioInner({
  classId,
  classTitle,
  scheduledEnd,
  recordingEnabled,
}: {
  classId: string;
  classTitle: string;
  scheduledEnd?: string | Date;
  recordingEnabled?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const connectionState = useConnectionState();

  const tutorName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Teacher (Host)';

  // ── Database Joined Participants Sync
  const [dbParticipants, setDbParticipants] = useState<
    Array<{ id: string; name: string; role?: string; admissionNumber?: string }>
  >([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const safeSendRef = useRef<((payload: any) => void) | null>(null);

  // ── Audio Autoplay Policy Recovery (Mobile / Strict Browser)
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
      console.error('[LiveKit Studio] Failed to start audio:', e);
    }
  };

  // ── Observability & Structured WebRTC Logging
  useEffect(() => {
    if (!room) return;

    const onTrackSubscribed = (track: any, pub: any, participant: any) => {
      console.log(
        `[LiveKit Studio] TrackSubscribed: kind=${track.kind} source=${pub.source} from participant=${participant.identity} (${participant.name || 'Unknown'})`,
      );
    };
    const onTrackUnsubscribed = (track: any, pub: any, participant: any) => {
      console.log(
        `[LiveKit Studio] TrackUnsubscribed: kind=${track.kind} source=${pub.source} from participant=${participant.identity}`,
      );
    };
    const onLocalTrackPublished = (pub: any) => {
      console.log(
        `[LiveKit Studio] LocalTrackPublished: kind=${pub.kind} source=${pub.source} trackSid=${pub.trackSid}`,
      );
    };
    const onReconnecting = () => {
      console.log('[LiveKit Studio] Reconnecting to room...');
      toast.warning('Network fluctuating, reconnecting...');
    };
    const onReconnected = () => {
      console.log('[LiveKit Studio] Successfully reconnected to room!');
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

  // ── Student Waiting Room & Admission System
  const [waitingStudents, setWaitingStudents] = useState<
    Array<{ id: string; name: string; time: string }>
  >([]);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<
    Array<{ id: string; name: string; time: string }>
  >([]);

  // ── Local Studio Canvas & Audio Composite Recording for upload on class end
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chosenMimeTypeRef = useRef<string>('video/mp4');
  const recordingStartTimeRef = useRef<number | null>(null);
  const studioCanvasAnimRef = useRef<any>(null);
  const [isScreenRecordingActive, setIsScreenRecordingActive] = useState(false);

  const requestStudioScreenShare = useCallback(async () => {
    try {
      if (studioCanvasAnimRef.current) {
        clearInterval(studioCanvasAnimRef.current);
        studioCanvasAnimRef.current = null;
      }

      let compositeStream: MediaStream | null = null;

      try {
        const userMediaStream = await navigator.mediaDevices
          .getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          .catch(async () => {
            return await navigator.mediaDevices
              .getUserMedia({ video: true, audio: true })
              .catch(async () => {
                return await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
              });
          });

        const compCanvas = document.createElement('canvas');
        compCanvas.width = 1280;
        compCanvas.height = 720;
        const hasCanvasCapture = typeof (compCanvas as any).captureStream === 'function';

        if (hasCanvasCapture) {
          const ctx = compCanvas.getContext('2d', { alpha: false });
          const canvases = Array.from(document.querySelectorAll('canvas'));
          const stageCanvas =
            canvases.find((c) => c !== compCanvas && c.width > 50 && c.height > 50) || canvases[0];

          let pipVideo: HTMLVideoElement | null = null;
          if (userMediaStream && userMediaStream.getVideoTracks().length > 0) {
            pipVideo = document.createElement('video');
            pipVideo.srcObject = userMediaStream;
            pipVideo.muted = true;
            pipVideo.playsInline = true;
            pipVideo.play().catch(() => {});
          }

          const drawComposite = () => {
            if (!ctx) return;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

            if (stageCanvas) {
              try {
                ctx.drawImage(stageCanvas, 0, 0, compCanvas.width, compCanvas.height);
              } catch {}
            }

            if (pipVideo && pipVideo.readyState >= 2) {
              const pipW = 260;
              const pipH = 195;
              const pipX = compCanvas.width - pipW - 20;
              const pipY = compCanvas.height - pipH - 20;

              ctx.save();
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(pipX, pipY, pipW, pipH, 16);
              } else {
                ctx.rect(pipX, pipY, pipW, pipH);
              }
              ctx.clip();
              ctx.drawImage(pipVideo, pipX, pipY, pipW, pipH);
              ctx.restore();

              ctx.strokeStyle = '#8b5cf6';
              ctx.lineWidth = 4;
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(pipX, pipY, pipW, pipH, 16);
              } else {
                ctx.rect(pipX, pipY, pipW, pipH);
              }
              ctx.stroke();
            }
          };

          const animInterval = setInterval(drawComposite, 33);
          studioCanvasAnimRef.current = animInterval;

          compositeStream = (compCanvas as any).captureStream(30);
          if (userMediaStream && userMediaStream.getAudioTracks().length > 0 && compositeStream) {
            compositeStream.addTrack(userMediaStream.getAudioTracks()[0]);
          }
        } else if (userMediaStream) {
          compositeStream = userMediaStream;
        }
      } catch (err) {
        console.warn('[LiveKit Studio] Studio recording capture init error:', err);
      }

      if (!compositeStream || compositeStream.getTracks().length === 0) {
        try {
          compositeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true,
          });
        } catch {
          try {
            compositeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch {}
        }
      }

      if (!compositeStream || compositeStream.getTracks().length === 0) {
        setIsScreenRecordingActive(false);
        return false;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      const mimeCandidates = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'audio/mp4',
        'audio/webm',
      ];
      let mimeType = 'video/mp4';
      if (typeof MediaRecorder !== 'undefined') {
        for (const cand of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(cand)) {
            mimeType = cand;
            break;
          }
        }
      }

      chosenMimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(compositeStream, { mimeType });
      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsScreenRecordingActive(true);
      toast.success('🔴 Class Live Recording Active!');
      return true;
    } catch (e) {
      console.warn('[LiveKit Studio] requestStudioScreenShare error:', e);
      setIsScreenRecordingActive(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      requestStudioScreenShare();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (studioCanvasAnimRef.current) {
        clearInterval(studioCanvasAnimRef.current);
        studioCanvasAnimRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, [classId, requestStudioScreenShare]);

  const [todayTopicInput, setTodayTopicInput] = useState('');

  const confirmEndClass = useCallback(
    async (topicArg?: string) => {
      setEndingClass(true);
      const topicCovered = topicArg !== undefined ? topicArg : todayTopicInput;

      try {
        localStorage.removeItem(`tutor_admitted_students_${classId}`);
        localStorage.removeItem(`tutor_token_${classId}`);
        localStorage.removeItem(`tutor_wsUrl_${classId}`);
      } catch {}

      // Broadcast class-ended event over DataChannel
      safeSendRef.current?.({ type: 'class-ended' });

      // Stop and finalize local recording upload
      toast.info('⏱ Uploading live class recording...');

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          await new Promise<void>((resolve) => {
            if (!mediaRecorderRef.current) return resolve();
            mediaRecorderRef.current.onstop = () => resolve();
            mediaRecorderRef.current.stop();
            setTimeout(resolve, 800);
          });
        } catch {}
      }

      await new Promise((r) => setTimeout(r, 200));

      if (recordedChunksRef.current.length > 0) {
        try {
          const mime = chosenMimeTypeRef.current || 'video/mp4';
          const isMp4 = mime.includes('mp4');
          const ext = isMp4 ? '.mp4' : '.webm';
          const blob = new Blob(recordedChunksRef.current, {
            type: isMp4 ? 'video/mp4' : 'video/webm',
          });

          const exactDurationSecs = recordingStartTimeRef.current
            ? Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000))
            : 15;

          const formData = new FormData();
          formData.append('durationSeconds', String(exactDurationSecs));
          formData.append('topicCovered', topicCovered || '');
          formData.append('video', blob, `${classId}${ext}`);

          const encodedTopic = encodeURIComponent(topicCovered || '');
          await api.post(
            `/live-classes/${classId}/upload-recording?durationSeconds=${exactDurationSecs}&topicCovered=${encodedTopic}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' }, skipGlobalToast: true },
          );
        } catch (uploadErr) {
          console.warn('[LiveKit Studio] Upload recording error:', uploadErr);
        }
      }

      try {
        await api.post(`/live-classes/${classId}/end`, {}, { skipGlobalToast: true });
      } catch {}

      toast.success('✅ Class ended and recording saved! Redirecting...');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard/tutor';
        }
      }, 800);
    },
    [classId, todayTopicInput],
  );

  // ── Auto-End Timer
  const [autoEndCountdown, setAutoEndCountdown] = useState<string | null>(null);
  const [isNearAutoEnd, setIsNearAutoEnd] = useState(false);
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

  const initialEndMs = parseEndMs(scheduledEnd);
  const initialCutoff =
    initialEndMs && initialEndMs > Date.now()
      ? initialEndMs + 15 * 60 * 1000
      : Date.now() + 2 * 60 * 60 * 1000;

  const targetCutoffMsRef = useRef<number>(initialCutoff);

  useEffect(() => {
    const fetchClassInfo = async () => {
      if (autoEndingRef.current) return;
      try {
        const data = await api.get<any>(`/live-classes/${classId}`, { skipGlobalToast: true });
        const classData = data?.data ?? data;
        if (classData.status === 'CANCELLED') {
          autoEndingRef.current = true;
          toast.info('⏱ Live class has been cancelled.');
          confirmEndClass();
          return;
        }

        const endVal = classData?.scheduledEnd || scheduledEnd;
        const endMs = parseEndMs(endVal);
        if (endMs && endMs > Date.now()) {
          targetCutoffMsRef.current = endMs + 15 * 60 * 1000;
        } else {
          targetCutoffMsRef.current = Date.now() + 2 * 60 * 60 * 1000;
        }
      } catch {}
    };

    fetchClassInfo();
    const interval = setInterval(fetchClassInfo, 10000);
    return () => clearInterval(interval);
  }, [classId, scheduledEnd, confirmEndClass]);

  useEffect(() => {
    const tick = () => {
      if (!targetCutoffMsRef.current) return;
      const remainingMs = targetCutoffMsRef.current - Date.now();
      if (remainingMs <= 0) {
        setAutoEndCountdown('0m 00s');
        setIsNearAutoEnd(true);
        if (!autoEndingRef.current) {
          autoEndingRef.current = true;
          toast.warning('⏱ Scheduled end time reached. Auto-ending class now!');
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
      const res = await api.post<any>(`/live-classes/${classId}/extend`, { extendMinutes: 15 });
      const updatedEnd = res?.scheduledEnd || res?.data?.scheduledEnd;
      if (updatedEnd) {
        const endMs = parseEndMs(updatedEnd);
        targetCutoffMsRef.current = endMs ? endMs + 15 * 60 * 1000 : Date.now() + 15 * 60 * 1000;
      } else {
        const currentCutoff = targetCutoffMsRef.current || Date.now();
        targetCutoffMsRef.current = Math.max(currentCutoff, Date.now()) + 15 * 60 * 1000;
      }
      autoEndingRef.current = false;
      toast.success('⏱ Class Duration Extended by +15 Mins! 🚀');
    } catch {
      toast.error('Failed to extend class duration');
    }
  };

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

  // ── Admitted local state tracking
  const [admittedStudents, setAdmittedStudents] = useState<Array<{ id: string; name: string }>>(
    () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = sessionStorage.getItem(`tutor_admitted_students_${classId}`);
          if (saved) return JSON.parse(saved);
        } catch {}
      }
      return [];
    },
  );

  // Poll pending join requests via API every 2s
  useEffect(() => {
    const pollJoinRequests = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}/join-requests`, {
          skipGlobalToast: true,
        });
        const requests: Array<{ id: string; name: string; time: string }> = data?.requests || [];
        requests.forEach((req) => {
          const normName = req.name.trim().toLowerCase();
          const isAdmitted = admittedStudents.some(
            (s) => s.id === req.id || s.name.toLowerCase() === normName,
          );
          if (!isAdmitted) {
            setPendingRequests((prev) => {
              if (prev.some((r) => r.id === req.id || r.name.toLowerCase() === normName))
                return prev;
              return [...prev, { id: req.id, name: req.name.trim(), time: req.time }];
            });
          }
        });
      } catch {}
    };

    pollJoinRequests();
    const interval = setInterval(pollJoinRequests, 2000);
    return () => clearInterval(interval);
  }, [classId, admittedStudents]);

  const combinedStudentList = React.useMemo(() => {
    const list: Array<{ id: string; name: string; admissionNumber?: string }> = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    const addIfNew = (id: string, name: string, admissionNumber?: string) => {
      const normName = name.trim().toLowerCase();
      if (seenIds.has(id) || seenNames.has(normName)) return;
      seenIds.add(id);
      seenNames.add(normName);
      list.push({ id, name: name.trim(), admissionNumber });
    };

    remoteParticipants.forEach((p) => {
      const displayName = (p.name || p.identity || 'Student').trim();
      const isHost =
        p.identity.startsWith('host-') ||
        displayName.toLowerCase().includes('teacher') ||
        displayName.toLowerCase().includes('host');
      if (!isHost) {
        addIfNew(p.sid, displayName);
      }
    });

    admittedStudents.forEach((aS) => {
      addIfNew(aS.id, aS.name);
    });

    dbParticipants.forEach((dbP) => {
      addIfNew(dbP.id, dbP.name, dbP.admissionNumber);
    });

    return list;
  }, [remoteParticipants, dbParticipants, admittedStudents]);

  // ── Authoritative LiveKit Track Collections
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const hostCamTrack = cameraTracks.find((t) => t.participant.isLocal);
  const activeScreenTrack = screenTracks[0];

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`tutor_class_${classId}_mode`);
      if (saved) return saved as Mode;
    }
    return 'idle';
  });

  // ── PDF & Whiteboard State
  const [activePdfDoc, setActivePdfDoc] = useState<PdfDocumentInfo | null>(null);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [whiteboardFrame, setWhiteboardFrame] = useState<string | null>(null);

  const modeRef = useRef(mode);
  const activePdfDocRef = useRef(activePdfDoc);
  const pdfPageRef = useRef(pdfPage);
  const whiteboardFrameRef = useRef<string | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    activePdfDocRef.current = activePdfDoc;
    pdfPageRef.current = pdfPage;
  }, [mode, activePdfDoc, pdfPage]);

  // ── UI States
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'attendance'>('chat');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pinnedParticipant, setPinnedParticipant] = useState<{
    id: string;
    name: string;
    isHost: boolean;
  } | null>(null);
  const [raisedHands, setRaisedHands] = useState<Array<{ id: string; name: string; time: string }>>(
    [],
  );

  // ── Attendance State & Handlers
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{
    sessionId?: string;
    batchName?: string;
    subjectName?: string;
    students: Array<{
      studentAdmissionId: string;
      studentName: string;
      admissionNumber: string;
      attendanceStatus: string;
    }>;
  }>({ students: [] });

  const searchParams = useSearchParams();
  const sessionTypeParam = searchParams?.get('sessionType');
  const studentNameParam = searchParams?.get('studentName');
  const studentAdmissionIdParam = searchParams?.get('studentAdmissionId');

  const fetchLiveAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const qParams = new URLSearchParams();
      if (sessionTypeParam) qParams.set('sessionType', sessionTypeParam);
      if (studentNameParam) qParams.set('studentName', studentNameParam);
      if (studentAdmissionIdParam) qParams.set('studentAdmissionId', studentAdmissionIdParam);
      const qs = qParams.toString() ? `?${qParams.toString()}` : '';

      const data = await api.get<any>(`/live-classes/${classId}/attendance${qs}`, {
        skipGlobalToast: true,
      });
      const payload = data?.data ?? data;
      let rawStudents = payload.students || [];

      setAttendanceData({
        sessionId: payload.sessionId,
        batchName: payload.batchName,
        subjectName: payload.subjectName,
        students: rawStudents,
      });
    } catch (err) {
      console.error('[LiveKit Studio] Failed to fetch attendance sheet:', err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [classId, sessionTypeParam, studentNameParam, studentAdmissionIdParam]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchLiveAttendance();
    }
  }, [activeTab, fetchLiveAttendance]);

  const toggleStudentStatus = (studentAdmissionId: string, newStatus: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.studentAdmissionId === studentAdmissionId ? { ...st, attendanceStatus: newStatus } : st,
      ),
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceData((prev) => ({
      ...prev,
      students: prev.students.map((st) => ({ ...st, attendanceStatus: 'PRESENT' })),
    }));
    toast.success('Marked all students as Present!');
  };

  const handleSaveAttendance = async () => {
    if (!attendanceData.students || attendanceData.students.length === 0) {
      toast.error('No students to save attendance for');
      return;
    }
    const markedStudents = attendanceData.students.filter((st) => Boolean(st.attendanceStatus));
    if (markedStudents.length === 0) {
      toast.warning('Please select attendance for at least one student before saving.');
      return;
    }
    try {
      setAttendanceSaving(true);
      const records = markedStudents.map((st) => ({
        studentAdmissionId: st.studentAdmissionId,
        attendanceStatus: st.attendanceStatus,
      }));

      await api.post(`/live-classes/${classId}/attendance`, { records }, { skipGlobalToast: true });
      toast.success('Attendance saved & synced!');
    } catch (err) {
      console.error('[LiveKit Studio] Error saving attendance:', err);
      toast.error('Error saving attendance');
    } finally {
      setAttendanceSaving(false);
    }
  };

  // ── Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: 'System',
      text: 'Live Studio Room Connected.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // ── LiveKit DataChannel Handler for Real-Time Event Sync
  const { send } = useDataChannel((msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'chat') {
        setChatMessages((prev) => [
          ...prev,
          { sender: data.sender, text: data.text, time: data.time },
        ]);
      } else if (data.type === 'raise-hand') {
        setRaisedHands((prev) => {
          if (prev.some((h) => h.id === data.id)) return prev;
          return [...prev, { id: data.id, name: data.name, time: data.time }];
        });
      } else if (data.type === 'lower-hand') {
        setRaisedHands((prev) => prev.filter((h) => h.id !== data.id));
      } else if (data.type === 'join-request') {
        setPendingRequests((prev) => {
          if (prev.some((req) => req.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              name: data.name,
              time:
                data.time ||
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      }
    } catch {}
  });

  const safeSend = useCallback(
    (payload: any) => {
      if (connectionState !== ConnectionState.Connected) return;
      try {
        const encoder = new TextEncoder();
        const promise = send(encoder.encode(JSON.stringify(payload)), { reliable: true });
        if (promise && typeof (promise as any).catch === 'function') {
          (promise as any).catch(() => {});
        }
      } catch {}
    },
    [connectionState, send],
  );

  useEffect(() => {
    safeSendRef.current = safeSend;
  }, [safeSend]);

  const admitStudent = async (studentId: string, studentName?: string) => {
    const nameToAdmit = studentName || 'Student';
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
    setAdmittedStudents((prev) => {
      let updated = prev;
      if (!prev.some((s) => s.id === studentId || s.name === nameToAdmit)) {
        updated = [...prev, { id: studentId, name: nameToAdmit }];
      }
      try {
        sessionStorage.setItem(`tutor_admitted_students_${classId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      safeSend({ type: 'join-approved', studentId, classId });
      api
        .delete(
          `/live-classes/${classId}/join-requests/${encodeURIComponent(studentId)}?action=admit`,
          { skipGlobalToast: true },
        )
        .catch(() => {});
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
        sessionStorage.setItem(`tutor_admitted_students_${classId}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      pendingList.forEach((st) => {
        safeSend({ type: 'join-approved', studentId: st.id, classId });
        api
          .delete(
            `/live-classes/${classId}/join-requests/${encodeURIComponent(st.id)}?action=admit`,
            { skipGlobalToast: true },
          )
          .catch(() => {});
      });
      toast.success(`✅ All ${pendingList.length} students admitted`);
    } catch {}
  };

  const denyStudent = (studentId: string, studentName?: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
    try {
      safeSend({ type: 'join-denied', studentId, classId });
      api
        .delete(
          `/live-classes/${classId}/join-requests/${encodeURIComponent(studentId)}?action=deny`,
          { skipGlobalToast: true },
        )
        .catch(() => {});
      toast.error(`🚫 ${studentName || 'Student'} denied entry`);
    } catch {}
  };

  const denyAllStudents = (pendingList: Array<{ id: string; name: string; time: string }>) => {
    setPendingRequests([]);
    try {
      pendingList.forEach((s) => {
        safeSend({ type: 'join-denied', studentId: s.id, classId });
      });
      api
        .delete(`/live-classes/${classId}/join-requests/all?action=deny`, { skipGlobalToast: true })
        .catch(() => {});
      toast.error(`🚫 All ${pendingList.length} students denied entry`);
    } catch {}
  };

  // ── Native LiveKit Track Toggles (Microphone, Camera, Screen Share)
  const toggleMic = async () => {
    try {
      const next = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(next, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      console.log('[LiveKit Studio] Tutor microphone enabled:', next);
    } catch (err: any) {
      console.error('[LiveKit Studio] Tutor microphone error:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const toggleCam = async () => {
    try {
      const next = !isCameraEnabled;
      await localParticipant.setCameraEnabled(next, {
        resolution: { width: 1280, height: 720, frameRate: 30 },
        facingMode: 'user',
      });
      console.log('[LiveKit Studio] Tutor camera enabled:', next);
    } catch (err: any) {
      console.error('[LiveKit Studio] Tutor camera error:', err);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const startScreenShare = async () => {
    try {
      const res = await getScreenMediaStream();
      if (!res.stream) {
        if (res.isCancelled) toast.info('Screen share was cancelled.');
        else toast.error(res.error || 'Screen capture not supported on this browser.');
        return;
      }
      res.stream.getTracks().forEach((t) => t.stop());
      await localParticipant.setScreenShareEnabled(true, { audio: false });
      setMode('screen');
      safeSend({ type: 'mode-change', mode: 'screen', pdfPage });
      console.log('[LiveKit Studio] Tutor screen sharing started');
      toast.success('📱 Screen Sharing Active!');
    } catch (err: any) {
      console.error('[LiveKit Studio] Screen share start error:', err);
      toast.error('Screen sharing could not be started.');
    }
  };

  const stopScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(false);
      setMode('idle');
      safeSend({ type: 'mode-change', mode: 'idle', pdfPage });
      console.log('[LiveKit Studio] Tutor screen sharing stopped');
    } catch (err: any) {
      console.error('[LiveKit Studio] Stop screen share error:', err);
    }
  };

  // ── Broadcast Mode Change to Students
  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'screen' && !isScreenShareEnabled) {
      startScreenShare();
    } else if (newMode !== 'screen' && isScreenShareEnabled) {
      stopScreenShare();
    }
    safeSend({ type: 'mode-change', mode: newMode, pdfPage, doc: activePdfDoc });
    try {
      sessionStorage.setItem(`tutor_class_${classId}_mode`, newMode);
    } catch {}
  };

  const handleWhiteboardFrame = useCallback(
    (frame: string) => {
      whiteboardFrameRef.current = frame;
      setWhiteboardFrame(frame);
      safeSend({ type: 'whiteboard-frame', frame });
    },
    [safeSend],
  );

  const handlePdfPageChange = (page: number) => {
    setPdfPage(page);
    pdfPageRef.current = page;
    safeSend({ type: 'pdf-page-change', page, doc: activePdfDoc });
  };

  const handlePdfDocChange = (doc: PdfDocumentInfo) => {
    setActivePdfDoc(doc);
    setPdfPage(1);
    pdfPageRef.current = 1;
    safeSend({ type: 'pdf-doc-change', doc, page: 1 });
  };

  // Periodic heartbeat sync so any student entering gets current studio presentation mode
  useEffect(() => {
    const syncInterval = setInterval(() => {
      safeSend({
        type: 'mode-sync',
        mode: isScreenShareEnabled ? 'screen' : modeRef.current,
        doc: activePdfDocRef.current,
        pdfPage: pdfPageRef.current,
        whiteboardFrame: whiteboardFrameRef.current,
      });
    }, 2000);
    return () => clearInterval(syncInterval);
  }, [safeSend, isScreenShareEnabled]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgObj = { type: 'chat', sender: 'Teacher (Host)', text: inputMsg, time };

    safeSend(msgObj);
    setChatMessages((prev) => [...prev, { sender: 'Teacher (Host)', text: inputMsg, time }]);
    setInputMsg('');
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ── Audio Autoplay Unlock Floating Pill (for Mobile / Strict Browsers) ── */}
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
        {/* Left: Brand + Live badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-extrabold text-white tracking-tight hidden xs:block">
            Connect Meet
          </h1>
          <span className="hidden lg:block text-xs text-slate-400 font-medium truncate max-w-[120px]">
            ({classTitle})
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider animate-pulse shrink-0">
            <Radio className="w-2.5 h-2.5" /> LIVE
          </div>
          {recordingEnabled && (
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/10 border border-red-500/40 text-red-600 text-[10px] font-black uppercase tracking-wider animate-pulse"
              title="Auto-recording is ON"
            >
              <Video className="w-2.5 h-2.5" /> REC
            </div>
          )}
          {autoEndCountdown && (
            <div className="hidden md:flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
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
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm cursor-pointer active:scale-95"
                title="Extend live class duration by +15 minutes"
              >
                <span>+15m ⏱️</span>
              </button>
            </div>
          )}
        </div>

        {/* Centre: Mode switcher pills */}
        <div className="flex items-center bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-700 gap-0.5 sm:gap-1 text-[11px] sm:text-xs shrink-0">
          <button
            onClick={() => changeMode('idle')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition ${mode === 'idle' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <Grid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => changeMode('whiteboard')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition ${mode === 'whiteboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <PenTool className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Board</span>
          </button>
        </div>

        {/* Right: User profile pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {tutorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[80px] truncate">
              {tutorName}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden relative p-2 sm:p-3 lg:p-4 gap-0 lg:gap-4 bg-slate-950">
        {/* Left Main Stage Container */}
        <div className="flex-1 h-full bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 flex flex-col relative overflow-hidden shadow-inner min-w-0">
          {/* Floating Waiting Room Join Request Banner */}
          {pendingRequests.length > 0 && (
            <div className="fixed top-14 left-2 right-2 sm:left-auto sm:right-4 sm:w-96 z-50 bg-slate-900/98 border-2 border-amber-500/90 shadow-2xl rounded-2xl p-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 text-left">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-amber-300 truncate">
                    Waiting to Join ({pendingRequests.length})
                  </span>
                </div>
                {pendingRequests.length > 1 && (
                  <button
                    onClick={() => admitAllStudents(pendingRequests)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-[10px] font-black transition cursor-pointer shadow-xs"
                  >
                    Admit All
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between bg-slate-800/90 p-2 rounded-xl border border-slate-700/80 gap-2 shadow-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{req.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{req.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => admitStudent(req.id, req.name)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Admit
                      </button>
                      <button
                        onClick={() => denyStudent(req.id, req.name)}
                        className="px-2 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid View Mode */}
          {mode === 'idle' && (
            <>
              {pinnedParticipant ? (
                /* Focused Spotlight View */
                <div className="w-full h-full relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md flex items-center justify-center">
                  {pinnedParticipant.isHost ? (
                    isCameraEnabled &&
                    hostCamTrack &&
                    hostCamTrack.publication?.track &&
                    !hostCamTrack.publication.isMuted ? (
                      <VideoTrack
                        trackRef={hostCamTrack}
                        className="w-full h-full object-contain scale-x-[-1]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                        <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-3xl shadow-lg">
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-base font-bold text-slate-200">
                          {tutorName} (You)
                        </span>
                      </div>
                    )
                  ) : (() => {
                    const rp = remoteParticipants.find(
                      (r) => r.sid === pinnedParticipant.id || r.name === pinnedParticipant.name,
                    );
                    const studentCamTrack = cameraTracks.find(
                      (t) =>
                        t.participant.sid === rp?.sid &&
                        t.publication?.track &&
                        !t.publication.isMuted,
                    );
                    const studentScreenTrack = screenTracks.find(
                      (t) =>
                        t.participant.sid === rp?.sid &&
                        t.publication?.track &&
                        !t.publication.isMuted,
                    );

                    if (studentScreenTrack) {
                      return (
                        <VideoTrack
                          trackRef={studentScreenTrack}
                          className="w-full h-full object-contain"
                        />
                      );
                    }
                    if (studentCamTrack) {
                      return (
                        <VideoTrack
                          trackRef={studentCamTrack}
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

                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{pinnedParticipant.name} (Spotlight)</span>
                  </div>

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
                /* Standard Multi-Party Video Grid */
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto pr-1 content-start">
                  {/* 1. Host (Teacher) Video Tile */}
                  <div
                    className={`aspect-video bg-slate-900 border transition-all duration-300 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center group ${
                      isMicrophoneEnabled && localParticipant.isSpeaking
                        ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20'
                        : 'border-slate-800/90'
                    }`}
                  >
                    {isScreenShareEnabled && screenTracks.find((t) => t.participant.isLocal) ? (
                      <VideoTrack
                        trackRef={screenTracks.find((t) => t.participant.isLocal)!}
                        className="w-full h-full object-contain"
                      />
                    ) : isCameraEnabled &&
                      hostCamTrack &&
                      hostCamTrack.publication?.track &&
                      !hostCamTrack.publication.isMuted ? (
                      <VideoTrack
                        trackRef={hostCamTrack}
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={`w-14 h-14 rounded-full text-white flex items-center justify-center font-extrabold text-lg shadow-lg transition ${
                            localParticipant.isSpeaking
                              ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse'
                              : 'bg-violet-600 border-2 border-violet-400/40'
                          }`}
                        >
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-200">{tutorName} (You)</span>
                      </div>
                    )}

                    {/* Spotlight Pin Button */}
                    <button
                      onClick={() =>
                        setPinnedParticipant({
                          id: 'host',
                          name: `${tutorName} (Host)`,
                          isHost: true,
                        })
                      }
                      className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md z-10"
                      title="Spotlight Full Screen"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>

                    {/* Top Right Mic & Cam Status Badges with Live Audio Waves */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <div
                        className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1 ${isMicrophoneEnabled ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'}`}
                      >
                        {isMicrophoneEnabled ? (
                          <Mic className="w-3.5 h-3.5" />
                        ) : (
                          <MicOff className="w-3.5 h-3.5" />
                        )}
                        {isMicrophoneEnabled && localParticipant.isSpeaking && (
                          <span className="flex gap-0.5 items-end h-3">
                            <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" />
                            <span className="w-0.5 h-3 bg-emerald-400 animate-bounce delay-75" />
                            <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce delay-150" />
                          </span>
                        )}
                      </div>
                      <div
                        className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md ${isCameraEnabled ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300' : 'bg-slate-800/80 border border-slate-700 text-slate-400'}`}
                      >
                        {isCameraEnabled ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <VideoOff className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Participant Label */}
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {tutorName}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                        Host
                      </span>
                    </div>
                  </div>

                  {/* 2. Remote Student Video Tiles */}
                  {combinedStudentList.map((p, idx) => {
                    const rp = remoteParticipants.find(
                      (r) => r.sid === p.id || r.name?.toLowerCase() === p.name.toLowerCase(),
                    );
                    const studentCamTrack = cameraTracks.find(
                      (t) =>
                        t.participant.sid === rp?.sid &&
                        t.publication?.track &&
                        !t.publication.isMuted,
                    );
                    const studentScreenTrack = screenTracks.find(
                      (t) =>
                        t.participant.sid === rp?.sid &&
                        t.publication?.track &&
                        !t.publication.isMuted,
                    );

                    const isStudentMicOn = rp?.isMicrophoneEnabled ?? false;
                    const isStudentCamOn = Boolean(studentCamTrack);
                    const isHand = raisedHands.some(
                      (h) => h.name.toLowerCase() === p.name.toLowerCase(),
                    );
                    const isSpeaking = rp?.isSpeaking ?? false;

                    return (
                      <div
                        key={p.id || idx}
                        className={`aspect-video bg-slate-900 border rounded-2xl overflow-hidden relative shadow-xl flex flex-col items-center justify-center group hover:border-slate-700 transition ${studentScreenTrack ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/30' : isSpeaking ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20' : 'border-slate-800/90'}`}
                      >
                        {studentScreenTrack ? (
                          <VideoTrack
                            trackRef={studentScreenTrack}
                            className="w-full h-full object-contain"
                          />
                        ) : studentCamTrack ? (
                          <VideoTrack
                            trackRef={studentCamTrack}
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div
                              className={`w-12 h-12 rounded-full text-slate-300 flex items-center justify-center font-extrabold text-sm border ${isSpeaking ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse' : 'bg-slate-800 border-slate-700'}`}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
                              {p.name}
                            </span>
                          </div>
                        )}

                        {/* Spotlight Pin Button */}
                        <button
                          onClick={() =>
                            setPinnedParticipant({
                              id: p.id || `student-${idx}`,
                              name: p.name,
                              isHost: false,
                            })
                          }
                          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1.5 rounded-lg border border-slate-600 shadow-md z-10"
                          title="Spotlight Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Top Right Badges: Mic & Video Signals */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                          {isHand && (
                            <div
                              className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-lg animate-bounce"
                              title="Hand Raised"
                            >
                              <Hand className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {studentScreenTrack && (
                            <div className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-lg flex items-center gap-1">
                              <Monitor className="w-3.5 h-3.5 animate-pulse" />
                              <span className="text-[10px]">Sharing Screen</span>
                            </div>
                          )}
                          <div
                            className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1 ${
                              isStudentMicOn
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20'
                                : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                            }`}
                          >
                            {isStudentMicOn ? (
                              <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            {isStudentMicOn && isSpeaking && (
                              <span className="flex gap-0.5 items-end h-3">
                                <span className="w-0.5 h-2 bg-emerald-400 animate-bounce" />
                                <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce delay-75" />
                              </span>
                            )}
                          </div>
                          <div
                            className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md ${
                              isStudentCamOn
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                            }`}
                          >
                            {isStudentCamOn ? (
                              <Video className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <VideoOff className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Bottom Label */}
                        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between z-10">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full ${isStudentMicOn || isStudentCamOn || studentScreenTrack ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
                            />
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {p.name}
                            </span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-bold font-mono">
                            {studentScreenTrack
                              ? 'Screen Sharing'
                              : isStudentMicOn
                                ? 'Mic Active'
                                : p.admissionNumber || 'Student'}
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

          {/* Mode 2: PDF Presentation */}
          {mode === 'pdf' && (
            <div className="w-full h-full relative bg-slate-950">
              <StudioPdfPresenter
                isTeacher={true}
                activeDoc={activePdfDoc}
                currentPage={pdfPage}
                onPageChange={handlePdfPageChange}
                onDocChange={handlePdfDocChange}
                onClose={() => changeMode('idle')}
              />
            </div>
          )}

          {/* Mode 3: Screen Share */}
          {mode === 'screen' && (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-2 sm:p-4">
              {isScreenShareEnabled && (
                <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-40 flex items-center justify-between bg-slate-900/95 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl">
                  <div className="flex items-center gap-2 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 animate-pulse text-rose-400" />
                      <span className="text-xs font-black text-white tracking-wide">
                        Screen Sharing Active (Live)
                      </span>
                    </div>
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

              {activeScreenTrack && activeScreenTrack.publication?.track ? (
                <VideoTrack
                  trackRef={activeScreenTrack}
                  className="w-full h-full object-contain rounded-xl border border-slate-800 shadow-2xl max-h-[85vh]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-slate-500 p-6 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-xl">
                    <Monitor className="w-8 h-8 animate-pulse text-blue-400" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-200 mb-1">
                      Screen Share Ready
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Share your entire screen, window, or browser tab live with all participants.
                    </p>
                  </div>
                  <button
                    onClick={startScreenShare}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" /> Start Screen Share
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Floating Bottom Control Dock */}
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

              {/* Screen Share / Stop Sharing Button (Desktop Only) */}
              <button
                onClick={() => {
                  if (isScreenShareEnabled || mode === 'screen') {
                    stopScreenShare();
                  } else {
                    startScreenShare();
                  }
                }}
                title={
                  isScreenShareEnabled || mode === 'screen'
                    ? 'Stop Screen Share'
                    : 'Share Screen (Desktop / Laptop)'
                }
                className={`hidden md:flex px-2.5 sm:px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm items-center gap-1.5 shrink-0 cursor-pointer ${
                  isScreenShareEnabled || mode === 'screen'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isScreenShareEnabled || mode === 'screen' ? 'Stop Share' : 'Share Screen'}
                </span>
              </button>

              {/* Touch Whiteboard */}
              <button
                onClick={() => changeMode(mode === 'whiteboard' ? 'idle' : 'whiteboard')}
                title={mode === 'whiteboard' ? 'Close Whiteboard' : 'Open Touch Whiteboard'}
                className={`px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  mode === 'whiteboard'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>

              {/* PDF Presentation */}
              <button
                onClick={() => changeMode(mode === 'pdf' ? 'idle' : 'pdf')}
                title={mode === 'pdf' ? 'Close PDF Presentation' : 'Present PDF / NEET Notes'}
                className={`px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  mode === 'pdf'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Present PDF</span>
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
                className={`w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
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
                className={`relative w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
                  activeTab === 'participants' && (showSidebar || showMobileDrawer)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-md">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {/* Attendance Sheet Drawer Toggle */}
              <button
                onClick={() => {
                  if (activeTab === 'attendance' && (showSidebar || showMobileDrawer)) {
                    setShowSidebar(false);
                    setShowMobileDrawer(false);
                  } else {
                    setActiveTab('attendance');
                    setShowSidebar(true);
                    setShowMobileDrawer(true);
                  }
                }}
                title="Mark Attendance Sheet"
                className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer ${
                  activeTab === 'attendance' && (showSidebar || showMobileDrawer)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
              </button>

              {/* End Call */}
              <button
                onClick={() => setShowEndModal(true)}
                className="px-3 sm:px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
              >
                End
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Panel ── */}
        {showSidebar && (
          <div className="hidden lg:flex w-80 xl:w-96 bg-white border border-slate-200 rounded-2xl flex-col shrink-0 overflow-hidden shadow-sm">
            {/* Tabs */}
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
                    ? 'border-blue-600 text-blue-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex-1 py-3.5 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'attendance'
                    ? 'border-violet-600 text-violet-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Attendance</span>
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                title="Close Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 bg-white">
              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Waiting Room Join Requests Section */}
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
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {req.name}
                              </p>
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
                      {isMicrophoneEnabled ? (
                        <Mic className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <MicOff className="w-4 h-4 text-rose-500" />
                      )}
                      {isCameraEnabled ? (
                        <Video className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Combined Student List */}
                  {combinedStudentList.map((p, idx) => {
                    const rp = remoteParticipants.find(
                      (r) => r.sid === p.id || r.name?.toLowerCase() === p.name.toLowerCase(),
                    );
                    const isOnline = Boolean(rp);
                    const isHand = raisedHands.some(
                      (h) => h.name.toLowerCase() === p.name.toLowerCase(),
                    );

                    return (
                      <div
                        key={p.id || idx}
                        className="flex items-center justify-between py-2 border-b border-slate-100/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isOnline ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {p.admissionNumber ? `#${p.admissionNumber}` : 'Student'} •{' '}
                              {isOnline ? 'Active' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isHand && (
                            <div className="p-1 rounded-md bg-amber-100 text-amber-600">
                              <Hand className="w-3.5 h-3.5" />
                            </div>
                          )}
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

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          msg.sender === 'System'
                            ? 'bg-slate-100 text-slate-500 text-center font-medium'
                            : msg.sender.includes('Teacher')
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

              {/* Attendance Sheet Tab */}
              {activeTab === 'attendance' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {attendanceData.batchName || 'Live Batch'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {attendanceData.subjectName || 'NEET Subject'} •{' '}
                        {attendanceData.students.length} Enrolled
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAllPresent}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Mark All Present
                    </button>
                  </div>

                  {attendanceLoading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-xs font-semibold">Loading roster...</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-2">
                      {attendanceData.students.map((st) => (
                        <div
                          key={st.studentAdmissionId}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {st.studentName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              #{st.admissionNumber || 'ADM'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {['PRESENT', 'ABSENT', 'LATE'].map((status) => (
                              <button
                                key={status}
                                onClick={() => toggleStudentStatus(st.studentAdmissionId, status)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                  st.attendanceStatus === status
                                    ? status === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : status === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {status.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSaveAttendance}
                    disabled={attendanceSaving}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {attendanceSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Save Attendance</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── End Class Confirmation Modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">End Live Class Session?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ending this session will save and upload the recorded class video and disconnect all
              connected students.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                Topic Covered Today (Optional):
              </label>
              <input
                type="text"
                value={todayTopicInput}
                onChange={(e) => setTodayTopicInput(e.target.value)}
                placeholder="e.g. Wave Optics & Interference Formulas"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEndModal(false);
                  confirmEndClass();
                }}
                disabled={endingClass}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {endingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>End Class Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Real-time Development Diagnostic HUD ── */}
      <LivekitDebugPanel classId={classId} role="tutor" />
    </div>
  );
}
