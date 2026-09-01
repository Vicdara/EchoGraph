import React from 'react';
import { Eye, History, Volume2 } from 'lucide-react';

interface HeaderProps {
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  highContrast,
  onToggleHighContrast,
  onOpenHistory,
  historyCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ded7c5] bg-[#ffffff] px-3 py-2 transition-colors duration-200 dark:border-white/20 dark:bg-black sm:px-8 sm:py-4">
      <div className="mx-auto flex max-w-5xl min-w-0 items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d9488] dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm" aria-hidden="true">
              <Volume2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1a2b4a] dark:text-white sm:text-3xl">
              EchoGraph
            </h1>
          </div>
          <p className="mt-1 hidden text-sm font-medium text-[#4a5568] dark:text-white/90 sm:block sm:text-base">
            Turns chart and graph images into spoken descriptions for blind and low-vision students.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              aria-label={`View session history (${historyCount} items)`}
              className="inline-flex items-center gap-2 rounded-lg border border-[#ded7c5] bg-[#f7f5f0] p-2 text-sm font-semibold text-[#1a2b4a] transition-colors hover:bg-[#ede9df] focus-visible:ring-4 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white/10 sm:px-3"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#0d9488] dark:bg-white text-white dark:text-black font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* High Contrast Mode Toggle Switch */}
          <button
            onClick={onToggleHighContrast}
            role="switch"
            aria-checked={highContrast}
            aria-label="High Contrast Mode"
            className={`inline-flex items-center gap-2 rounded-lg border-2 p-2 text-sm font-bold transition-all focus-visible:ring-4 sm:px-3.5 ${
              highContrast
                ? 'bg-black text-[#ffff00] border-[#ffff00]'
                : 'bg-white text-[#1a2b4a] border-[#1a2b4a] hover:bg-[#f0f4f9]'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{highContrast ? 'High Contrast ON' : 'High Contrast'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
