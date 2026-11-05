import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmBtnStyle?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmBtnStyle = 'bg-rose-600 hover:bg-rose-700 text-white',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer ${confirmBtnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
