import React from "react";
import { Minus, Maximize2, Minimize2, X } from "lucide-react";
import { UserSettings } from "../chatbot-types";
import { getThemePalette } from "../chatbot-constants";

interface ChatHeaderProps {
  settings: UserSettings;
  isSupported: boolean;
  effectiveAIAvatar: string;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isSending: boolean;
  t: any;
}

export function ChatHeader({
  settings,
  isSupported,
  effectiveAIAvatar,
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onClose,
  isSending,
  t
}: ChatHeaderProps) {
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");

  const getAvatarUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    try {
      return chrome.runtime.getURL(path);
    } catch {
      return path; // fallback
    }
  };

  return (
    <div className={`h-14 border-b ${theme.borderMuted} ${theme.bgHeader} px-4 flex items-center justify-between flex-shrink-0 select-none`}>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          {effectiveAIAvatar ? (
            <img src={getAvatarUrl(effectiveAIAvatar)} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-xs">N</div>
          )}
          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${
            isSending 
              ? "bg-indigo-500 animate-pulse" 
              : isSupported 
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          }`} />
        </div>
        <div>
          <div className={`text-xs font-black ${theme.textMain} flex items-center gap-1.5`}>
            <span>{settings.nano_ai_avatar_name || "Nano AI 챗봇"}</span>
            {settings.api_mode === "api" && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase font-mono">
                API
              </span>
            )}
          </div>
          <div className={`text-[10px] ${theme.textSub}`}>
            {isSending ? t("chatbot.status.writing", "답변 작성 중...") : isSupported ? t("chatbot.status.localReady", "로컬 AI 준비 완료") : t("chatbot.status.fallbackActive", "외부 API 사용 가능")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onMinimize}
          className={`w-7 h-7 rounded-lg ${theme.bgHover} flex items-center justify-center ${theme.textSub} hover:${theme.textMain} transition-all cursor-pointer`}
          title={t("chatbot.tooltips.minimize", "최소화")}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={onToggleMaximize}
          className={`w-7 h-7 rounded-lg ${theme.bgHover} flex items-center justify-center ${theme.textSub} hover:${theme.textMain} transition-all cursor-pointer`}
          title={isMaximized ? t("chatbot.tooltips.restore", "이전 크기로") : t("chatbot.tooltips.maximize", "최대화")}
        >
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={onClose}
          className={`w-7 h-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 flex items-center justify-center ${theme.textSub} transition-all cursor-pointer`}
          title={t("chatbot.tooltips.close", "닫기")}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
