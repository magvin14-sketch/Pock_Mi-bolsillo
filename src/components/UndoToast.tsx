import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  undoLabel?: string;
  onUndo: () => void;
  onClose: () => void;
  duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  undoLabel = 'Deshacer',
  onUndo,
  onClose,
  duration = 5000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  return (
    <div
      id="undo-toast"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[92vw] sm:max-w-md animate-fadeIn"
    >
      <div className="bg-[#202328] border border-[#30353B] text-[#F4F6F8] rounded-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md">
        <div className="p-3.5 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#F4F6F8] truncate">{message}</span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-undo-toast"
              type="button"
              onClick={() => {
                onUndo();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35D0BA]/15 hover:bg-[#35D0BA]/25 text-[#35D0BA] border border-[#35D0BA]/40 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{undoLabel}</span>
            </button>

            <button
              id="btn-close-undo-toast"
              type="button"
              onClick={onClose}
              className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1 rounded-md hover:bg-[#272B30] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress line indicator inside the card */}
        <div className="w-full h-1 bg-[#17191C]/60 overflow-hidden">
          <div
            className="h-full bg-[#35D0BA] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
