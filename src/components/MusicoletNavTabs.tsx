import React from 'react';
import { Search, X } from 'lucide-react';
import { NavTab } from '../types/music';

interface MusicoletNavTabsProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  panelOpacity: number;
}

const TABS: { id: NavTab; label: string }[] = [
  { id: 'queue', label: 'Queue' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
  { id: 'playlists', label: 'Playlists' },
];

export const MusicoletNavTabs: React.FC<MusicoletNavTabsProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="border-b border-white/[0.07] px-3.5 flex items-center justify-between gap-2">
      {/* Compact Musicolet-style dark navigation tabs */}
      <div
        role="tablist"
        aria-label="Library navigation"
        className="flex items-center gap-4 overflow-x-auto no-scrollbar"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className={`relative h-9 py-1.5 text-xs font-medium tracking-wide transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-amber-300 ${
                isActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400 rounded-t-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tiny inline filter search */}
      <div className="relative flex items-center w-36 sm:w-44 shrink-0">
        <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter..."
          aria-label="Filter library"
          className="w-full h-6 pl-7 pr-6 rounded-md bg-white/[0.06] border border-white/[0.08] text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear filter"
            className="absolute right-1.5 text-zinc-400 hover:text-zinc-200 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
