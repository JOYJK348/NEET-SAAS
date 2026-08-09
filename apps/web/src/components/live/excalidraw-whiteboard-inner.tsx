'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

interface Props {
  isTeacher?: boolean;
  onFrameUpdate?: (frame: string) => void;
  remoteFrame?: string | null;
}

export default function ExcalidrawWhiteboardInner({
  isTeacher = true,
  onFrameUpdate,
  remoteFrame,
}: Props) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const lastRemoteRef = useRef<string | null>(null);
  const isUpdatingFromRemoteRef = useRef(false);

  // Broadcast elements state to students (Teacher)
  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      if (!isTeacher || !onFrameUpdate || isUpdatingFromRemoteRef.current) return;
      try {
        const payload = JSON.stringify(elements);
        onFrameUpdate(payload);
      } catch {}
    },
    [isTeacher, onFrameUpdate]
  );

  // Receive teacher elements state (Student)
  useEffect(() => {
    if (isTeacher || !remoteFrame || !excalidrawAPI) return;
    if (remoteFrame === lastRemoteRef.current) return;
    lastRemoteRef.current = remoteFrame;

    try {
      if (remoteFrame.startsWith('[')) {
        const elements = JSON.parse(remoteFrame);
        isUpdatingFromRemoteRef.current = true;
        excalidrawAPI.updateScene({ elements });
        setTimeout(() => {
          isUpdatingFromRemoteRef.current = false;
        }, 100);
      }
    } catch {}
  }, [excalidrawAPI, isTeacher, remoteFrame]);

  return (
    <div className="w-full h-full relative [&_.sidebar-trigger]:!hidden [&_.layer-ui__wrapper__top-right]:!hidden">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        viewModeEnabled={!isTeacher}
        zenModeEnabled={false}
        gridModeEnabled={false}
        theme="light"
        initialData={{
          appState: {
            viewBackgroundColor: '#ffffff',
          },
        }}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: isTeacher,
            export: { saveFileToDisk: true },
            loadScene: isTeacher,
            saveToActiveFile: false,
            toggleTheme: true,
          },
        }}
      />

      {/* Student View Indicator */}
      {!isTeacher && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-1.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur-sm rounded-full text-xs font-extrabold text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live Whiteboard — Teacher&apos;s Screen
          </div>
        </div>
      )}
    </div>
  );
}
