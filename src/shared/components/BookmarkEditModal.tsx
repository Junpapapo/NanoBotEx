import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Trash2 } from "lucide-react";
import ShortcutIcon from "./ShortcutIcon";
import EmojiIconPicker from "./EmojiIconPicker";
import { UserBookmark } from "./BookmarksSidebar";
import { CustomDialog } from "./CustomDialog";

interface BookmarkEditModalProps {
  editingBookmark: UserBookmark;
  setEditingBookmark: (bookmark: UserBookmark) => void;
  showIconPicker: boolean;
  setShowIconPicker: (show: boolean) => void;
  onDelete: (id: number) => void;
  onCancel: () => void;
  onSave: (bookmark: UserBookmark) => void;
  t: any;
}

export function BookmarkEditModal({
  editingBookmark,
  setEditingBookmark,
  showIconPicker,
  setShowIconPicker,
  onDelete,
  onCancel,
  onSave,
  t
}: BookmarkEditModalProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 select-text"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-[340px] rounded-2xl border border-indigo-500/20 bg-[#080d22] p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />

          <h3 className="text-xs font-black text-white mb-4 tracking-tight flex items-center gap-2 flex-shrink-0">
            <Bookmark size={14} className="text-indigo-400" />
            {editingBookmark.id ? t("bookmarks.modal.titleEdit", "북마크 편집") : t("bookmarks.modal.titleNew", "새 북마크 추가")}
          </h3>

          <div className="flex-1 space-y-4 select-text">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("bookmarks.modal.titleLabel", "북마크 이름 (라벨)")}</label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {showIconPicker ? t("bookmarks.modal.iconToggleClose", "닫기") : t("bookmarks.modal.iconToggleOpen", "아이콘 선택")}
                </button>
              </div>
              <div className="flex gap-2.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                  <ShortcutIcon iconName={editingBookmark.iconName} size={16} />
                </div>
                <input
                  type="text"
                  value={editingBookmark.title}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, title: e.target.value })}
                  className="flex-1 bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/80 text-xs text-white rounded-xl py-2 px-3 outline-none transition-all font-medium"
                  placeholder={t("bookmarks.modal.titlePlaceholder", "예: 내 블로그")}
                />
              </div>
            </div>

            {showIconPicker && (
              <div className="animate-in fade-in duration-200">
                <EmojiIconPicker
                  value={editingBookmark.iconName}
                  onChange={(val) => {
                    setEditingBookmark({ ...editingBookmark, iconName: val });
                    setShowIconPicker(false);
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("bookmarks.modal.urlLabel", "웹사이트 주소 (URL)")}</label>
              <input
                type="text"
                value={editingBookmark.url}
                onChange={(e) => setEditingBookmark({ ...editingBookmark, url: e.target.value })}
                className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/80 text-xs text-white rounded-xl py-2.5 px-3.5 outline-none transition-all font-medium font-mono"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-2.5 w-full mt-6 pt-4 border-t border-white/[0.05] flex-shrink-0">
            {editingBookmark.id > 3 && (
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="h-9 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                title={t("bookmarks.modal.delete", "삭제")}
              >
                <Trash2 size={13} />
                {t("bookmarks.modal.delete", "삭제")}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-9 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              {t("bookmarks.modal.cancel", "취소")}
            </button>
            <button
              type="button"
              onClick={() => onSave(editingBookmark)}
              className="flex-1 h-9 rounded-xl border border-indigo-500/30 bg-indigo-600/80 text-white hover:bg-indigo-500 hover:border-indigo-400 text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            >
              {t("bookmarks.modal.save", "저장")}
            </button>
          </div>
        </motion.div>
      </motion.div>

      <CustomDialog
        isOpen={isConfirmOpen}
        type="confirm"
        title={t("bookmarks.modal.deleteTitle", "북마크 삭제")}
        message={t("bookmarks.modal.deleteConfirm", "정말 삭제하시겠습니까?")}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onDelete(editingBookmark.id);
        }}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={t("common.confirm", "확인")}
        cancelText={t("common.cancel", "취소")}
      />
    </>
  );
}
