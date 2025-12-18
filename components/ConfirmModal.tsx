"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700",
      icon: "text-red-600",
    },
    warning: {
      button: "bg-yellow-600 hover:bg-yellow-700",
      icon: "text-yellow-600",
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700",
      icon: "text-blue-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[10px] w-full max-w-md shadow-xl" style={{ borderRadius: '14px' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-700 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-[6px] font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-[6px] font-medium transition-colors cursor-pointer ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

