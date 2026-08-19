'use client';

import React, { useState, useEffect } from 'react';
import {
  useRoomContext,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from '@livekit/components-react';
import { ConnectionState, Track, RoomEvent } from 'livekit-client';
import { Activity, ChevronDown, ChevronUp, RefreshCw, Volume2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Props {
  classId: string;
  role: 'tutor' | 'student';
}

export default function LivekitDebugPanel({ classId, role }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const micTracks = useTracks([Track.Source.Microphone], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const [canPlayAudio, setCanPlayAudio] = useState(true);
  const [iceState, setIceState] = useState<string>('unknown');
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; msg: string }>>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEventLogs((prev) => [{ time, msg }, ...prev.slice(0, 7)]);
  };

  useEffect(() => {
    if (!room) return;

    const checkAudio = () => {
      setCanPlayAudio(room.canPlaybackAudio);
    };
    checkAudio();

    const onConnected = () => {
      addLog(`Connected to room: ${room.name}`);
      try {
        const engine = (room as any).engine;
        if (engine?.client?.iceConnectionState) {
          setIceState(engine.client.iceConnectionState);
        }
      } catch {}
    };
    const onDisconnected = (reason: any) => addLog(`Disconnected: ${reason || 'normal'}`);
    const onReconnecting = () => addLog('Reconnecting WebRTC...');
    const onReconnected = () => addLog('Reconnected WebRTC successfully');
    const onTrackSubscribed = (track: any, pub: any, p: any) =>
      addLog(`Subscribed: ${track.kind} (${pub.source}) from ${p.identity}`);
    const onTrackUnsubscribed = (track: any, pub: any, p: any) =>
      addLog(`Unsubscribed: ${track.kind} from ${p.identity}`);
    const onLocalPublished = (pub: any) =>
      addLog(`Local published: ${pub.kind} (${pub.source})`);
    const onAudioStatus = () => {
      checkAudio();
      addLog(`AudioPlayback: canPlay=${room.canPlaybackAudio}`);
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.LocalTrackPublished, onLocalPublished);
    room.on(RoomEvent.AudioPlaybackStatusChanged, onAudioStatus);

    return () => {
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      room.off(RoomEvent.LocalTrackPublished, onLocalPublished);
      room.off(RoomEvent.AudioPlaybackStatusChanged, onAudioStatus);
    };
  }, [room]);

  const localCamPub = localParticipant.getTrackPublication(Track.Source.Camera);
  const localMicPub = localParticipant.getTrackPublication(Track.Source.Microphone);
  const localScreenPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);

  return (
    <div className="fixed bottom-2 left-2 z-50 font-mono text-[11px] select-text">
      {/* Floating Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-lg border shadow-xl flex items-center gap-1.5 font-bold transition cursor-pointer backdrop-blur-md ${
          connectionState === ConnectionState.Connected
            ? 'bg-slate-900/90 border-emerald-500/60 text-emerald-400 hover:bg-slate-900'
            : 'bg-slate-900/90 border-amber-500/60 text-amber-400 hover:bg-slate-900'
        }`}
      >
        <Activity className="w-3.5 h-3.5 animate-pulse" />
        <span>LiveKit Debug: {connectionState}</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Diagnostic HUD */}
      {isOpen && (
        <div className="mt-1.5 w-80 sm:w-96 max-h-[75vh] overflow-y-auto bg-slate-950/98 border border-slate-700/90 rounded-xl p-3 text-slate-200 shadow-2xl space-y-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              LiveKit Diagnostics ({role.toUpperCase()})
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                connectionState === ConnectionState.Connected
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {connectionState}
            </span>
          </div>

          {/* Section 1: Room & Identity */}
          <div className="space-y-0.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Room Connection</p>
            <p className="truncate">
              <span className="text-slate-400">Room:</span>{' '}
              <span className="text-emerald-400 font-bold">{room?.name || `room-${classId}`}</span>
            </p>
            <p className="truncate">
              <span className="text-slate-400">Self ID:</span>{' '}
              <span className="text-blue-400">{localParticipant.identity || 'pending...'}</span>
            </p>
            <p className="truncate">
              <span className="text-slate-400">Server:</span>{' '}
              <span className="text-slate-300">LiveKit Cloud SFU</span>
            </p>
          </div>

          {/* Section 2: Local Media State */}
          <div className="space-y-0.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Local Publishing</p>
            <p>
              <span className="text-slate-400">Camera:</span>{' '}
              <span
                className={
                  isCameraEnabled && localCamPub?.track ? 'text-emerald-400 font-bold' : 'text-rose-400'
                }
              >
                {isCameraEnabled ? `PUB (SID: ${localCamPub?.trackSid?.slice(-6) || 'active'})` : 'MUTED / OFF'}
              </span>
            </p>
            <p>
              <span className="text-slate-400">Microphone:</span>{' '}
              <span
                className={
                  isMicrophoneEnabled && localMicPub?.track
                    ? 'text-emerald-400 font-bold'
                    : 'text-rose-400'
                }
              >
                {isMicrophoneEnabled ? `PUB (SID: ${localMicPub?.trackSid?.slice(-6) || 'active'})` : 'MUTED / OFF'}
              </span>
            </p>
            <p>
              <span className="text-slate-400">Screen Share:</span>{' '}
              <span className={isScreenShareEnabled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {isScreenShareEnabled ? `ACTIVE (SID: ${localScreenPub?.trackSid?.slice(-6) || 'active'})` : 'OFF'}
              </span>
            </p>
          </div>

          {/* Section 3: Remote Participants & Tracks */}
          <div className="space-y-1.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Remote Participants ({remoteParticipants.length})
              </span>
            </div>
            {remoteParticipants.length === 0 ? (
              <p className="text-slate-500 italic">No remote participants in room yet.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                {remoteParticipants.map((rp) => {
                  const camTrack = cameraTracks.find(
                    (t) => t.participant.sid === rp.sid && t.publication?.track && !t.publication.isMuted
                  );
                  const micTrack = micTracks.find(
                    (t) => t.participant.sid === rp.sid && t.publication?.track && !t.publication.isMuted
                  );
                  const isSpeaking = rp.isSpeaking;

                  return (
                    <div
                      key={rp.sid}
                      className="p-1.5 rounded bg-slate-950/70 border border-slate-800 text-[10px] space-y-0.5"
                    >
                      <p className="font-bold text-white flex items-center justify-between">
                        <span className="truncate max-w-[180px]">
                          {rp.name || rp.identity}
                        </span>
                        {isSpeaking && (
                          <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-400 font-black rounded">
                            SPEAKING
                          </span>
                        )}
                      </p>
                      <p className="text-slate-400">
                        Cam:{' '}
                        <span className={camTrack ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {camTrack ? `SUB (SID: ${camTrack.publication?.trackSid?.slice(-6)})` : 'OFF'}
                        </span>
                        {' | '}
                        Mic:{' '}
                        <span className={micTrack ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {micTrack ? `SUB (SID: ${micTrack.publication?.trackSid?.slice(-6)})` : 'OFF'}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Audio Playback & Browser Policy */}
          <div className="space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Audio Playback Policy</p>
            <div className="flex items-center justify-between">
              <span>
                Playback Status:{' '}
                <span className={canPlayAudio ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {canPlayAudio ? 'UNLOCKED / ACTIVE' : 'BLOCKED (Need Gesture)'}
                </span>
              </span>
              {!canPlayAudio && (
                <button
                  onClick={() => room?.startAudio()}
                  className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded cursor-pointer"
                >
                  Unlock Audio
                </button>
              )}
            </div>
            <p className="text-slate-400">
              Remote Audio Tracks Subscribed: <span className="text-white font-bold">{micTracks.filter(t => !t.participant.isLocal).length}</span>
            </p>
          </div>

          {/* Section 5: Realtime Event Stream */}
          <div className="space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Live Events Log</p>
            <div className="space-y-0.5 text-[9.5px] max-h-24 overflow-y-auto pr-0.5 text-slate-400">
              {eventLogs.length === 0 ? (
                <p className="italic text-slate-500">Listening to LiveKit events...</p>
              ) : (
                eventLogs.map((log, i) => (
                  <p key={i} className="truncate">
                    <span className="text-slate-500">[{log.time}]</span> {log.msg}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
