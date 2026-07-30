import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Sparkles, Trash2 } from "lucide-react";
import ShortcutIcon from "./ShortcutIcon";
import EmojiIconPicker from "./EmojiIconPicker";
import { Skill } from "../chatbot-types";
import { CustomDialog } from "./CustomDialog";


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
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  return (
    <>
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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Settings size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide">
                  {t("skills.editModal.title", "프롬프트 스킬 설정")}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {t("skills.editModal.subtitle", "스킬 명령어와 시스템 지침을 수정합니다.")}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar my-4 pr-1.5 space-y-4">
            {/* Title & Icon */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="text-[10px] font-bold text-slate-400 mb-1.5 block">
                  {t("skills.editModal.labelTitle", "스킬 이름")}
                </label>
                <input
                  type="text"
                  value={editingShortcut.title}
                  onChange={(e) => setEditingShortcut({ ...editingShortcut, title: e.target.value })}
                  placeholder={t("skills.editModal.titlePlaceholder", "예: 영문 요약가")}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-white text-xs outline-none focus:border-indigo-500 transition-colors font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1.5 block">
                  {t("skills.editModal.labelIcon", "아이콘")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full h-[38px] rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ShortcutIcon iconName={editingShortcut.icon} className="w-5 h-5 text-indigo-400" />
                </button>
              </div>
            </div>

            {/* Icon Picker Popover */}
            {showIconPicker && (
              <EmojiIconPicker
                value={editingShortcut.icon}
                onChange={(iconName: string) => {
                  setEditingShortcut({ ...editingShortcut, icon: iconName });
                  setShowIconPicker(false);
                }}
              />
            )}

            {/* Prompt Instruction */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 block">
                  {t("skills.editModal.labelInstruction", "AI 지침 (Prompt Instruction)")}
                </label>
                <button
                  type="button"
                  onClick={onOptimize}
                  disabled={isOptimizing || !editingShortcut.prompt.trim()}
                  className="text-[9.5px] font-extrabold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={11} className={isOptimizing ? "animate-spin" : ""} />
                  {isOptimizing ? t("skills.editModal.optimizing", "최적화 중...") : t("skills.editModal.optimizeBtn", "AI 지침 자동 최적화")}
                </button>
              </div>
              <textarea
                value={editingShortcut.prompt}
                onChange={(e) => setEditingShortcut({ ...editingShortcut, prompt: e.target.value })}
                placeholder={t("skills.editModal.instructionPlaceholder", "AI가 이 스킬 실행 시 준수해야 할 정밀 지침을 입력하세요...")}
                rows={7}
                className="w-full p-3 rounded-xl border border-white/10 bg-slate-900/80 text-white text-xs outline-none focus:border-indigo-500 transition-colors font-medium leading-relaxed resize-none custom-scrollbar"
              />
            </div>

            {/* Danger Zone for Custom Skills */}
            {!isDefaultSkill && (
              <div className="pt-2">
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
                      onClick={() => setIsConfirmOpen(true)}
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
              className="flex-1 py-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {t("common.cancel", "취소")}
            </button>
            <button
              type="button"
              onClick={() => onSave(editingShortcut)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {t("common.save", "저장")}
            </button>
          </div>
        </motion.div>
      </motion.div>

      <CustomDialog
        isOpen={isConfirmOpen}
        type="confirm"
        title={t("skills.dangerZone.confirmTitle", "스킬 삭제")}
        message={t("skills.dangerZone.confirmMsg", "이 스킬을 정말로 삭제하시겠습니까?")}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onDelete(editingShortcut.id);
        }}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={t("common.confirm", "확인")}
        cancelText={t("common.cancel", "취소")}
      />
    </>
  );
}
