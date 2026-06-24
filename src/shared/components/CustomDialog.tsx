import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, HelpCircle } from "lucide-react";

interface CustomDialogProps {
  isOpen: boolean;
  type: "alert" | "confirm";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function CustomDialog({
  isOpen,
  type,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel
}: CustomDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0c122c]/95 p-6 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            {type === "alert" ? (
              <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
            ) : (
              <HelpCircle className="h-6 w-6 text-indigo-400 shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="text-base font-bold text-white leading-6">{title}</h3>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            {type === "confirm" && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
