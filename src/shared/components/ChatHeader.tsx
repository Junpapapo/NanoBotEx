import React from "react";
import { Minus, Maximize2, Minimize2, X, PanelRight } from "lucide-react";
import { UserSettings } from "../chatbot-types";
import { getThemePalette } from "../chatbot-constants";

const FAMOUS_QUOTES = [
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "In the middle of difficulty lies opportunity.",
  "Simplicity is the ultimate sophistication.",
  "Act as if what you do makes a difference. It does.",
  "Stay hungry, stay foolish.",
  "Innovation distinguishes between a leader and a follower.",
  "Make each day your masterpiece.",
  "The best way to predict the future is to invent it.",
  "Dream big and dare to fail."
];

interface ChatHeaderProps {
  settings: UserSettings;
  isSupported: boolean;
  effectiveAIAvatar: string;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isSending: boolean;
  showRightMenu: boolean;
  onToggleRightMenu: () => void;
  layoutMode: "sidepanel" | "widget";
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
  showRightMenu,
  onToggleRightMenu,
  layoutMode,
  t
}: ChatHeaderProps) {
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");
  
  const [quote] = React.useState(() => {
    const idx = Math.floor(Math.random() * FAMOUS_QUOTES.length);
    return FAMOUS_QUOTES[idx];
  });

  const getAvatarUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    try {
      return chrome.runtime.getURL(path);
    } catch {
      return path; // fallback
    }
  };

  const isLight = settings.nano_skin_mode === "light";
  const quoteColor = isLight ? "#b47d06" : "#dfba5a"; // 어두운 골드 vs 밝은 골드
  const quoteShadow = isLight ? "none" : "0 1px 2px rgba(0,0,0,0.3)";

  return (
    <div className={`h-14 border-b ${theme.borderMuted} ${theme.bgHeader} px-4 flex items-center justify-between flex-shrink-0 select-none`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
        <div className="relative flex-shrink-0">
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
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-black ${theme.textMain} flex items-center gap-1.5`}>
            <span className="truncate">{settings.nano_ai_avatar_name || "Nano AI 챗봇"}</span>
            {settings.api_mode === "api" && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase font-mono flex-shrink-0">
                API
              </span>
            )}
          </div>
          <div 
            className="text-[9.5px] font-normal font-serif italic tracking-wide truncate w-full" 
            style={{ color: quoteColor, textShadow: quoteShadow }}
            title={quote}
          >
            "{quote}"
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleRightMenu}
          className={`w-7 h-7 rounded-lg ${theme.bgHover} flex items-center justify-center ${
            showRightMenu ? theme.textMain : "text-slate-500 hover:text-slate-350"
          } transition-all cursor-pointer`}
          title={showRightMenu ? t("chatbot.tooltips.hideRightMenu", "오른쪽 메뉴 숨기기") : t("chatbot.tooltips.showRightMenu", "오른쪽 메뉴 보이기")}
        >
          <PanelRight size={14} />
        </button>
        {layoutMode !== "sidepanel" && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
