import React, { useEffect } from 'react';
import { X, Clock, Trash2, ArrowRight } from 'lucide-react';
import { AnalysisRecord } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onClearHistory: () => void;
  highContrast: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onClearHistory,
  highContrast,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div
        className={`w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black text-white border-l-2 border-white'
            : 'bg-white text-[#1a2b4a] border-l border-[#ded7c5]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#ded7c5] dark:border-white/20">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
              <h2 id="history-drawer-title" className="text-xl font-bold">
                Session History
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close history drawer"
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-180px)] space-y-3 pr-1">
            {history.length === 0 ? (
              <div className="py-12 text-center text-[#718096] dark:text-white/60">
                <p className="font-semibold text-sm">No graphs analyzed yet in this session.</p>
                <p className="text-xs mt-1">Uploaded or sample graphs will appear here.</p>
              </div>
            ) : (
              history.map((record) => (
                <button
                  key={record.id}
                  onClick={() => {
                    onSelectRecord(record);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 focus-visible:ring-4 ${
                    highContrast
                      ? 'border-white bg-black hover:border-yellow-400 text-white'
                      : 'border-[#ded7c5] bg-[#faf9f6] hover:border-[#0d9488] text-[#1a2b4a]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-black border border-[#ded7c5] dark:border-white/30 shrink-0 overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={record.imageUrl}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{record.fileName}</p>
                    <p className="text-xs text-[#718096] dark:text-white/70 line-clamp-1 mt-0.5">
                      {record.description.summary}
                    </p>
                    <span className="inline-block text-[10px] text-[#0d9488] dark:text-yellow-400 font-semibold mt-1">
                      {record.verification.isVerified ? '✓ Verified' : '⚠ Uncertain'}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#718096] shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="pt-4 border-t border-[#ded7c5] dark:border-white/20">
            <button
              onClick={onClearHistory}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Session History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
