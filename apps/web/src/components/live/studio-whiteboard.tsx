'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

interface StudioWhiteboardProps {
  isTeacher?: boolean;
  onFrameUpdate?: (frame: string) => void;
  remoteFrame?: string | null;
}

// Dynamically import Excalidraw Component to prevent SSR issues
const ExcalidrawInner = dynamic(() => import('./excalidraw-whiteboard-inner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-600 text-sm font-bold">Loading Excalidraw Whiteboard...</p>
      </div>
    </div>
  ),
});

export default function StudioWhiteboard({
  isTeacher = true,
  onFrameUpdate,
  remoteFrame,
}: StudioWhiteboardProps) {
  return (
    <div className="w-full h-full relative overflow-hidden bg-white studio-whiteboard-container">
      <ExcalidrawInner
        isTeacher={isTeacher}
        onFrameUpdate={onFrameUpdate}
        remoteFrame={remoteFrame}
      />
    </div>
  );
}
