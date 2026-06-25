import React, { useState } from "react";
import { Sparkles, Edit3, ChevronDown, ChevronUp } from "lucide-react";
import { Skill } from "../chatbot-types";

interface ShortcutBarProps {
  skills: Skill[];
  onSelectPrompt: (prompt: string) => void;
  onEditSkill?: (skill: Skill) => void;
  t: any;
}

export function ShortcutBar({
  skills,
  onSelectPrompt,
  onEditSkill,
  t
}: ShortcutBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-[11px] font-bold text-indigo-400 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          <span>{t("menu.prompts", "빠른 실행 단축키")}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 hover:text-white transition" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 hover:text-white transition" />
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-2 gap-1.5 mt-1 max-h-[140px] overflow-y-auto custom-scrollbar">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/[0.03] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition group text-left"
            >
              <button
                onClick={() => onSelectPrompt(skill.prompt)}
                className="flex-1 text-[10px] text-slate-300 font-semibold truncate hover:text-white cursor-pointer"
                title={skill.description || skill.prompt}
              >
                🚀 {skill.title}
              </button>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition gap-1 shrink-0 ml-1.5">
                {onEditSkill && (
                  <button
                    onClick={() => onEditSkill(skill)}
                    className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer border-0 bg-transparent"
                    title={t("common.edit", "수정")}
                  >
                    <Edit3 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
