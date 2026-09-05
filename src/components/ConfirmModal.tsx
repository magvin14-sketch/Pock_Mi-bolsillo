import React from 'react';
import { ModalPortal } from './ModalPortal';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onClose,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        id="confirm-modal-backdrop"
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          id="confirm-modal-card"
          className="bg-[#202328] border border-[#30353B] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-fadeIn my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isDestructive
                    ? 'bg-[#F0525D]/15 text-[#F0525D]'
                    : 'bg-[#35D0BA]/15 text-[#35D0BA]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#F4F6F8] leading-snug">{title}</h4>
            </div>
            <button
              id="btn-close-confirm-modal"
              type="button"
              onClick={onClose}
              className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1 rounded-lg hover:bg-[#272B30] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">{message}</p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30353B]/50">
            <button
              id="btn-cancel-confirm-modal"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#272B30] hover:bg-[#30353B] text-[#9AA3AD] hover:text-[#F4F6F8] text-xs font-semibold transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              id="btn-action-confirm-modal"
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isDestructive
                  ? 'bg-[#F0525D] hover:bg-[#D93D48] text-white'
                  : 'bg-[#35D0BA] hover:bg-[#2EB39E] text-[#07150D]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
