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
    <header className="w-full border-b border-[#ded7c5] dark:border-white/20 bg-[#ffffff] dark:bg-black py-4 px-4 sm:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d9488] dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm" aria-hidden="true">
              <Volume2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a2b4a] dark:text-white">
              EchoGraph
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#4a5568] dark:text-white/90 mt-1 font-medium">
            Turns chart and graph images into spoken descriptions for blind and low-vision students.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              aria-label={`View session history (${historyCount} items)`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-[#ded7c5] dark:border-white bg-[#f7f5f0] dark:bg-black text-[#1a2b4a] dark:text-white hover:bg-[#ede9df] dark:hover:bg-white/10 transition-colors focus-visible:ring-4"
            >
              <History className="w-4 h-4" />
              <span>History</span>
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
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold border-2 transition-all focus-visible:ring-4 ${
              highContrast
                ? 'bg-black text-[#ffff00] border-[#ffff00]'
                : 'bg-white text-[#1a2b4a] border-[#1a2b4a] hover:bg-[#f0f4f9]'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{highContrast ? 'High Contrast ON' : 'High Contrast'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
