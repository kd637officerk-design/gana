import React, { useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const standaloneUrl = typeof window !== 'undefined' ? window.location.origin : '/';

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title="Install Bill's Cave on Windows or Android"
        className="h-7 px-2.5 rounded-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-100 font-medium text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden md:inline">Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        title="Install as Windows or Android app"
        className="h-7 px-2 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden lg:inline">Install App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#0B0D12]/95 border border-white/15 p-5 shadow-2xl text-zinc-100 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Bill's Cave app icon"
                  className="w-11 h-11 rounded-xl border border-white/15 object-cover"
                />
                <div>
                  <h3 className="font-display text-sm font-semibold">Install Bill&apos;s Cave</h3>
                  <p className="text-[11px] text-zinc-400">Windows &amp; Android App Icon Ready</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInIframe && (
              <div className="rounded-xl bg-amber-400/10 border border-amber-400/25 p-3 space-y-2">
                <p className="text-xs text-amber-200 leading-relaxed">
                  To install with this cover icon (instead of the editor icon), open the standalone app tab first:
                </p>
                <a
                  href={standaloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Standalone App Tab</span>
                </a>
              </div>
            )}

            {isIOS ? (
              <p className="text-xs text-zinc-300 leading-relaxed">
                1. Open the standalone tab above in Safari.<br />
                2. Tap <strong>Share</strong> &rarr; <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-xs text-zinc-300 leading-relaxed">
                In the standalone tab (Chrome or Edge on Windows / Android), click the <strong>Install</strong> icon in the address bar or browser menu &rarr; <strong>Install Bill&apos;s Cave</strong>.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <a
                href="/favicon.ico"
                download="bills-cave-windows.ico"
                className="flex-1 h-8 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[11px] font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Windows .ICO</span>
              </a>
              <a
                href="/pwa-512x512.png"
                download="bills-cave-android-512.png"
                className="flex-1 h-8 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[11px] font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Android .PNG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
