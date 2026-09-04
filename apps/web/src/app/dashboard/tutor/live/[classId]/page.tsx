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
  saveRecordingChunk,
  loadAllRecordingChunks,
  clearRecordingChunks,
} from '@/lib/recording-storage';
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [loading, setLoading] = useState(true);

  // ── Top-Level Class Status Checker — Only redirects if class is explicitly CANCELLED
  useEffect(() => {
    const checkStatusOnMount = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}`, { skipGlobalToast: true });
        const cls = data?.data ?? data;
        if (cls && cls.status === 'ENDED') {
          toast.info('⏱ Live class has already ended.');
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/tutor';
          }
        }
        if (cls?.status === 'CANCELLED') {
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
      audio={false}
      video={false}
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

  const isMicRef = useRef(isMicrophoneEnabled);
  const isCamRef = useRef(isCameraEnabled);

  useEffect(() => {
    isMicRef.current = isMicrophoneEnabled;
    isCamRef.current = isCameraEnabled;
  }, [isMicrophoneEnabled, isCameraEnabled]);

  const requestStudioScreenShare = useCallback(async () => {
    try {
      if (studioCanvasAnimRef.current) {
        clearInterval(studioCanvasAnimRef.current);
        studioCanvasAnimRef.current = null;
      }

      let compositeStream: MediaStream | null = null;

      try {
        const compCanvas = document.createElement('canvas');
        compCanvas.width = 1280;
        compCanvas.height = 720;
        const hasCanvasCapture = typeof (compCanvas as any).captureStream === 'function';

        if (hasCanvasCapture) {
          const ctx = compCanvas.getContext('2d', { alpha: false });

          const renderIdleStudioStage = () => {
            if (!ctx) return;
            const cw = compCanvas.width;
            const ch = compCanvas.height;

            // 1. Overall outer canvas background (dark slate-950)
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, cw, ch);

            // 2. Main Studio Container Card (rounded dark card matching the UI)
            const margin = 28;
            const cardX = margin;
            const cardY = margin;
            const cardW = cw - margin * 2;
            const cardH = ch - margin * 2;

            ctx.save();
            ctx.fillStyle = '#090d16'; // Dark slate room background
            ctx.strokeStyle = '#1e293b'; // Border slate-800
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(cardX, cardY, cardW, cardH, 20);
            } else {
              ctx.rect(cardX, cardY, cardW, cardH);
            }
            ctx.fill();
            ctx.stroke();

            // 3. Central Avatar Circle
            const avatarRadius = 65;
            const centerX = cw / 2;
            const centerY = ch / 2 - 35;

            // Outer glowing ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, avatarRadius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Avatar circle fill
            ctx.beginPath();
            ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#7c3aed'; // Vibrant violet
            ctx.fill();

            // Initial letter
            const initialLetter = tutorName.charAt(0).toUpperCase() || 'T';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 56px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initialLetter, centerX, centerY);

            // 4. Tutor Name Label below avatar
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 26px sans-serif';
            ctx.fillText(`${tutorName} (You)`, centerX, centerY + avatarRadius + 35);

            // 5. Host / Tutor Badge Pill below name
            const badgeText = 'HOST / TUTOR';
            ctx.font = '800 12px sans-serif';
            const badgeMetrics = ctx.measureText(badgeText);
            const badgeW = badgeMetrics.width + 28;
            const badgeH = 24;
            const badgeX = centerX - badgeW / 2;
            const badgeY = centerY + avatarRadius + 55;

            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
            } else {
              ctx.rect(badgeX, badgeY, badgeW, badgeH);
            }
            ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#c084fc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, centerX, badgeY + badgeH / 2);

            // 6. Top-Right Stage Badges (Mic & Video status)
            const micPillX = cardX + cardW - 110;
            const micPillY = cardY + 20;

            const micOn = isMicRef.current;
            const camOn = isCamRef.current;

            // Mic Badge
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(micPillX, micPillY, 40, 32, 10);
            } else {
              ctx.rect(micPillX, micPillY, 40, 32);
            }
            ctx.fillStyle = micOn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)';
            ctx.fill();
            ctx.strokeStyle = micOn ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)';
            ctx.stroke();

            ctx.fillStyle = micOn ? '#34d399' : '#f87171';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(micOn ? '🎙' : '🔇', micPillX + 20, micPillY + 16);

            // Cam Badge
            const camPillX = micPillX + 48;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(camPillX, micPillY, 40, 32, 10);
            } else {
              ctx.rect(camPillX, micPillY, 40, 32);
            }
            ctx.fillStyle = camOn ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.8)';
            ctx.fill();
            ctx.strokeStyle = camOn ? 'rgba(139, 92, 246, 0.5)' : 'rgba(51, 65, 85, 0.8)';
            ctx.stroke();

            ctx.fillStyle = camOn ? '#c084fc' : '#94a3b8';
            ctx.fillText(camOn ? '📹' : '📷', camPillX + 20, micPillY + 16);

            // 7. Bottom-Left Participant Badge Pill
            const bgtX = cardX + 20;
            const bgtY = cardY + cardH - 50;

            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(bgtX, bgtY, 180, 36, 14);
            } else {
              ctx.rect(bgtX, bgtY, 180, 36);
            }
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.stroke();

            // Green pulsing dot
            ctx.beginPath();
            ctx.arc(bgtX + 20, bgtY + 18, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#34d399';
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(tutorName, bgtX + 34, bgtY + 18);

            ctx.restore();
          };

          const drawComposite = () => {
            if (!ctx) return;

            const currentMode = modeRef.current;

            if (currentMode === 'whiteboard') {
              // Excalidraw / Whiteboard canvas inside .studio-whiteboard-container
              const wbContainer = document.querySelector('.studio-whiteboard-container');
              const wbCanvas = wbContainer
                ? Array.from(wbContainer.querySelectorAll('canvas')).find(
                    (c) => c !== compCanvas && c.width > 100 && c.height > 100,
                  )
                : null;

              if (wbCanvas) {
                try {
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);
                  const scale = Math.min(
                    compCanvas.width / wbCanvas.width,
                    compCanvas.height / wbCanvas.height,
                  );
                  const w = wbCanvas.width * scale;
                  const h = wbCanvas.height * scale;
                  const x = (compCanvas.width - w) / 2;
                  const y = (compCanvas.height - h) / 2;
                  ctx.drawImage(wbCanvas, x, y, w, h);
                } catch {
                  renderIdleStudioStage();
                }
              } else {
                renderIdleStudioStage();
              }
            } else if (currentMode === 'pdf') {
              // PDF Document canvas or image inside .studio-pdf-container
              const pdfContainer = document.querySelector('.studio-pdf-container');
              const pdfCanvas = pdfContainer
                ? Array.from(pdfContainer.querySelectorAll('canvas')).find(
                    (c) => c !== compCanvas && c.width > 100 && c.height > 100,
                  )
                : null;
              const pdfImg = pdfContainer
                ? (pdfContainer.querySelector(
                    'img[alt*="PDF"], img[alt*="Document"], img[src*="data:image"]',
                  ) as HTMLImageElement | null)
                : null;

              ctx.fillStyle = '#090d16';
              ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

              if (pdfCanvas) {
                try {
                  const scale = Math.min(
                    compCanvas.width / pdfCanvas.width,
                    compCanvas.height / pdfCanvas.height,
                  );
                  const w = pdfCanvas.width * scale;
                  const h = pdfCanvas.height * scale;
                  const x = (compCanvas.width - w) / 2;
                  const y = (compCanvas.height - h) / 2;
                  ctx.drawImage(pdfCanvas, x, y, w, h);
                } catch {
                  renderIdleStudioStage();
                }
              } else if (pdfImg && pdfImg.complete && pdfImg.naturalWidth > 0) {
                try {
                  const scale = Math.min(
                    compCanvas.width / pdfImg.naturalWidth,
                    compCanvas.height / pdfImg.naturalHeight,
                  );
                  const w = pdfImg.naturalWidth * scale;
                  const h = pdfImg.naturalHeight * scale;
                  const x = (compCanvas.width - w) / 2;
                  const y = (compCanvas.height - h) / 2;
                  ctx.drawImage(pdfImg, x, y, w, h);
                } catch {
                  renderIdleStudioStage();
                }
              } else {
                renderIdleStudioStage();
              }
            } else if (currentMode === 'screen') {
              // Active Screen Share Video Element
              const videoEls = Array.from(document.querySelectorAll('video')).filter(
                (v) => v.readyState >= 2 && v.videoWidth > 50,
              );
              if (videoEls.length > 0) {
                const screenVid = videoEls[0];
                try {
                  ctx.fillStyle = '#000000';
                  ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);
                  ctx.drawImage(screenVid, 0, 0, compCanvas.width, compCanvas.height);
                } catch {
                  renderIdleStudioStage();
                }
              } else {
                renderIdleStudioStage();
              }
            } else {
              // Mode: 'idle' (Live Video Grid or Tutor Avatar Stage View)
              const activeVideoTracks = Array.from(document.querySelectorAll('video')).filter(
                (v) =>
                  v.readyState >= 2 &&
                  v.videoWidth > 50 &&
                  v.srcObject &&
                  (v.srcObject as MediaStream).getVideoTracks().some((t) => t.enabled && !t.muted),
              );

              if (activeVideoTracks.length > 0) {
                const mainVid = activeVideoTracks[0];
                try {
                  ctx.fillStyle = '#020617';
                  ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);
                  const scale = Math.min(
                    compCanvas.width / (mainVid.videoWidth || 1280),
                    compCanvas.height / (mainVid.videoHeight || 720),
                  );
                  const w = (mainVid.videoWidth || 1280) * scale;
                  const h = (mainVid.videoHeight || 720) * scale;
                  const x = (compCanvas.width - w) / 2;
                  const y = (compCanvas.height - h) / 2;
                  ctx.drawImage(mainVid, x, y, w, h);
                } catch {
                  renderIdleStudioStage();
                }
              } else {
                renderIdleStudioStage();
              }
            }

            // PIP Camera Box — ONLY drawn when local camera is explicitly enabled by user
            const activeCamVid = Array.from(document.querySelectorAll('video')).find(
              (v) =>
                v.readyState >= 2 &&
                v.srcObject &&
                (v.srcObject as MediaStream).getVideoTracks().some((t) => t.enabled && !t.muted),
            );

            if (activeCamVid && currentMode !== 'idle') {
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
              ctx.drawImage(activeCamVid, pipX, pipY, pipW, pipH);
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
        }
      } catch (err) {
        console.warn('[LiveKit Studio] Studio recording capture init error:', err);
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

      let startTs = Date.now();
      try {
        const storedStart = localStorage.getItem(`tutor_recording_start_${classId}`);
        if (storedStart) {
          startTs = Number(storedStart);
        } else {
          localStorage.setItem(`tutor_recording_start_${classId}`, String(startTs));
        }
      } catch {}
      recordingStartTimeRef.current = startTs;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          saveRecordingChunk(classId, e.data);
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
  }, [classId, tutorName]);

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
        sessionStorage.removeItem(`tutor_admitted_students_${classId}`);
        localStorage.removeItem(`tutor_token_${classId}`);
        sessionStorage.removeItem(`tutor_token_${classId}`);
        localStorage.removeItem(`tutor_wsUrl_${classId}`);
        sessionStorage.removeItem(`tutor_wsUrl_${classId}`);
        sessionStorage.removeItem(`tutor_class_${classId}_mode`);
      } catch {}

      setAdmittedStudents([]);
      setPendingRequests([]);

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

      const persistedChunks = await loadAllRecordingChunks(classId);
      const finalChunks = persistedChunks.length > 0 ? persistedChunks : recordedChunksRef.current;

      if (finalChunks.length > 0) {
        try {
          const mime = chosenMimeTypeRef.current || 'video/mp4';
          const isMp4 = mime.includes('mp4');
          const ext = isMp4 ? '.mp4' : '.webm';
          const blob = new Blob(finalChunks, {
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

          clearRecordingChunks(classId);
          try {
            localStorage.removeItem(`tutor_recording_start_${classId}`);
          } catch {}
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

  const parseEndMs = (endVal: any): number | null => {
    if (!endVal) return null;
    if (endVal instanceof Date) {
      const t = endVal.getTime();
      return !isNaN(t) ? t : null;
    }
    if (typeof endVal === 'number') {
      return !isNaN(endVal) ? endVal : null;
    }
    if (typeof endVal === 'string') {
      const str = endVal.trim();
      // 1. If full ISO timestamp or date format with year >= 2020
      if (str.includes('T') || (str.includes('-') && str.length > 10)) {
        const parsed = new Date(str).getTime();
        if (!isNaN(parsed) && new Date(parsed).getFullYear() >= 2020) {
          return parsed;
        }
      }
      // 2. If time format (e.g. "11:00 AM", "08:00 AM - 11:00 AM", "11:00")
      const targetStr = str.includes('-') ? str.split('-').pop()!.trim() : str;
      const match = targetStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
      if (match) {
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();

        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;

        const d = new Date();
        d.setHours(hrs, mins, 0, 0);
        return d.getTime();
      }

      const fallbackParsed = new Date(str).getTime();
      if (!isNaN(fallbackParsed) && new Date(fallbackParsed).getFullYear() >= 2020) {
        return fallbackParsed;
      }
    }
    return null;
  };

  // ── Scheduled End & 15-Minute Grace Period Auto-End Timer
  const initialEndMs = parseEndMs(scheduledEnd);
  const [autoEndCountdown, setAutoEndCountdown] = useState<string | null>(null);
  const [isNearAutoEnd, setIsNearAutoEnd] = useState(false);
  const [isScheduledEndPassed, setIsScheduledEndPassed] = useState(false);
  const autoEndingRef = useRef(false);

  const scheduledEndMsRef = useRef<number | null>(initialEndMs);
  const graceEndMsRef = useRef<number | null>(initialEndMs ? initialEndMs + 15 * 60 * 1000 : null);

  useEffect(() => {
    const fetchClassInfo = async () => {
      if (autoEndingRef.current) return;
      try {
        const data = await api.get<any>(`/live-classes/${classId}`, { skipGlobalToast: true });
        const classData = data?.data ?? data;
        if (classData?.status === 'CANCELLED' || classData?.status === 'ENDED') {
          autoEndingRef.current = true;
          toast.info('This class has ended.');
          confirmEndClass();
          return;
        }

        const endVal = classData?.scheduledEnd || classData?.endsAt || scheduledEnd;
        const endMs = parseEndMs(endVal);
        if (endMs) {
          scheduledEndMsRef.current = endMs;
          graceEndMsRef.current = endMs + 15 * 60 * 1000;
        }
      } catch {}
    };

    fetchClassInfo();
    const interval = setInterval(fetchClassInfo, 5000);
    return () => clearInterval(interval);
  }, [classId, scheduledEnd, confirmEndClass]);

  useEffect(() => {
    const tick = () => {
      const scheduledEndMs = scheduledEndMsRef.current;
      const graceEndMs = graceEndMsRef.current;
      if (!scheduledEndMs || !graceEndMs) return;

      const now = Date.now();
      const endPassed = now >= scheduledEndMs;
      setIsScheduledEndPassed(endPassed);

      const remainingGraceMs = graceEndMs - now;
      if (remainingGraceMs <= 0) {
        setAutoEndCountdown('0m 00s');
        setIsNearAutoEnd(true);
        if (!autoEndingRef.current) {
          autoEndingRef.current = true;
          toast.warning('This class has ended.');
          confirmEndClass();
        }
        return;
      }

      if (endPassed) {
        const totalSecs = Math.floor(remainingGraceMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setAutoEndCountdown(`Grace: ${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        setIsNearAutoEnd(true);
      } else {
        const remainingEndMs = scheduledEndMs - now;
        const totalSecs = Math.floor(remainingEndMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setAutoEndCountdown(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        setIsNearAutoEnd(remainingEndMs <= 5 * 60 * 1000);
      }
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
        if (endMs) {
          scheduledEndMsRef.current = endMs;
          graceEndMsRef.current = endMs + 15 * 60 * 1000;
        }
      } else {
        const currentEnd = scheduledEndMsRef.current || Date.now();
        scheduledEndMsRef.current = currentEnd + 15 * 60 * 1000;
        graceEndMsRef.current = scheduledEndMsRef.current + 15 * 60 * 1000;
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

  const admittedStudentsRef = useRef(admittedStudents);
  useEffect(() => {
    admittedStudentsRef.current = admittedStudents;
  }, [admittedStudents]);

  // Poll pending join requests via API every 400ms (zero-latency fast sync)
  useEffect(() => {
    const pollJoinRequests = async () => {
      try {
        const data = await api.get<any>(`/live-classes/${classId}/join-requests`, {
          skipGlobalToast: true,
        });
        const activeRequests: Array<{ id: string; name: string; time: string }> =
          data?.requests || [];

        // If an active pending request is returned by backend, clear it from local admittedStudents if present (handles re-joins after cancel/deny)
        if (activeRequests.length > 0) {
          setAdmittedStudents((prev) => {
            const hasRejoiningStudent = activeRequests.some((req) => {
              const normName = req.name.trim().toLowerCase();
              return prev.some((s) => s.id === req.id || s.name.toLowerCase() === normName);
            });
            if (!hasRejoiningStudent) return prev;
            const updated = prev.filter((s) => {
              const sNorm = s.name.toLowerCase();
              return !activeRequests.some(
                (r) => r.id === s.id || r.name.trim().toLowerCase() === sNorm,
              );
            });
            try {
              sessionStorage.setItem(`tutor_admitted_students_${classId}`, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        // Deduplicate activeRequests strictly by normalized name and ID
        const uniqueRequests: Array<{ id: string; name: string; time: string }> = [];
        const seenNames = new Set<string>();
        const seenIds = new Set<string>();

        activeRequests.forEach((r) => {
          const normName = (r.name || '').trim().toLowerCase();
          if (r.id && normName && !seenNames.has(normName) && !seenIds.has(r.id)) {
            seenNames.add(normName);
            seenIds.add(r.id);
            uniqueRequests.push({ id: r.id, name: r.name.trim(), time: r.time });
          }
        });

        setPendingRequests(uniqueRequests);
      } catch {}
    };

    pollJoinRequests();
    const interval = setInterval(pollJoinRequests, 400);
    return () => clearInterval(interval);
  }, [classId]);

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

    // Show ONLY students currently active in the LiveKit room session
    remoteParticipants.forEach((p) => {
      const displayName = (p.name || p.identity || 'Student').trim();
      const isHost =
        p.identity.startsWith('host-') ||
        p.identity.startsWith('tutor-') ||
        displayName.toLowerCase().includes('teacher') ||
        displayName.toLowerCase().includes('host') ||
        displayName.toLowerCase().includes('tutor');

      if (!isHost) {
        const matchedDbP = dbParticipants.find(
          (dbP) => dbP.id === p.identity || dbP.name.toLowerCase() === displayName.toLowerCase(),
        );
        addIfNew(p.sid, displayName, matchedDbP?.admissionNumber);
      }
    });

    return list;
  }, [remoteParticipants, dbParticipants]);

  // ── Authoritative LiveKit Track Collections
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const hostCamTrack = cameraTracks.find((t) => t.participant.isLocal);
  const activeScreenTrack = screenTracks[0];

  const [mode, setMode] = useState<Mode>('idle');

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
  const [activeTab, setActiveTab] = useState<'participants' | 'attendance'>('participants');
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
          {/* Floating Waiting Room Join Request Banner — Shown strictly when sidebar/drawer is closed */}
          {!showSidebar && !showMobileDrawer && pendingRequests.length > 0 && (
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
                  ) : (
                    (() => {
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
                    })()
                  )}

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
              ) : combinedStudentList.length === 0 ? (
                /* ── 1. Single Participant View (Host Alone) ── */
                <div className="flex-1 w-full h-full min-h-0 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-2xl flex flex-col items-center justify-center group p-4">
                  {isScreenShareEnabled && screenTracks.find((t) => t.participant.isLocal) ? (
                    <VideoTrack
                      trackRef={screenTracks.find((t) => t.participant.isLocal)!}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : isCameraEnabled &&
                    hostCamTrack &&
                    hostCamTrack.publication?.track &&
                    !hostCamTrack.publication.isMuted ? (
                    <VideoTrack
                      trackRef={hostCamTrack}
                      className="w-full h-full object-cover rounded-xl scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center my-auto">
                      <div
                        className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full text-white flex items-center justify-center font-extrabold text-2xl sm:text-4xl shadow-2xl transition ${
                          localParticipant.isSpeaking
                            ? 'bg-emerald-500/20 border-4 border-emerald-400 text-emerald-400 animate-pulse'
                            : 'bg-violet-600 border-4 border-violet-400/40'
                        }`}
                      >
                        {tutorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base sm:text-xl font-extrabold text-slate-100">
                          {tutorName} (You)
                        </p>
                        <span className="inline-block text-[11px] font-extrabold text-violet-400 uppercase tracking-widest px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                          Host / Tutor
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Top Right Badges */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-10">
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                        isMicrophoneEnabled
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {isMicrophoneEnabled ? (
                        <Mic className="w-4 h-4" />
                      ) : (
                        <MicOff className="w-4 h-4" />
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
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md shadow-md ${
                        isCameraEnabled
                          ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                          : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                      }`}
                    >
                      {isCameraEnabled ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <VideoOff className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Participant Floating Badge */}
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800/80 flex items-center gap-2.5 z-10 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-100">{tutorName}</span>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                      Host
                    </span>
                  </div>
                </div>
              ) : (
                /* ── 2. Standard Multi-Party Video Grid (2+ participants) ── */
                <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto pr-1 content-start h-full">
                  {/* 1. Host (Teacher) Video Tile */}
                  <div
                    className={`aspect-video bg-slate-900 border transition-all duration-300 rounded-2xl overflow-hidden relative shadow-xl flex flex-col items-center justify-center group ${
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
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center font-extrabold text-sm shadow-md transition ${
                            localParticipant.isSpeaking
                              ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-pulse'
                              : 'bg-violet-600 border border-violet-400/40'
                          }`}
                        >
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 truncate max-w-[120px]">
                          {tutorName} (You)
                        </span>
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
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1 rounded-md border border-slate-600 shadow-md z-10 cursor-pointer"
                      title="Spotlight Full Screen"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>

                    {/* Top Right Badges */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      <div
                        className={`p-1 rounded-md text-[10px] font-bold backdrop-blur-md flex items-center gap-1 ${
                          isMicrophoneEnabled
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {isMicrophoneEnabled ? (
                          <Mic className="w-3 h-3" />
                        ) : (
                          <MicOff className="w-3 h-3" />
                        )}
                        {isMicrophoneEnabled && localParticipant.isSpeaking && (
                          <span className="flex gap-0.5 items-end h-2.5">
                            <span className="w-0.5 h-2 bg-emerald-400 animate-bounce" />
                            <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce delay-75" />
                          </span>
                        )}
                      </div>
                      <div
                        className={`p-1 rounded-md text-[10px] font-bold backdrop-blur-md ${
                          isCameraEnabled
                            ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                            : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {isCameraEnabled ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <VideoOff className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Participant Label */}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800/80 flex items-center justify-between z-10 text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="font-bold text-slate-100 truncate">{tutorName}</span>
                      </div>
                      <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/20 shrink-0">
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
                        className={`aspect-video bg-slate-900 border rounded-2xl overflow-hidden relative shadow-xl flex flex-col items-center justify-center group hover:border-slate-700 transition ${
                          studentScreenTrack
                            ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/30'
                            : isSpeaking
                              ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/20'
                              : 'border-slate-800/90'
                        }`}
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
                          <div className="flex flex-col items-center gap-1 text-center">
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-300 flex items-center justify-center font-extrabold text-sm border ${
                                isSpeaking
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                                  : 'bg-slate-800 border-slate-700'
                              }`}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[120px]">
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
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/70 hover:bg-black text-white p-1 rounded-md border border-slate-600 shadow-md z-10 cursor-pointer"
                          title="Spotlight Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Top Right Badges */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                          {isHand && (
                            <div
                              className="p-1 rounded-md bg-amber-500 text-slate-950 font-bold shadow-md animate-bounce"
                              title="Hand Raised"
                            >
                              <Hand className="w-3 h-3" />
                            </div>
                          )}
                          {studentScreenTrack && (
                            <div className="p-1 rounded-md bg-emerald-500 text-slate-950 font-bold shadow-md flex items-center gap-1">
                              <Monitor className="w-3 h-3 animate-pulse" />
                              <span className="text-[9px]">Sharing</span>
                            </div>
                          )}
                          <div
                            className={`p-1 rounded-md text-[10px] font-bold backdrop-blur-md flex items-center gap-1 ${
                              isStudentMicOn
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                                : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                            }`}
                          >
                            {isStudentMicOn ? (
                              <Mic className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <MicOff className="w-3 h-3 text-rose-400" />
                            )}
                          </div>
                          <div
                            className={`p-1 rounded-md text-[10px] font-bold backdrop-blur-md ${
                              isStudentCamOn
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                            }`}
                          >
                            {isStudentCamOn ? (
                              <Video className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <VideoOff className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Bottom Label */}
                        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800/80 flex items-center justify-between z-10 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isStudentMicOn || isStudentCamOn || studentScreenTrack
                                  ? 'bg-emerald-400 animate-pulse'
                                  : 'bg-slate-600'
                              }`}
                            />
                            <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-bold font-mono shrink-0">
                            {studentScreenTrack
                              ? 'Sharing'
                              : isStudentMicOn
                                ? 'Mic On'
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
            <div className="bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl px-3 sm:px-6 py-2 rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-3 max-w-full overflow-x-auto text-slate-100">
              {/* Mic */}
              <button
                onClick={toggleMic}
                title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition shrink-0 cursor-pointer ${
                  isMicrophoneEnabled
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40 shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {isMicrophoneEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Camera */}
              <button
                onClick={toggleCam}
                title={isCameraEnabled ? 'Stop Video' : 'Start Video'}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition shrink-0 cursor-pointer ${
                  isCameraEnabled
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40 shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
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
                className={`hidden md:flex px-2.5 sm:px-3 py-2 rounded-full border text-xs font-bold transition shadow-md items-center gap-1.5 shrink-0 cursor-pointer ${
                  isScreenShareEnabled || mode === 'screen'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/30 animate-pulse'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
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
                className={`px-3 py-2 rounded-full border text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  mode === 'whiteboard'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>

              {/* PDF Presentation */}
              <button
                onClick={() => changeMode(mode === 'pdf' ? 'idle' : 'pdf')}
                title={mode === 'pdf' ? 'Close PDF Presentation' : 'Present PDF / NEET Notes'}
                className={`px-3 py-2 rounded-full border text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  mode === 'pdf'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Present PDF</span>
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
                className={`relative w-9 h-9 rounded-full border flex items-center justify-center shadow-md transition shrink-0 cursor-pointer ${
                  activeTab === 'participants' && (showSidebar || showMobileDrawer)
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
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
                className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-md transition shrink-0 cursor-pointer ${
                  activeTab === 'attendance' && (showSidebar || showMobileDrawer)
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
              </button>

              {/* End Call */}
              <button
                onClick={() => setShowEndModal(true)}
                disabled={isScheduledEndPassed}
                title={isScheduledEndPassed ? 'Scheduled class end time reached' : 'End Class'}
                className="px-3 sm:px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition shadow-lg flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {isScheduledEndPassed ? 'Time Over' : 'End'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Panel (Desktop) ── */}
        {showSidebar && (
          <div className="hidden lg:flex w-80 xl:w-96 bg-slate-900/95 border border-slate-800/90 rounded-2xl flex-col shrink-0 overflow-hidden shadow-2xl backdrop-blur-xl text-slate-100">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-800/80 text-xs font-bold shrink-0 bg-slate-950/60 pr-2">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3.5 text-center transition border-b-2 relative ${
                  activeTab === 'participants'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/80 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
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
                onClick={() => setActiveTab('attendance')}
                className={`flex-1 py-3.5 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'attendance'
                    ? 'border-violet-500 text-violet-400 bg-slate-900/80 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Attendance</span>
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                title="Close Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 bg-slate-900/90">
              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Waiting Room Join Requests Section */}
                  {pendingRequests.length > 0 && (
                    <div className="bg-amber-950/60 border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-black text-amber-300">
                            Waiting Room ({pendingRequests.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => admitAllStudents(pendingRequests)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition shadow-md cursor-pointer"
                          >
                            Admit All
                          </button>
                          <button
                            onClick={() => denyAllStudents(pendingRequests)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                          >
                            Deny All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {pendingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between bg-slate-900 border border-amber-500/20 p-2.5 rounded-xl shadow-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-100 truncate">
                                {req.name}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">{req.time}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => admitStudent(req.id, req.name)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                              >
                                Admit
                              </button>
                              <button
                                onClick={() => denyStudent(req.id, req.name)}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
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
                  <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                        {tutorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100">{tutorName} (You)</p>
                        <p className="text-[10px] text-blue-400 font-semibold">Host / Tutor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMicrophoneEnabled ? (
                        <Mic className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <MicOff className="w-4 h-4 text-rose-400" />
                      )}
                      {isCameraEnabled ? (
                        <Video className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-slate-500" />
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
                        className="flex items-center justify-between py-2 border-b border-slate-800/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isOnline ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-100 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {p.admissionNumber ? `#${p.admissionNumber}` : 'Student'} •{' '}
                              {isOnline ? 'Active' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isHand && (
                            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <Hand className="w-3.5 h-3.5 animate-bounce" />
                            </div>
                          )}
                          {rp?.isMicrophoneEnabled ? (
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          {rp?.isCameraEnabled ? (
                            <Video className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Attendance Sheet Tab */}
              {activeTab === 'attendance' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
                    <div>
                      <p className="text-xs font-black text-slate-100">
                        {attendanceData.batchName || 'Live Batch'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {attendanceData.subjectName || 'NEET Subject'} •{' '}
                        {attendanceData.students.length} Enrolled
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAllPresent}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black hover:bg-emerald-500/30 transition cursor-pointer"
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
                          className="flex items-center justify-between p-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-100 truncate">
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
                                      ? 'bg-emerald-600 text-white shadow-md'
                                      : status === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-md'
                                        : 'bg-amber-500 text-white shadow-md'
                                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
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
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
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

        {/* ── Mobile Slide-Up Drawer Overlay (For Mobile & Tablet < lg) ── */}
        {showMobileDrawer && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
            onClick={() => setShowMobileDrawer(false)}
          >
            <div
              className="bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] h-[80vh] w-full p-4 overflow-hidden relative animate-in slide-in-from-bottom duration-300 text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Drag Handle Bar */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />

              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      activeTab === 'participants'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Participants</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                      {combinedStudentList.length + 1}
                    </span>
                    {pendingRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      activeTab === 'attendance'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Drawer Content */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {activeTab === 'participants' && (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Waiting Room Requests */}
                    {pendingRequests.length > 0 && (
                      <div className="bg-amber-950/60 border border-amber-500/30 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-300">
                            Waiting Room ({pendingRequests.length})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => admitAllStudents(pendingRequests)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold"
                            >
                              Admit All
                            </button>
                            <button
                              onClick={() => denyAllStudents(pendingRequests)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-rose-300 text-[11px] font-bold border border-rose-500/30"
                            >
                              Deny All
                            </button>
                          </div>
                        </div>

                        {pendingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between bg-slate-900 border border-amber-500/20 p-2 rounded-xl"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-100 truncate">
                                {req.name}
                              </p>
                              <p className="text-[10px] text-slate-400">{req.time}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => admitStudent(req.id, req.name)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                              >
                                Admit
                              </button>
                              <button
                                onClick={() => denyStudent(req.id, req.name)}
                                className="px-2 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/30 text-[11px] font-bold"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tutor Host Row */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-100">{tutorName} (You)</p>
                          <p className="text-[10px] text-blue-400 font-semibold">Host / Tutor</p>
                        </div>
                      </div>
                    </div>

                    {/* Students List */}
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
                          className="flex items-center justify-between py-2 border-b border-slate-800/60"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isOnline ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-100 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {isOnline ? 'Active' : 'Offline'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isHand && (
                              <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <Hand className="w-3.5 h-3.5 animate-bounce" />
                              </div>
                            )}
                            {rp?.isMicrophoneEnabled ? (
                              <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                      <div>
                        <p className="text-xs font-black text-slate-100">
                          {attendanceData.batchName || 'Live Batch'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {attendanceData.students.length} Enrolled
                        </p>
                      </div>
                      <button
                        onClick={handleMarkAllPresent}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black"
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
                            className="flex items-center justify-between p-2 bg-slate-800/80 border border-slate-700/80 rounded-xl"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-100 truncate">
                                {st.studentName}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {['PRESENT', 'ABSENT', 'LATE'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => toggleStudentStatus(st.studentAdmissionId, status)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                                    st.attendanceStatus === status
                                      ? status === 'PRESENT'
                                        ? 'bg-emerald-600 text-white'
                                        : status === 'ABSENT'
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-amber-500 text-white'
                                      : 'bg-slate-800 border border-slate-700 text-slate-400'
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
                      className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black shrink-0 flex items-center justify-center gap-1.5"
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
