import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plus, ChevronRight, ChevronLeft, Settings, Search } from "lucide-react";
import ShortcutIcon from "./ShortcutIcon";

import { Skill, UserSettings } from "../chatbot-types";

interface PromptsSidebarProps {
  skills: Skill[];
  activeSkill: Skill | null;
  setActiveSkill: (skill: Skill | null) => void;
  isPromptsBarOpen: boolean;
  isShortcutsExpanded: boolean;
  setIsShortcutsExpanded: (expanded: boolean) => void;
  setEditingSkill: (skill: Skill | null) => void;
  setShowIconPicker: (show: boolean) => void;
  theme: any;
  settings: UserSettings;
  t: any;
}

export function PromptsSidebar({
  skills,
  activeSkill,
  setActiveSkill,
  isPromptsBarOpen,
  isShortcutsExpanded,
  setIsShortcutsExpanded,
  setEditingSkill,
  setShowIconPicker,
  theme,
  settings,
  t
}: PromptsSidebarProps) {
  const isLight = settings.nano_skin_mode === "light";
  const [mounted, setMounted] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const findSkill = skills.find(s => s.id === "find-skills");
  const isFindSkillActive = activeSkill?.id === "find-skills";
  const displaySkills = skills.filter(s => s.id !== "find-skills");

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, skill: Skill) => {
    setHoveredSkill(skill);
    const btnRect = e.currentTarget.getBoundingClientRect();
    const frame = document.getElementById("nanobot-chat-frame");
    if (frame) {
      const frameRect = frame.getBoundingClientRect();
      setTooltipPos({
        top: btnRect.top - frameRect.top + btnRect.height / 2,
        left: btnRect.left - frameRect.left - 8 // 8px 왼쪽 마진
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredSkill(null);
    setTooltipPos(null);
  };

  if (!isPromptsBarOpen) return null;

  const hoverBgClass = theme.primary.replace("bg-", "hover:bg-");

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isShortcutsExpanded ? 180 : 64, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={`border-l ${
        isLight ? "border-slate-200/80 bg-slate-100/30" : "border-white/[0.06] bg-slate-950/40"
      } flex flex-col items-center py-4 px-1 flex-shrink-0 select-none z-[50] h-full`}
    >
      <div className={`w-full flex items-center justify-between px-2.5 mb-1.5 flex-shrink-0 ${isShortcutsExpanded ? "flex-row" : "flex-col gap-1.5"}`}>
        <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase">
          {t("skills.header", "SKILLS")}
        </span>
        {findSkill && (
          <div className="relative group flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActiveSkill(isFindSkillActive ? null : findSkill)}
              onMouseEnter={(e) => handleMouseEnter(e, findSkill)}
              onMouseLeave={handleMouseLeave}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 border ${
                isFindSkillActive
                  ? "bg-amber-500 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/20"
                  : isLight 
                    ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300" 
                    : "bg-amber-950/15 border-amber-500/30 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.15)] hover:bg-amber-950/30 hover:border-amber-400/50"
              } ${theme.bookmarksHover}`}
              title={findSkill.title}
            >
              <Search size={14} />
            </button>

            {/* 호버 시 나타나는 편집 버튼 */}
            <button
              onClick={() => {
                setEditingSkill(findSkill);
                setShowIconPicker(false);
              }}
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/[0.1] shadow cursor-pointer z-10 ${hoverBgClass}`}
              title={t("skills.edit", "스킬 설정")}
            >
              <Settings size={10} />
            </button>
          </div>
        )}
      </div>
      
      <div className={`flex-1 w-full overflow-y-auto custom-scrollbar pr-0.5 mt-2 transition-all duration-300 ${
        isShortcutsExpanded 
          ? "grid grid-cols-2 gap-x-2 gap-y-3.5 p-1 items-start content-start" 
          : "flex flex-col items-center gap-3.5"
      }`}>
        {displaySkills.map((skill) => {
          const isActive = activeSkill?.id === skill.id;
          return (
            <div key={skill.id} className={`relative group flex flex-col items-center ${isShortcutsExpanded ? "w-full" : ""}`}>
              <button
                onClick={() => setActiveSkill(isActive ? null : skill)}
                onMouseEnter={(e) => handleMouseEnter(e, skill)}
                onMouseLeave={handleMouseLeave}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 border ${
                  isActive
                    ? `${theme.primary} border-white/20 text-white ring-2 ring-white/10 ${theme.shadow}`
                    : isLight 
                      ? "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50" 
                      : "bg-slate-900 border-white/[0.06] text-slate-300 hover:text-white"
                } ${theme.bookmarksHover}`}
                title={skill.title}
              >
                <ShortcutIcon iconName={skill.icon} size={15} />
              </button>

              {/* 호버 시 나타나는 편집 버튼 */}
              <button
                onClick={() => {
                  setEditingSkill(skill);
                  setShowIconPicker(false);
                }}
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/[0.1] shadow cursor-pointer z-10 ${hoverBgClass}`}
                title={t("skills.edit", "스킬 설정")}
              >
                <Settings size={10} />
              </button>

              {isShortcutsExpanded && (
                <span className={`text-[8.5px] ${
                  isLight ? "text-slate-600" : "text-slate-400"
                } font-extrabold mt-1 select-none truncate max-w-[76px] text-center leading-normal animate-in fade-in duration-300`}>
                  {skill.title}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 제어 버튼 영역 */}
      <div className={`mt-auto pt-3 border-t ${
        isLight ? "border-slate-200" : "border-white/[0.06]"
      } flex w-full justify-center shrink-0 ${
        isShortcutsExpanded ? "flex-row gap-2.5 px-1.5" : "flex-col items-center gap-2.5"
      }`}>
        <button
          onClick={() => {
            setEditingSkill({
              id: "",
              icon: "Sparkles",
              title: t("skills.modal.titleNew", "새 스킬"),
              description: t("skills.modal.descPlaceholder", "스킬 설명을 입력하세요."),
              prompt: "",
            });
            setShowIconPicker(false);
          }}
          className={`w-8 h-8 rounded-xl ${
            isLight
              ? "bg-white border-slate-300 border-dashed text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              : "bg-slate-900/60 border border-dashed border-slate-700 text-slate-500 hover:text-white"
          } flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${theme.bookmarksHover}`}
          title={t("skills.addNew", "새 스킬 추가")}
        >
          <Plus size={14} />
        </button>

        <button
          onClick={() => setIsShortcutsExpanded(!isShortcutsExpanded)}
          className={`w-8 h-8 rounded-xl ${
            isLight
              ? "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              : "bg-slate-900 border-white/[0.06] text-slate-400 hover:text-white"
          } border flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${theme.bookmarksHover}`}
          title={isShortcutsExpanded ? t("skills.collapse", "접기") : t("skills.expand", "펼치기")}
        >
          {isShortcutsExpanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {mounted && hoveredSkill && tooltipPos && (
        (() => {
          const frame = document.getElementById("nanobot-chat-frame");
          if (!frame) return null;
          return createPortal(
            <div 
              className={`absolute z-[9999] px-2.5 py-1.5 ${
                isLight 
                  ? "bg-white border-slate-200 text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.06)]" 
                  : "bg-[#090d1f]/95 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              } border text-[10px] rounded-lg pointer-events-none transition-all duration-150 whitespace-nowrap font-medium max-w-[240px] ${theme.border}`}
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: "translate(-100%, -50%)"
              }}
            >
              <div className={`font-bold mb-0.5 ${theme.text}`}>{hoveredSkill.title}</div>
              <div className={`${isLight ? "text-slate-500" : "text-slate-400"} truncate text-[9px] max-w-[180px]`}>{hoveredSkill.description}</div>
            </div>,
            frame
          );
        })()
      )}
    </motion.div>
  );
}
