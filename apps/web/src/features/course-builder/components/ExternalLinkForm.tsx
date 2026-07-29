'use client';

import { useState, useEffect } from 'react';
import { Link, Globe, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function ExternalLinkForm({
  externalUrl,
  metadata,
  onChange,
}: {
  externalUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  onChange?: (data: { externalUrl: string; metadata?: Record<string, unknown> }) => void;
}) {
  const [url, setUrl] = useState(externalUrl ?? '');
  const [siteName, setSiteName] = useState((metadata?.siteName as string) ?? '');
  const [displayTitle, setDisplayTitle] = useState((metadata?.title as string) ?? '');
  const [durationMins, setDurationMins] = useState<number | string>(
    (metadata?.durationMins as number | string) ?? ''
  );

  useEffect(() => {
    if (url && url !== externalUrl) {
      try {
        const u = new URL(url);
        setSiteName(u.hostname.replace('www.', ''));
      } catch {}
    }
  }, [url, externalUrl]);

  const sync = (partial: {
    externalUrl?: string;
    siteName?: string;
    title?: string;
    durationMins?: number | string;
  }) => {
    const data: { externalUrl: string; metadata: Record<string, unknown> } = {
      externalUrl: partial.externalUrl ?? url,
      metadata: {
        siteName: partial.siteName ?? siteName,
        title: partial.title ?? displayTitle,
        durationMins: partial.durationMins ?? durationMins,
      },
    };
    if (partial.externalUrl) data.externalUrl = partial.externalUrl;
    if (partial.siteName) data.metadata.siteName = partial.siteName;
    if (partial.title) data.metadata.title = partial.title;
    if (partial.durationMins !== undefined) data.metadata.durationMins = partial.durationMins;
    onChange?.(data);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
          URL
        </label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              sync({ externalUrl: e.target.value });
            }}
            placeholder="https://example.com/video"
            className="h-9 text-xs pl-9"
          />
        </div>
      </div>

      {url && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
          <div className="flex items-center gap-2.5 p-3 border-b border-gray-100">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-gray-200 shrink-0">
              <Globe className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Title
                  </label>
                  <input
                    value={displayTitle}
                    onChange={(e) => {
                      setDisplayTitle(e.target.value);
                      sync({ title: e.target.value });
                    }}
                    placeholder="Link display title"
                    className="w-full text-xs font-semibold text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-violet-300 placeholder:text-gray-300"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 truncate">
                    {siteName || 'Unknown site'}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-violet-600 hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    Open <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 py-2 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  Site Name
                </label>
                <input
                  value={siteName}
                  onChange={(e) => {
                    setSiteName(e.target.value);
                    sync({ siteName: e.target.value });
                  }}
                  placeholder="e.g. YouTube, Vimeo"
                  className="w-full text-[11px] text-gray-600 bg-transparent outline-none border-b border-gray-200 focus:border-violet-300 placeholder:text-gray-300 py-0.5"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMins}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setDurationMins(val);
                    sync({ durationMins: val });
                  }}
                  placeholder="e.g. 15"
                  className="w-full text-[11px] text-gray-600 bg-transparent outline-none border-b border-gray-200 focus:border-violet-300 placeholder:text-gray-300 py-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
