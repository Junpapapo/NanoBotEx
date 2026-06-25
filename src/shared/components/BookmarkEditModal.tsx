import React from "react";
import { motion } from "framer-motion";
import { Settings, Trash2 } from "lucide-react";
import ShortcutIcon from "./ShortcutIcon";
import EmojiIconPicker from "./EmojiIconPicker";
import { UserBookmark } from "./BookmarksSidebar";

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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md z-[9999] flex items-center justify-center p-6 select-text"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 15, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="w-[92%] max-w-[460px] rounded-3xl border border-indigo-500/35 bg-[#080d22]/95 p-6 shadow-[0_0_40px_rgba(99,102,241,0.25)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/30 via-indigo-500 to-indigo-500/30" />
        
        <h3 className="text-sm font-black text-white mb-4 tracking-tight flex items-center gap-2 flex-shrink-0">
          <Settings size={15} className="text-indigo-400" />
          {`${t("bookmarks.modal.titleEdit", "즐겨찾기 #{id} 설정").replace("{id}", String(editingBookmark.id))}`}
        </h3>

        <div className="space-y-5 select-text">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("bookmarks.modal.nameLabel", "이름")}
              </label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {showIconPicker ? t("bookmarks.modal.iconToggleClose", "선택창 닫기") : t("bookmarks.modal.iconToggleOpen", "아이콘 변경")}
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
                className="flex-1 bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/80 text-xs text-white rounded-xl py-2.5 px-3.5 outline-none transition-all font-medium"
                placeholder={t("bookmarks.modal.namePlaceholder", "이름 입력")}
              />
            </div>
          </div>

          {showIconPicker && (
            <div className="animate-in fade-in duration-200">
              <EmojiIconPicker
                value={editingBookmark.iconName}
                onChange={(val) => setEditingBookmark({ ...editingBookmark, iconName: val })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t("bookmarks.modal.urlLabel", "인터넷 주소 (URL)")}
            </label>
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
              onClick={() => {
                if (window.confirm(t("bookmarks.modal.deleteConfirm", "정말 삭제하시겠습니까?"))) {
                  onDelete(editingBookmark.id);
                }
              }}
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
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            {t("bookmarks.modal.cancel", "취소")}
          </button>
          <button
            type="button"
            onClick={() => onSave(editingBookmark)}
            className="flex-1 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/80 text-white hover:bg-indigo-500 hover:border-indigo-400 text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
          >
            {t("bookmarks.modal.save", "저장")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
