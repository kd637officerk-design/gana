import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#0B0D12]/95 border border-white/15 p-5 shadow-2xl text-zinc-100 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Bill's Cave app icon"
                  className="w-10 h-10 rounded-xl border border-white/15 object-cover"
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

            {isIOS ? (
              <p className="text-xs text-zinc-300 leading-relaxed">
                1. Tap the <strong>Share</strong> icon in Safari.<br />
                2. Select <strong>Add to Home Screen</strong> to install with the Bill&apos;s Cave cover icon.
              </p>
            ) : (
              <p className="text-xs text-zinc-300 leading-relaxed">
                Open your browser menu (Chrome or Edge on Windows / Android) and choose{' '}
                <strong>Install Bill&apos;s Cave</strong> or <strong>Add to Home screen</strong> to pin it with your custom app icon.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
