import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Sparkles, Trash2 } from "lucide-react";
import ShortcutIcon from "./ShortcutIcon";
import EmojiIconPicker from "./EmojiIconPicker";
import { Skill } from "../chatbot-types";


interface SkillEditModalProps {
  editingShortcut: Skill;
  setEditingShortcut: (shortcut: Skill) => void;
  showIconPicker: boolean;
  setShowIconPicker: (show: boolean) => void;
  isOptimizing: boolean;
  onOptimize: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  onSave: (shortcut: Skill) => void;
  t: any;
}

export function SkillEditModal({
  editingShortcut,
  setEditingShortcut,
  showIconPicker,
  setShowIconPicker,
  isOptimizing,
  onOptimize,
  onDelete,
  onCancel,
  onSave,
  t
}: SkillEditModalProps) {
  const isDefaultSkill = ["translator", "summarizer", "code_reviewer"].includes(editingShortcut.id);
  const [showDangerZone, setShowDangerZone] = useState<boolean>(false);

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
        className="w-[92%] max-w-[500px] h-[95%] max-h-[760px] rounded-3xl border border-indigo-500/35 bg-[#080d22]/95 p-6 shadow-[0_0_40px_rgba(99,102,241,0.25)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/30 via-indigo-500 to-indigo-500/30" />
        
        <h3 className="text-sm font-black text-white mb-4 tracking-tight flex items-center gap-2 flex-shrink-0">
          <Settings size={15} className="text-indigo-400" />
          {editingShortcut.id ? t("skills.modal.titleEdit", "스킬 편집: {title}").replace("{title}", editingShortcut.title) : t("skills.modal.titleNew", "새 스킬 추가")}
        </h3>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar select-text">
          {/* 1. 타이틀 및 아이콘 설정 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("skills.modal.nameLabel", "스킬 이름 (라벨)")}</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {showIconPicker ? t("skills.modal.iconToggleClose", "선택창 닫기") : t("skills.modal.iconToggleOpen", "아이콘 선택")}
              </button>
            </div>
            <div className="flex gap-2.5 items-center">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                <ShortcutIcon iconName={editingShortcut.icon} size={16} />
              </div>
              <input
                type="text"
                value={editingShortcut.title}
                onChange={(e) => setEditingShortcut({ ...editingShortcut, title: e.target.value })}
                className="flex-1 bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/80 text-xs text-white rounded-xl py-2.5 px-3.5 outline-none transition-all font-medium"
                placeholder={t("skills.modal.namePlaceholder", "스킬 이름을 입력하세요...")}
              />
            </div>
          </div>

          {/* 2. 아이콘 선택 영역 */}
          {showIconPicker && (
            <div className="animate-in fade-in duration-200">
              <EmojiIconPicker
                value={editingShortcut.icon}
                onChange={(val: string) => setEditingShortcut({ ...editingShortcut, icon: val })}
              />
            </div>
          )}

          {/* 3. 스킬 설명 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("skills.modal.descLabel", "스킬 한 줄 설명")}</label>
            <input
              type="text"
              value={editingShortcut.description}
              onChange={(e) => setEditingShortcut({ ...editingShortcut, description: e.target.value })}
              className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/80 text-xs text-white rounded-xl py-2.5 px-3.5 outline-none transition-all font-medium"
              placeholder={t("skills.modal.descPlaceholder", "스킬 설명을 입력하세요.")}
            />
          </div>

          {/* 4. 프롬프트 지침 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("skills.modal.promptLabel", "지침 프롬프트")}</label>
              <button
                type="button"
                onClick={onOptimize}
                disabled={isOptimizing || !editingShortcut.prompt.trim()}
                className={`text-[9px] font-bold transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer ${
                  isOptimizing || !editingShortcut.prompt.trim()
                    ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                    : "bg-indigo-950/40 text-indigo-400 border-indigo-500/20 hover:bg-indigo-900/30 hover:border-indigo-500/40"
                }`}
              >
                <Sparkles className={`w-3 h-3 ${isOptimizing ? "animate-spin" : ""}`} />
                {isOptimizing ? t("skills.modal.optimizing", "최적화 중...") : t("skills.modal.optimize", "AI 최적화")}
              </button>
            </div>
            <textarea
              value={editingShortcut.prompt}
              onChange={(e) => setEditingShortcut({ ...editingShortcut, prompt: e.target.value })}
              rows={8}
              className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/80 text-xs text-white rounded-xl py-3 px-3.5 outline-none resize-none font-medium font-mono leading-relaxed custom-scrollbar h-[220px]"
              placeholder={t("skills.modal.promptPlaceholder", "챗봇이 이 스킬을 실행할 때 참고할 세부 지침을 작성하세요...")}
            />
          </div>
            
          {/* 5. 데인저 존 */}
          {!isDefaultSkill && editingShortcut.id && (
            <div className="mt-6 pt-4 border-t border-rose-500/10 space-y-2 select-none">
              <button
                type="button"
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="text-[10px] font-bold text-rose-450/70 hover:text-rose-450 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showDangerZone ? t("skills.dangerZone.collapse", "위험 영역 접기") : t("skills.dangerZone.expand", "위험 영역 펼치기")}
              </button>
              
              {showDangerZone && (
                <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[9.5px] text-rose-400/80 leading-normal font-medium">
                    {t("skills.dangerZone.warning", "이 스킬을 정말 삭제하시겠습니까? 삭제한 후에는 복구할 수 없습니다.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("skills.dangerZone.confirmMsg", "이 스킬을 정말로 삭제하시겠습니까?"))) {
                        onDelete(editingShortcut.id);
                      }
                    }}
                    className="w-full py-2 rounded-lg border border-rose-500/40 bg-rose-600/20 hover:bg-rose-600 hover:border-rose-400 hover:text-white text-rose-450 text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Trash2 size={12} />
                    {t("skills.dangerZone.deleteBtn", "스킬 삭제 실행")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 w-full mt-5 pt-4 border-t border-white/[0.05] flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            {t("skills.modal.cancel", "취소")}
          </button>
          <button
            type="button"
            onClick={() => onSave(editingShortcut)}
            className="flex-1 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/80 text-white hover:bg-indigo-500 hover:border-indigo-400 text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
          >
            {t("skills.modal.save", "저장")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
