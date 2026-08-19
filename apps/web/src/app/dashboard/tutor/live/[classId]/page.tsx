'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
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
      error: 'Screen sharing is not supported on this browser. Please use Whiteboard or PDF presentation.',
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

  // ── Top-Level Class Status Checker — Only redirects if class is explicitly CANCELLED
  useEffect(() => {
    const checkStatusOnMount = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:3000/v1/live-classes/${classId}`);
        if (res.ok) {
          const json = await res.json();
          const data = json?.data ?? json;
          if (data?.status === 'CANCELLED') {
            toast.error('This class has been cancelled.');
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard/tutor';
            }
          }
        }
      } catch {}
    };
    checkStatusOnMount();
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

        try {
          const statusChannel = new BroadcastChannel('neet-live-class-status');
          statusChannel.postMessage({ type: 'class-reopened', classId });
          statusChannel.close();
        } catch {}

        try {
          const data = await api.post<any>(`/live-classes/${classId}/start`, {}, { skipGlobalToast: true });
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

        // Fallback 1: Join token via API helper
        const encodedTeacher = encodeURIComponent(teacherName);
        try {
          const data = await api.get<any>(
            `/live-classes/${classId}/join-token?name=${encodedTeacher}&role=host`,
            { skipGlobalToast: true }
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
        } catch {}

        // Fallback 2: Direct Render backend and local endpoints
        const endpoints = [
          `https://neet-saas.onrender.com/api/v1/live-classes/${classId}/start`,
          `https://neet-saas.onrender.com/api/v1/live-classes/${classId}/join-token?name=${encodedTeacher}&role=host`,
          `http://${host}:3000/api/v1/live-classes/${classId}/start`,
          `http://${host}:3000/v1/live-classes/${classId}/start`,
          `/api/v1/live-classes/${classId}/start`,
        ];

        for (const url of endpoints) {
          try {
            const isStart = url.includes('/start');
            const res = await fetch(url, {
              method: isStart ? 'POST' : 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.token) {
                const wsUrl = data.wsUrl || 'wss://neet-n80sqwyo.livekit.cloud';
                setLiveKitConfig({ token: data.token, wsUrl });
                if (data.liveClass) setClassDetail(data.liveClass);
                setLoading(false);
                return;
              }
            }
          } catch {}
        }
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

  // ── Student Waiting Room & Admission System
  const [waitingStudents, setWaitingStudents] = useState<Array<{ id: string; name: string; time: string }>>([]);
  const [showWaitingModal, setShowWaitingModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel('neet-live-join-requests');
    channel.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'join-request' && (!data.classId || data.classId === classId)) {
        setWaitingStudents((prev) => {
          if (prev.some((s) => s.id === data.id)) return prev;
          return [...prev, { id: data.id, name: data.name || 'Student', time: data.time || 'Now' }];
        });
      }
    };
    return () => channel.close();
  }, [classId]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chosenMimeTypeRef = useRef<string>('video/mp4');
  const recordingAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const studioCanvasAnimRef = useRef<any>(null);
  const [isScreenRecordingActive, setIsScreenRecordingActive] = useState(false);
  const [dismissStudioModal, setDismissStudioModal] = useState(false);

  const requestStudioScreenShare = useCallback(async () => {
    try {
      if (studioCanvasAnimRef.current) {
        clearInterval(studioCanvasAnimRef.current);
        studioCanvasAnimRef.current = null;
      }

      let compositeStream: MediaStream | null = null;

      // Studio Whiteboard Canvas + Tutor Camera / Mic Composite Recording Stream
      try {
        // Get Tutor Camera + Audio stream
          const userMediaStream = await navigator.mediaDevices
            .getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
              audio: {
                echoCancellation: { ideal: true },
                noiseSuppression: { ideal: true },
                autoGainControl: { ideal: true },
              },
            })
            .catch(async () => {
              return await navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .catch(async () => {
                  return await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
                });
            });

          // Check if HTML5 Canvas captureStream is supported (Android Chrome / Desktop)
          const compCanvas = document.createElement('canvas');
          compCanvas.width = 1280;
          compCanvas.height = 720;
          const hasCanvasCapture = typeof (compCanvas as any).captureStream === 'function';

          if (hasCanvasCapture) {
            const ctx = compCanvas.getContext('2d', { alpha: false });
            const canvases = Array.from(document.querySelectorAll('canvas'));
            const stageCanvas = canvases.find((c) => c !== compCanvas && c.width > 50 && c.height > 50) || canvases[0];

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
              // Dark background fill
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

              // Draw Studio Whiteboard Stage
              if (stageCanvas) {
                try {
                  ctx.drawImage(stageCanvas, 0, 0, compCanvas.width, compCanvas.height);
                } catch {}
              }

              // Draw Tutor Camera PIP in bottom-right corner
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

            const animInterval = setInterval(drawComposite, 33); // ~30 FPS
            studioCanvasAnimRef.current = animInterval;

            compositeStream = (compCanvas as any).captureStream(30);
            if (userMediaStream && userMediaStream.getAudioTracks().length > 0 && compositeStream) {
              compositeStream.addTrack(userMediaStream.getAudioTracks()[0]);
            }
          } else if (userMediaStream) {
            // iOS Safari fallback: Use userMediaStream directly (video + mic)
            compositeStream = userMediaStream;
          }
        } catch (err) {
          console.warn('Studio recording stream initialization error:', err);
        }

        // Final direct camera stream fallback
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
        toast.error('⚠️ Please allow Camera/Microphone access to enable class recording.');
        setIsScreenRecordingActive(false);
        setDismissStudioModal(true);
        return false;
      }

      // 3. Ensure Tutor Microphone Track is attached & active
      if (compositeStream.getAudioTracks().length === 0) {
        try {
          const userAudioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
            },
          });
          const audioTrack = userAudioStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = Boolean(isMicOnRef.current);
            recordingAudioTrackRef.current = audioTrack;
            compositeStream.addTrack(audioTrack);
          }
        } catch {}
      } else {
        const audioTrack = compositeStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = Boolean(isMicOnRef.current);
          recordingAudioTrackRef.current = audioTrack;
        }
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
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
      setDismissStudioModal(true);
      toast.success('🔴 Class Live Recording Active! Video & Audio are being recorded.');
      return true;
    } catch (e) {
      console.warn('requestStudioScreenShare error:', e);
      setIsScreenRecordingActive(false);
      setDismissStudioModal(true);
      return false;
    }
  }, []);

  // ── Ensure class status is LIVE on backend & broadcast reopened signal ──
  useEffect(() => {
    const reopenClass = async () => {
      try {
        const host = window.location.hostname;
        const endpoints = [
          `http://${host}:3000/v1/live-classes/${classId}/start`,
          `http://${host}:3000/api/v1/live-classes/${classId}/start`,
          `/v1/live-classes/${classId}/start`,
        ];
        for (const url of endpoints) {
          try {
            const res = await fetch(url, { method: 'POST' });
            if (res.ok) break;
          } catch {}
        }
      } catch {}
      try {
        const statusBc = new BroadcastChannel('neet-live-class-status');
        statusBc.postMessage({ type: 'class-reopened', classId });
        statusBc.close();
      } catch {}
    };
    reopenClass();
  }, [classId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prompt for studio screen share on studio enter
    const timer = setTimeout(() => {
      requestStudioScreenShare();
    }, 400);

    return () => {
      clearTimeout(timer);
      if (studioCanvasAnimRef.current) {
        clearInterval(studioCanvasAnimRef.current);
        studioCanvasAnimRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    };
  }, [classId, requestStudioScreenShare]);

  const [todayTopicInput, setTodayTopicInput] = useState('');

  const confirmEndClass = useCallback(async (topicArg?: string) => {
    setEndingClass(true);
    const topicCovered = topicArg !== undefined ? topicArg : todayTopicInput;

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

    // Upload live recorded class video
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

    // Small delay to ensure all recorded chunks are flushed
    await new Promise((r) => setTimeout(r, 200));

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    if (recordedChunksRef.current.length > 0) {
      try {
        const mime = chosenMimeTypeRef.current || 'video/mp4';
        const isMp4 = mime.includes('mp4');
        const ext = isMp4 ? '.mp4' : '.webm';
        const blob = new Blob(recordedChunksRef.current, { type: isMp4 ? 'video/mp4' : 'video/webm' });
        
        const exactDurationSecs = recordingStartTimeRef.current
          ? Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000))
          : 15;

        const formData = new FormData();
        formData.append('durationSeconds', String(exactDurationSecs));
        formData.append('topicCovered', topicCovered || '');
        formData.append('video', blob, `${classId}${ext}`);

        const encodedTopic = encodeURIComponent(topicCovered || '');
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
          : typeof window !== 'undefined' && window.location?.hostname
          ? `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}:3000/api/v1`
          : 'http://127.0.0.1:3000/api/v1';

        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('accessToken') || localStorage.getItem('token') || '')
          : '';
        const headers: Record<string, string> = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const uploadEndpoints = [
          `${apiBaseUrl}/live-classes/${classId}/upload-recording?durationSeconds=${exactDurationSecs}&topicCovered=${encodedTopic}`,
          `/api/v1/live-classes/${classId}/upload-recording?durationSeconds=${exactDurationSecs}&topicCovered=${encodedTopic}`,
        ];

        for (const url of uploadEndpoints) {
          try {
            const res = await fetch(url, { method: 'POST', body: formData, headers });
            if (res.ok) {
              console.log('Recorded class video uploaded successfully to:', url);
              break;
            }
          } catch (err) {
            console.warn(`Upload attempt to ${url} failed:`, err);
          }
        }
      } catch (uploadErr) {
        console.warn('Upload recorded class failed:', uploadErr);
      }
    }

    try {
      safeSendRef.current?.({ type: 'class-ended', classId });
      const statusBc = new BroadcastChannel('neet-live-class-status');
      statusBc.postMessage({ type: 'class-ended', classId });
      statusBc.close();
      const joinChannel = new BroadcastChannel('neet-live-join-requests');
      joinChannel.postMessage({ type: 'class-ended', classId });
      joinChannel.close();
    } catch {}

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://127.0.0.1:3000/api/v1';
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || localStorage.getItem('token') || '')
        : '';
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch(`${apiBaseUrl}/live-classes/${classId}/end`, { method: 'POST', headers });
    } catch {}

    stopMediaTracksRef.current?.();
    toast.success('✅ Class ended and recording saved! Redirecting...');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/tutor';
      }
    }, 800);
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

  // Ensure initial cutoff is always at least 2 hours in the future for an active live studio session
  const initialEndMs = parseEndMs(scheduledEnd);
  const initialCutoff = (initialEndMs && initialEndMs > Date.now())
    ? initialEndMs + 15 * 60 * 1000
    : Date.now() + 2 * 60 * 60 * 1000;

  const targetCutoffMsRef = useRef<number>(initialCutoff);

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
              if (data.status === 'CANCELLED') {
                autoEndingRef.current = true;
                toast.info('⏱ Live class has been cancelled.');
                confirmEndClass();
                return;
              }

              const endVal = data?.scheduledEnd || scheduledEnd;
              const endMs = parseEndMs(endVal);
              if (endMs && endMs > Date.now()) {
                targetCutoffMsRef.current = endMs + 15 * 60 * 1000;
              } else {
                // If end time is past or class is LIVE, give a fresh 2-hour window
                targetCutoffMsRef.current = Date.now() + 2 * 60 * 60 * 1000;
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

  // ── Admitted local state tracking — SESSION ONLY (cleared every page load to force fresh admission)
  const [admittedStudents, setAdmittedStudents] = useState<Array<{ id: string; name: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        // Use sessionStorage so admissions reset on each page load/refresh
        const saved = sessionStorage.getItem(`tutor_admitted_students_${classId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // On mount: clear any stale localStorage admission data so returning students
  // are never accidentally skipped from the pending requests queue
  useEffect(() => {
    try {
      localStorage.removeItem(`tutor_admitted_students_${classId}`);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Automatically Detect Remote Participants in Waiting Room
  useEffect(() => {
    remoteParticipants.forEach((p) => {
      const pName = (p.name || p.identity || 'Student').trim();
      const isAdmitted = admittedStudents.some(
        (s) => s.id === p.sid || s.id === p.identity || s.name.toLowerCase() === pName.toLowerCase()
      );
      if (!isAdmitted) {
        setPendingRequests((prev) => {
          if (prev.some((r) => r.id === p.sid || r.id === p.identity || r.name.toLowerCase() === pName.toLowerCase())) {
            return prev;
          }
          return [
            ...prev,
            {
              id: p.sid,
              name: pName,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      }
    });
  }, [remoteParticipants, admittedStudents]);

  // ── API Polling: Cross-device join request fallback (every 2s)
  useEffect(() => {
    const pollJoinRequests = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}/join-requests`, { skipGlobalToast: true });
        const requests: Array<{ id: string; name: string; time: string }> = data?.requests || [];
        requests.forEach((req) => {
          const normName = req.name.trim().toLowerCase();
          const isAdmitted = admittedStudents.some(
            (s) => s.id === req.id || s.name.toLowerCase() === normName
          );
          if (!isAdmitted) {
            setPendingRequests((prev) => {
              if (prev.some((r) => r.id === req.id || r.name.toLowerCase() === normName)) return prev;
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
      const isHost = p.identity.startsWith('host-') || displayName.toLowerCase().includes('teacher') || displayName.toLowerCase().includes('host');
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
  const [activePdfDoc, setActivePdfDoc] = useState<PdfDocumentInfo | null>(null);
  const [pdfPage, setPdfPage] = useState<number>(1);

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
  const activePdfDocRef = useRef(activePdfDoc);
  const pdfPageRef = useRef(pdfPage);
  const whiteboardFrameRef = useRef<string | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    isScreenSharingRef.current = isScreenSharing;
    isMicOnRef.current = isMicOn;
    activePdfDocRef.current = activePdfDoc;
    pdfPageRef.current = pdfPage;
  }, [mode, isScreenSharing, isMicOn, activePdfDoc, pdfPage]);

  const [screenFrame, setScreenFrame] = useState<string | null>(null);
  const [tutorCamFrame, setTutorCamFrame] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // ── UI States
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'attendance'>('chat');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pinnedParticipant, setPinnedParticipant] = useState<{ id: string; name: string; isHost: boolean } | null>(null);
  const [raisedHands, setRaisedHands] = useState<Array<{ id: string; name: string; time: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ id: string; name: string; time: string }>>([]);
  // Active speaking states for audio visualizer ripples & popups
  const [speakingUser, setSpeakingUser] = useState<string | null>(null);
  const [isSelfSpeaking, setIsSelfSpeaking] = useState(false);

  // ── Attendance Sheet State & Handlers
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
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const qParams = new URLSearchParams();
      if (sessionTypeParam) qParams.set('sessionType', sessionTypeParam);
      if (studentNameParam) qParams.set('studentName', studentNameParam);
      if (studentAdmissionIdParam) qParams.set('studentAdmissionId', studentAdmissionIdParam);
      const qs = qParams.toString() ? `?${qParams.toString()}` : '';

      const endpoints = [
        `/api/v1/live-classes/${classId}/attendance${qs}`,
        `http://${host}:3000/api/v1/live-classes/${classId}/attendance${qs}`,
        `/v1/live-classes/${classId}/attendance${qs}`,
        `http://${host}:3000/v1/live-classes/${classId}/attendance${qs}`,
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const payload = data?.data ?? data;
            let rawStudents = payload.students || [];

            const is1on1 = sessionTypeParam === 'ONE_TO_ONE' || Boolean(studentNameParam) || Boolean(studentAdmissionIdParam);

            if (is1on1 && rawStudents.length > 0) {
              if (studentAdmissionIdParam) {
                const match = rawStudents.filter((s: any) => s.studentAdmissionId === studentAdmissionIdParam);
                if (match.length > 0) rawStudents = match;
                else rawStudents = rawStudents.slice(0, 1);
              } else if (studentNameParam) {
                const match = rawStudents.filter((s: any) => s.studentName.toLowerCase().includes(studentNameParam.toLowerCase()));
                if (match.length > 0) rawStudents = match;
                else rawStudents = rawStudents.slice(0, 1);
              } else {
                rawStudents = rawStudents.slice(0, 1);
              }
            }

            setAttendanceData({
              sessionId: payload.sessionId,
              batchName: payload.batchName,
              subjectName: payload.subjectName,
              students: rawStudents,
            });
            break;
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to fetch attendance sheet:', err);
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
      toast.warning('Please select attendance (P / A / L) for at least one student before saving.');
      return;
    }
    try {
      setAttendanceSaving(true);
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const records = markedStudents.map((st) => ({
        studentAdmissionId: st.studentAdmissionId,
        attendanceStatus: st.attendanceStatus,
      }));

      const accessToken = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || localStorage.getItem('token') || '')
        : '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      const endpoints = [
        `/api/v1/live-classes/${classId}/attendance`,
        `http://${host}:3000/api/v1/live-classes/${classId}/attendance`,
        `/v1/live-classes/${classId}/attendance`,
        `http://${host}:3000/v1/live-classes/${classId}/attendance`,
      ];

      let success = false;

      try {
        await api.post(`/live-classes/${classId}/attendance`, { records }, { skipGlobalToast: true });
        success = true;
      } catch {
        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({ records }),
            });
            if (res.ok) {
              success = true;
              break;
            }
          } catch {}
        }
      }

      if (success) {
        toast.success('Attendance saved & synced across Admin, Student & Parent portals! 🚀');
      } else {
        toast.error('Failed to save attendance');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Error saving attendance');
    } finally {
      setAttendanceSaving(false);
    }
  };

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
      } else if (data.type === 'join-request') {
        setPendingRequests((prev) => {
          if (prev.some((req) => req.id === data.id)) return prev;
          return [...prev, { id: data.id, name: data.name, time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
        });
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

  const admitStudent = async (studentId: string, studentName?: string) => {
    const nameToAdmit = studentName || 'Student';
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
    setAdmittedStudents((prev) => {
      let updated = prev;
      if (!prev.some((s) => s.id === studentId || s.name === nameToAdmit)) {
        updated = [...prev, { id: studentId, name: nameToAdmit }];
      }
      try {
        // sessionStorage only — resets on page refresh so fresh admission is always required
        sessionStorage.setItem(`tutor_admitted_students_${classId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      safeSend({ type: 'join-approved', studentId, classId });
      // BroadcastChannel for same-browser instant notify
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-approved', studentId, classId });
      ch.close();
      const statusBc = new BroadcastChannel('neet-live-class-status');
      statusBc.postMessage({ type: 'class-reopened', classId });
      statusBc.close();
      // Remove from server-side join request store (cross-device)
      api.delete(`/live-classes/${classId}/join-requests/${encodeURIComponent(studentId)}?action=admit`, { skipGlobalToast: true }).catch(() => {});
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
        api.delete(`/live-classes/${classId}/join-requests/${encodeURIComponent(st.id)}?action=admit`, { skipGlobalToast: true }).catch(() => {});
      });
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-approved', studentId: 'all', classId });
      ch.close();
      const statusBc = new BroadcastChannel('neet-live-class-status');
      statusBc.postMessage({ type: 'class-reopened', classId });
      statusBc.close();
      toast.success(`✅ All ${pendingList.length} students admitted`);
    } catch {}
  };

  const denyStudent = (studentId: string, studentName?: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
    try {
      safeSend({ type: 'join-denied', studentId, classId });
      // localStorage signal for cross-tab sync
      localStorage.setItem(`class_${classId}_denied_${studentId}`, 'true');
      const ch = new BroadcastChannel('neet-live-join-requests');
      ch.postMessage({ type: 'join-denied', studentId, classId });
      ch.close();
      // Remove from server-side store
      api.delete(`/live-classes/${classId}/join-requests/${encodeURIComponent(studentId)}?action=deny`, { skipGlobalToast: true }).catch(() => {});
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
      api.delete(`/live-classes/${classId}/join-requests/all?action=deny`, { skipGlobalToast: true }).catch(() => {});
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
          modeSyncChannel.postMessage({
            type: 'current-mode',
            mode: isScreenSharingRef.current ? 'screen' : modeRef.current,
            classId,
            doc: activePdfDocRef.current,
            pdfPage: pdfPageRef.current,
          });
          if (isScreenSharingRef.current && screenFrameRef.current) {
            broadcastRef.current?.postMessage({ type: 'frame', frame: screenFrameRef.current });
          }
          if (tutorCamFrameRef.current) {
            camBroadcastRef.current?.postMessage({ type: 'cam-frame', frame: tutorCamFrameRef.current });
          }
          if (whiteboardFrameRef.current) {
            const wbBc = new BroadcastChannel('neet-live-whiteboard');
            wbBc.postMessage({ type: 'whiteboard-frame', frame: whiteboardFrameRef.current, classId });
            wbBc.close();
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



  // ── Whiteboard Frame Broadcast to Connected Students
  const handleWhiteboardFrame = useCallback((frame: string) => {
    whiteboardFrameRef.current = frame;
    safeSend({ type: 'whiteboard-frame', frame });
    try {
      const bc = new BroadcastChannel('neet-live-whiteboard-sync');
      bc.postMessage({ type: 'whiteboard-frame', frame, classId });
      bc.close();
    } catch {}
  }, [safeSend, classId]);

  // ── Periodic heartbeat sync so any student entering or refreshing gets current mode & frames
  useEffect(() => {
    const syncInterval = setInterval(() => {
      safeSend({
        type: 'mode-sync',
        mode: modeRef.current,
        doc: activePdfDocRef.current,
        pdfPage: pdfPageRef.current,
        whiteboardFrame: whiteboardFrameRef.current,
        isMicOn: isMicOnRef.current,
      });
    }, 1500);
    return () => clearInterval(syncInterval);
  }, [safeSend]);

  // ── Broadcast Mode Change to Students
  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'screen' && !isScreenSharing) {
      startScreenShare();
    }
    safeSend({ type: 'mode-change', mode: newMode, pdfPage, doc: activePdfDoc });
    try {
      const modeBc = new BroadcastChannel('neet-live-mode-sync');
      modeBc.postMessage({ type: 'mode-change', mode: newMode, classId, pdfPage, doc: activePdfDoc });
      modeBc.close();
    } catch {}
  };

  const handlePdfPageChange = (page: number) => {
    setPdfPage(page);
    safeSend({ type: 'pdf-page-change', page, doc: activePdfDoc });
    try {
      const bc = new BroadcastChannel('neet-live-pdf-sync');
      bc.postMessage({ type: 'pdf-sync', page, doc: activePdfDoc, classId });
      bc.close();
    } catch {}
  };

  const handlePdfDocChange = (doc: PdfDocumentInfo) => {
    setActivePdfDoc(doc);
    setPdfPage(1);
    safeSend({ type: 'pdf-doc-change', doc, page: 1 });
    try {
      const bc = new BroadcastChannel('neet-live-pdf-sync');
      bc.postMessage({ type: 'pdf-sync', page: 1, doc, classId });
      bc.close();
    } catch {}
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
    isMicOnRef.current = next;
    if (recordingAudioTrackRef.current) {
      recordingAudioTrackRef.current.enabled = next;
    }
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
      setScreenShareReason('Screen sharing is not supported by this browser. Use Whiteboard or PDF presentation.');
    } else {
      setCanScreenShare(true);
      setScreenShareReason('');
    }
  }, []);

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

      const res = await getScreenMediaStream();
      if (!res.stream) {
        if (res.isCancelled) {
          toast.info('Screen share was cancelled.');
        } else if (res.isUnsupported) {
          toast.error(res.error || 'Screen capture not supported on this connection.');
        } else {
          toast.error(res.error || 'Screen share could not be started.');
        }
        stopScreenShare();
        return;
      }

      const stream = res.stream;
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setMode('screen');
      safeSend({ type: 'mode-change', mode: 'screen', pdfPage });
      toast.success('📱 Screen Sharing Active! Switch to any app/window to present.');

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
          safeSend({ type: 'screen-frame', frame });
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

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ── Top Header Bar ── */}
      <header className="h-12 sm:h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 shadow-md gap-2">
        {/* Left: Brand + Live badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-extrabold text-white tracking-tight hidden xs:block">Connect Meet</h1>
          <span className="hidden lg:block text-xs text-slate-400 font-medium truncate max-w-[120px]">({classTitle})</span>
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
          {/* Screen Record button — desktop and mobile */}
          <button
            onClick={requestStudioScreenShare}
            type="button"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black transition-all shadow-sm cursor-pointer shrink-0 ${
              isScreenRecordingActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-violet-600 hover:bg-violet-700 text-white animate-pulse'
            }`}
            title="Click to record class, whiteboard & camera"
          >
            <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{isScreenRecordingActive ? '🔴 Rec Active' : '🔴 Record Class'}</span>
          </button>
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
          <button onClick={() => changeMode('idle')} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition ${ mode === 'idle' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700' }`}>
            <Grid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Grid</span>
          </button>
          <button onClick={() => changeMode('whiteboard')} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition ${ mode === 'whiteboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700' }`}>
            <PenTool className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Board</span>
          </button>
        </div>

        {/* Right: Avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {tutorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[80px] truncate">{tutorName}</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden relative p-2 sm:p-3 lg:p-4 gap-0 lg:gap-4 bg-slate-950">
        {/* Left Main Stage Container */}
        <div className="flex-1 h-full bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 flex flex-col relative overflow-hidden shadow-inner min-w-0">

          {/* ── Prominent Floating Join Request Alert Banner (Mobile & Desktop) ── */}
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
                  {(() => {
                    const hostCamPub = localParticipant.getTrackPublication(Track.Source.Camera);
                    const hasHostCam = isCamOn && hostCamPub && !hostCamPub.isMuted && hostCamPub.track;

                    return (
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
                        ) : hasHostCam ? (
                          <VideoTrack
                            trackRef={{ participant: localParticipant, source: Track.Source.Camera, publication: hostCamPub }}
                            className="w-full h-full object-cover scale-x-[-1]"
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
                          <div className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md ${hasHostCam || isCamOn ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300' : 'bg-slate-800/80 border border-slate-700 text-slate-400'}`}>
                            {hasHostCam || isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
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
                    );
                  })()}

                  {/* 2. Student Video Tiles */}
                  {combinedStudentList.map((p, idx) => {
                    const rp = remoteParticipants.find((r) => r.sid === p.id || r.name === p.name);
                    const rpCamPub = rp?.getTrackPublication(Track.Source.Camera);
                    const hasRpCam = rpCamPub && !rpCamPub.isMuted && rpCamPub.track;

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
                      : rp?.isMicrophoneEnabled ?? false;

                    const isStudentCamOn = Boolean(
                      hasRpCam ||
                      studentCam ||
                      rp?.isCameraEnabled
                    );

                    const isHand = raisedHands.some((h) => h.name.toLowerCase() === p.name.toLowerCase());
                    const isSharingScreen = studentScreen && (studentScreen.name.toLowerCase() === p.name.toLowerCase() || p.name.includes(studentScreen.name));
                    
                    return (
                      <div key={p.id || idx} className={`aspect-video bg-slate-900 border rounded-2xl overflow-hidden relative shadow-xl flex flex-col items-center justify-center group hover:border-slate-700 transition ${isSharingScreen ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/30' : isStudentMicOn ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20' : 'border-slate-800/90'}`}>
                        {hasRpCam && rp ? (
                          <VideoTrack
                            trackRef={{ participant: rp, source: Track.Source.Camera, publication: rpCamPub }}
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : studentScreen ? (
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
          {/* Mode 3: Screen Share */}
          {mode === 'screen' && (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-2 sm:p-4">
              {/* Top Banner Control Bar for Stop Screen Sharing */}
              {(isScreenSharing || screenFrame || screenStreamRef.current) && (
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
                  className="w-full h-full object-contain rounded-xl border border-slate-800 shadow-2xl max-h-[85vh]"
                />
              ) : screenFrame ? (
                <img
                  src={screenFrame}
                  className="w-full h-full object-contain rounded-xl border border-slate-800 shadow-2xl max-h-[85vh]"
                  alt="Screen Share"
                />
              ) : screenTracks.length > 0 ? (
                <VideoTrack
                  trackRef={(activeScreenTrack || screenTracks[0]) as any}
                  className="w-full h-full object-contain rounded-xl border border-slate-800"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-slate-500 p-6 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-xl">
                    <Monitor className="w-8 h-8 animate-pulse text-blue-400" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-200 mb-1">
                      {canScreenShare ? 'Screen Share Ready' : 'Screen Share Not Available'}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {canScreenShare
                        ? 'Share your entire screen, window, or tab live with all participants.'
                        : (screenShareReason || 'Screen sharing is not supported by this browser. Use Live Whiteboard or PDF presentation.')}
                    </p>
                  </div>
                  {canScreenShare ? (
                    <button
                      onClick={startScreenShare}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Monitor className="w-4 h-4" /> Start Screen Share
                    </button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => changeMode('whiteboard')}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Open Whiteboard
                      </button>
                      <button
                        onClick={() => setMode('idle')}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Return to Grid
                      </button>
                    </div>
                  )}
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

          {/* Mobile: Floating Waiting Room Admit Banner */}
          {pendingRequests.length > 0 && (
            <div className="lg:hidden mb-2 shrink-0">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-black text-amber-900">Waiting Room ({pendingRequests.length})</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => admitAllStudents(pendingRequests)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition cursor-pointer"
                    >
                      Admit All
                    </button>
                    <button
                      onClick={() => denyAllStudents(pendingRequests)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold transition cursor-pointer"
                    >
                      Deny All
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between bg-white border border-amber-200/80 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{req.name}</p>
                          <p className="text-[10px] text-slate-400">{req.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
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

              {/* Screen Share / Stop Sharing Button (Desktop Only) */}
              <button
                onClick={() => {
                  if (isScreenSharing || mode === 'screen') {
                    stopScreenShare();
                  } else {
                    startScreenShare();
                  }
                }}
                title={isScreenSharing || mode === 'screen' ? 'Stop Screen Share' : 'Share Screen (Desktop / Laptop)'}
                className={`hidden md:flex px-2.5 sm:px-3 py-2 rounded-full border text-xs font-bold transition shadow-sm items-center gap-1.5 shrink-0 cursor-pointer ${
                  isScreenSharing || mode === 'screen'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isScreenSharing || mode === 'screen' ? 'Stop Share' : 'Share Screen'}
                </span>
              </button>

              {/* Touch Whiteboard (Mobile & Desktop) */}
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

              {/* PDF Presentation (Mobile & Desktop) */}
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
                className={`w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center shadow-sm transition shrink-0 ${
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
                className={`relative w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center shadow-sm transition shrink-0 ${
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
                className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 ${
                  activeTab === 'attendance' && (showSidebar || showMobileDrawer)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
              </button>

              {/* Mobile: Record Screen compact pill */}
              <button
                onClick={requestStudioScreenShare}
                type="button"
                title="Record Studio Screen"
                className={`sm:hidden w-9 h-9 rounded-full border flex items-center justify-center shadow-sm transition shrink-0 ${
                  isScreenRecordingActive
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-violet-600 text-white border-violet-500 animate-pulse'
                }`}
              >
                {isScreenRecordingActive ? <span className="text-[9px] font-black">🔴</span> : <Video className="w-3.5 h-3.5" />}
              </button>

              {/* End Call */}
              <button onClick={() => setShowEndModal(true)}
                className="px-3 sm:px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md flex items-center gap-1 shrink-0">
                End
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

            {/* Attendance Sheet Tab */}
            {activeTab === 'attendance' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Summary Header */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                      📋 Attendance Sheet
                    </span>
                    <button
                      onClick={handleMarkAllPresent}
                      className="text-[10px] font-bold text-violet-700 hover:text-violet-900 bg-violet-100 hover:bg-violet-200 px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      Mark All Present
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-slate-200/80 gap-1 overflow-x-auto">
                    <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                      🟢 P: {attendanceData.students.filter((s) => s.attendanceStatus === 'PRESENT').length}
                    </span>
                    <span className="text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                      🔴 A: {attendanceData.students.filter((s) => s.attendanceStatus === 'ABSENT').length}
                    </span>
                    <span className="text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                      🟡 L: {attendanceData.students.filter((s) => s.attendanceStatus === 'LATE').length}
                    </span>
                    <span className="text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded-md shrink-0">
                      ⚪ None: {attendanceData.students.filter((s) => !s.attendanceStatus).length}
                    </span>
                  </div>
                </div>

                {/* Enrolled Students List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {attendanceLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                      <span className="text-xs font-bold">Loading Enrolled Students...</span>
                    </div>
                  ) : attendanceData.students.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      No enrolled students found.
                    </div>
                  ) : (
                    attendanceData.students.map((st) => (
                      <div
                        key={st.studentAdmissionId}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-black text-slate-900 truncate">{st.studentName}</p>
                          <p className="text-[10px] font-semibold text-slate-400 font-mono">Roll: {st.admissionNumber}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleStudentStatus(st.studentAdmissionId, 'PRESENT')}
                            className={cn(
                              'w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center',
                              st.attendanceStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                            )}
                            title="Mark Present"
                          >
                            P
                          </button>
                          <button
                            onClick={() => toggleStudentStatus(st.studentAdmissionId, 'ABSENT')}
                            className={cn(
                              'w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center',
                              st.attendanceStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                            )}
                            title="Mark Absent"
                          >
                            A
                          </button>
                          <button
                            onClick={() => toggleStudentStatus(st.studentAdmissionId, 'LATE')}
                            className={cn(
                              'w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center',
                              st.attendanceStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                            )}
                            title="Mark Late"
                          >
                            L
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Save & Sync Button */}
                <div className="pt-2 border-t border-slate-100 shrink-0">
                  <button
                    onClick={handleSaveAttendance}
                    disabled={attendanceSaving || attendanceData.students.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-violet-500/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {attendanceSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ClipboardList className="w-4 h-4" />
                    )}
                    <span>Save & Sync Attendance 🚀</span>
                  </button>
                </div>
              </div>
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
              <button onClick={() => setActiveTab('participants')} className={`flex-1 py-3 text-center border-b-2 transition ${ activeTab === 'participants' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500' }`}>
                <Users className="w-4 h-4 inline mr-1" />Participants
              </button>
              <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-center border-b-2 transition ${ activeTab === 'chat' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500' }`}>
                <MessageSquare className="w-4 h-4 inline mr-1" />Chat
              </button>
              <button onClick={() => setActiveTab('attendance')} className={`flex-1 py-3 text-center border-b-2 transition ${ activeTab === 'attendance' ? 'border-violet-600 text-violet-600 font-bold' : 'border-transparent text-slate-500' }`}>
                <ClipboardList className="w-4 h-4 inline mr-1" />Attendance
              </button>
              <button onClick={() => setShowMobileDrawer(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {/* Mobile Pending Requests Section */}
                  {pendingRequests.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Waiting to Join ({pendingRequests.length})
                        </span>
                        {pendingRequests.length > 1 && (
                          <button
                            onClick={() => admitAllStudents(pendingRequests)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black transition cursor-pointer"
                          >
                            Admit All
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {pendingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 truncate">{req.name}</p>
                              <span className="text-[10px] text-slate-400">{req.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => admitStudent(req.id, req.name)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Admit
                              </button>
                              <button
                                onClick={() => denyStudent(req.id, req.name)}
                                className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
              {activeTab === 'attendance' && (
                <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                        📋 Attendance Sheet
                      </span>
                      <button
                        onClick={handleMarkAllPresent}
                        className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded-lg transition cursor-pointer"
                      >
                        Mark All Present
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-slate-200/80 gap-1 overflow-x-auto">
                      <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                        🟢 P: {attendanceData.students.filter((s) => s.attendanceStatus === 'PRESENT').length}
                      </span>
                      <span className="text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                        🔴 A: {attendanceData.students.filter((s) => s.attendanceStatus === 'ABSENT').length}
                      </span>
                      <span className="text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                        🟡 L: {attendanceData.students.filter((s) => s.attendanceStatus === 'LATE').length}
                      </span>
                      <span className="text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded-md shrink-0">
                        ⚪ None: {attendanceData.students.filter((s) => !s.attendanceStatus).length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {attendanceLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                        <span className="text-xs font-bold">Loading Students...</span>
                      </div>
                    ) : attendanceData.students.length === 0 ? (
                      <div className="p-5 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No enrolled students found.
                      </div>
                    ) : (
                      attendanceData.students.map((st) => (
                        <div
                          key={st.studentAdmissionId}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-black text-slate-900 truncate">{st.studentName}</p>
                            <p className="text-[10px] font-semibold text-slate-400 font-mono">Roll: {st.admissionNumber}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleStudentStatus(st.studentAdmissionId, 'PRESENT')}
                              className={cn(
                                'w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center',
                                st.attendanceStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-500',
                              )}
                            >
                              P
                            </button>
                            <button
                              onClick={() => toggleStudentStatus(st.studentAdmissionId, 'ABSENT')}
                              className={cn(
                                'w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center',
                                st.attendanceStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-500',
                              )}
                            >
                              A
                            </button>
                            <button
                              onClick={() => toggleStudentStatus(st.studentAdmissionId, 'LATE')}
                              className={cn(
                                'w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center',
                                st.attendanceStatus === 'LATE'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-500',
                              )}
                            >
                              L
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 shrink-0">
                    <button
                      onClick={handleSaveAttendance}
                      disabled={attendanceSaving || attendanceData.students.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-violet-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {attendanceSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ClipboardList className="w-4 h-4" />
                      )}
                      <span>Save & Sync Attendance 🚀</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Professional End Class & Today's Topic Covered Modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 max-w-md w-[94%] sm:w-full shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center shrink-0 shadow-2xs">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">Finish Session & Save</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-mono">Class ID: {classId}</p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                📝 Today's Topic Covered:
              </label>
              <input
                type="text"
                placeholder="e.g. Newton's Laws of Motion, Rotational Dynamics"
                value={todayTopicInput}
                onChange={(e) => setTodayTopicInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition font-bold"
              />
              <p className="text-[11px] text-slate-500 font-medium leading-snug">
                This topic will be saved and displayed on student & tutor recording cards.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={endingClass}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm transition text-center cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => confirmEndClass(todayTopicInput)}
                disabled={endingClass}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {endingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
                Submit & End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auto-End Grace Period Expired Modal ── */}
      {showAutoEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-[94%] sm:w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 sm:space-y-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shadow-lg animate-bounce shrink-0">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ⏱ Class Grace Time Expired!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                The scheduled class duration and the 15-minute grace period have finished. Would you like to extend this session by <span className="font-extrabold text-violet-600">+15 minutes</span> or end the class now?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full pt-1 sm:pt-2">
              <button
                onClick={handleExtendClass}
                className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 font-extrabold text-xs sm:text-sm border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>End Class Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Studio Screen Recording Authorization Startup Modal ── */}
      {!isScreenRecordingActive && !dismissStudioModal && !showEndModal && !showAutoEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-8 max-w-md w-[94%] sm:w-full shadow-2xl border border-slate-800 flex flex-col items-center text-center space-y-4 sm:space-y-5 relative">
            <button
              onClick={() => setDismissStudioModal(true)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-lg animate-bounce shrink-0">
              <Video className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                🎥 Start Live Class Recording
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Record your full class with whiteboard drawings, student interactions, screen sharing & mic audio. Recordings are automatically saved to the library!
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <button
                onClick={requestStudioScreenShare}
                className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-xl shadow-violet-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Start Class Recording 🚀</span>
              </button>

              <button
                onClick={() => setDismissStudioModal(true)}
                className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-bold transition text-center cursor-pointer"
              >
                Continue Without Recording ➡️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
