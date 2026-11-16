import React from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon, Moon, Plus, Shield, Sliders } from 'lucide-react';
import { formatDuration } from '../utils/audioEngine';
import { PWAInstallButton } from './PWAInstallButton';

interface TopFeatureBarProps {
  activeModal: 'eq' | 'wallpaper' | 'sleep' | 'cloak' | null;
  onToggleModal: (modal: 'eq' | 'wallpaper' | 'sleep' | 'cloak') => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
  sleepRemaining: number | null;
  caveReverb: boolean;
  cloakedCount: number;
  cloakUnlocked: boolean;
  onTriggerAddAudio: () => void;
  panelOpacity: number;
}

export const TopFeatureBar: React.FC<TopFeatureBarProps> = ({
  activeModal,
  onToggleModal,
  zenMode,
  onToggleZenMode,
  sleepRemaining,
  caveReverb,
  cloakedCount,
  cloakUnlocked,
  onTriggerAddAudio,
  panelOpacity,
}) => {
  const headerBg = `rgba(10, 12, 17, ${Math.min(0.68, panelOpacity / 100)})`;

  return (
    <header
      style={{ backgroundColor: headerBg }}
      className="relative z-30 flex items-center justify-between gap-3 px-3.5 md:px-5 h-10 border-b border-white/[0.07] backdrop-blur-md transition-colors duration-200"
    >
      {/* Zone 1: Brand Wordmark with App Cover Icon */}
      <div className="flex items-center gap-2 shrink-0">
        <img
          src="/pwa-192x192.png"
          alt="Bill's Cave icon"
          className="w-5 h-5 rounded object-cover border border-white/15 shrink-0"
        />
        <span className="font-display text-sm font-semibold tracking-tight text-zinc-100 whitespace-nowrap shrink-0">
          Bill&apos;s Cave
        </span>
      </div>

      {/* Zone 2: Bill's Cave Features */}
      <nav aria-label="Bill's Cave features" className="flex items-center gap-1 md:gap-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onToggleModal('eq')}
          className={`h-8 px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 rounded-md ${
            activeModal === 'eq'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Cave EQ{caveReverb ? ' · Reverb' : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleModal('cloak')}
          className={`h-8 px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 rounded-md ${
            activeModal === 'cloak' || cloakUnlocked
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline font-mono-tabular">
            Cloak{cloakedCount > 0 ? ` · ${cloakedCount}` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleModal('wallpaper')}
          className={`h-8 px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 rounded-md ${
            activeModal === 'wallpaper'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Wallpapers</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleModal('sleep')}
          className={`h-8 px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 rounded-md ${
            activeModal === 'sleep' || sleepRemaining !== null
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]'
          }`}
        >
          <Moon className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline font-mono-tabular">
            {sleepRemaining !== null ? formatDuration(sleepRemaining) : 'Sleep'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleZenMode}
          className={`h-8 px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 rounded-md ${
            zenMode
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]'
          }`}
          title={zenMode ? 'Expand library' : 'Collapse library to admire wallpaper'}
        >
          {zenMode ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
          <span className="hidden md:inline">{zenMode ? 'Expand' : 'Minimize'}</span>
        </button>
      </nav>

      {/* Zone 3: Install App & Add Audio */}
      <div className="flex items-center gap-1.5 shrink-0">
        <PWAInstallButton />
        <button
          type="button"
          onClick={onTriggerAddAudio}
          className="h-7 px-2.5 rounded-md bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Add Audio</span>
        </button>
      </div>
    </header>
  );
};
