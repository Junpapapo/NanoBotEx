import React, { useState, useRef, useEffect } from "react";
import { Send, Square, CornerDownLeft, Globe } from "lucide-react";
import { UserSettings } from "../chatbot-types";
import { getThemePalette } from "../chatbot-constants";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
  onStop: () => void;
  externalText?: string;
  onClearExternalText?: () => void;
  settings: UserSettings;
  t: any;
  updateSettings?: (settings: Partial<UserSettings>) => void;
}

const focusWithinBorderMap: Record<string, string> = {
  indigo: "focus-within:border-indigo-500/85",
  rose: "focus-within:border-rose-500/85",
  emerald: "focus-within:border-emerald-500/85",
  amber: "focus-within:border-amber-500/85",
  violet: "focus-within:border-violet-500/85"
};

const btnBgMap: Record<string, string> = {
  indigo: "bg-indigo-600 border border-indigo-500/30 hover:bg-indigo-500 shadow-indigo-500/10",
  rose: "bg-rose-600 border border-rose-500/30 hover:bg-rose-500 shadow-rose-500/10",
  emerald: "bg-emerald-600 border border-emerald-500/30 hover:bg-emerald-500 shadow-emerald-500/10",
  amber: "bg-amber-600 border border-amber-500/30 hover:bg-amber-500 shadow-amber-500/10",
  violet: "bg-violet-600 border border-violet-500/30 hover:bg-violet-500 shadow-violet-500/10"
};

export function ChatInput({
  onSendMessage,
  isSending,
  onStop,
  externalText = "",
  onClearExternalText,
  settings,
  t,
  updateSettings
}: ChatInputProps) {
  const themeKey = settings.nano_theme_color || "indigo";
  const theme = getThemePalette(themeKey, settings.nano_skin_mode || "dark");
  const isLight = settings.nano_skin_mode === "light";
  
  const [input, setInput] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (externalText) {
      setInput((prev) => (prev ? prev + "\n" + externalText : externalText));
      if (onClearExternalText) onClearExternalText();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [externalText, onClearExternalText]);

  // 답변이 완료되면(즉, isSending이 true -> false로 변경될 때) 입력 박스에 자동 포커싱을 적용합니다.
  const wasSendingRef = useRef<boolean>(isSending);
  useEffect(() => {
    if (wasSendingRef.current && !isSending) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
    wasSendingRef.current = isSending;
  }, [isSending]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // IME 입력기(일본어 한자 변환, 한글 조합 등)가 작동 중일 때는 전송 방지
      if (e.nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`p-3 border-t ${theme.borderMuted} ${theme.bgInput} flex-shrink-0 flex flex-col gap-2`}>
      <div className={`relative flex items-end ${theme.bgSub} border rounded-2xl pl-2.5 pr-1 py-1.5 transition-all ${
        isSending 
          ? "aurora-glow" 
          : `${theme.borderMuted} ${focusWithinBorderMap[themeKey] || focusWithinBorderMap.indigo}`
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSending ? t("chatbot.input.loadingPlaceholder", "로딩 중...") : t("chatbot.input.placeholder", "질문을 입력하세요...")}
          disabled={isSending}
          rows={2}
          className={`flex-1 bg-transparent border-0 outline-none combat-outline-none resize-none text-xs ${theme.textMain} max-h-24 min-h-[36px] placeholder-slate-500 px-2 py-1.5 custom-scrollbar max-w-[calc(100%-80px)]`}
        />

        <div className="flex items-center gap-1.5 self-end flex-shrink-0">
          {!isSending && (() => {
            // 설정이 없을 시 기본값을 'auto'로 추정하도록 폴백 강화
            const currentMode = settings.nano_web_search_mode || (settings.nano_web_search_enabled !== undefined ? (settings.nano_web_search_enabled ? "force" : "off") : "auto");
            
            // 모드별 전환 순환 핸들러
            const handleToggle = () => {
              let nextMode: "off" | "auto" | "force" = "off";
              if (currentMode === "off") nextMode = "auto";
              else if (currentMode === "auto") nextMode = "force";
              else nextMode = "off";

              if (updateSettings) {
                updateSettings({
                  nano_web_search_mode: nextMode,
                  // 하위 호환성을 위해 기존 Boolean 값도 연동
                  nano_web_search_enabled: nextMode !== "off"
                });
              }
            };

            // Auto 모드의 테마별 스타일 맵
            const getAutoBtnClass = () => {
              const baseMap: Record<string, string> = {
                indigo: isLight ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100" : "bg-indigo-950/40 border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/80 hover:text-indigo-300",
                rose: isLight ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" : "bg-rose-950/40 border-rose-500/30 text-rose-400 hover:bg-rose-950/80 hover:text-rose-300",
                emerald: isLight ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/80 hover:text-emerald-300",
                amber: isLight ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100" : "bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-950/80 hover:text-amber-300",
                violet: isLight ? "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100" : "bg-violet-950/40 border-violet-500/30 text-violet-400 hover:bg-violet-950/80 hover:text-violet-300"
              };
              return baseMap[themeKey] || baseMap.indigo;
            };

            let btnClass = "";
            let tooltipTitle = "";
            let badgeText = "";
            let badgeClass = "";

            if (currentMode === "off") {
              btnClass = isLight
                ? "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-500"
                : "bg-slate-800/30 border-white/[0.04] text-slate-500 hover:bg-slate-800/60 hover:text-slate-400";
              tooltipTitle = t("chatbot.input.webSearchOff", "실시간 검색 꺼짐");
            } else if (currentMode === "auto") {
              btnClass = getAutoBtnClass() + " shadow-[0_0_10px_rgba(99,102,241,0.15)]";
              tooltipTitle = t("chatbot.input.webSearchAuto", "실시간 검색: AI 자동 판단");
              badgeText = "AUTO";
              badgeClass = isLight
                ? "bg-indigo-600 text-white border border-indigo-400/30"
                : "bg-indigo-950 text-indigo-300 border border-indigo-500/40 animate-pulse";
            } else {
              // force
              btnClass = "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-500 text-white hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]";
              tooltipTitle = t("chatbot.input.webSearchForce", "실시간 검색: 강제 활성화");
              badgeText = "LIVE";
              badgeClass = "bg-emerald-700 text-emerald-100 border border-emerald-500/40";
            }

            return (
              <button
                type="button"
                onClick={handleToggle}
                className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md border ${btnClass}`}
                title={tooltipTitle}
              >
                <Globe size={13} className={currentMode === "off" ? "opacity-60" : "opacity-100"} />
                {badgeText && (
                  <span className={`absolute -top-1.5 -right-2 text-[6.5px] font-black px-1 py-0.5 rounded-full flex items-center justify-center select-none tracking-tighter ${badgeClass}`}>
                    {badgeText}
                  </span>
                )}
              </button>
            );
          })()}

          {isSending ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title={t("chatbot.input.stop", "중지")}
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`w-8 h-8 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-40 ${
                btnBgMap[themeKey] || btnBgMap.indigo
              }`}
              title={t("chatbot.input.send", "전송")}
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>
      <div className={`text-[9px] ${theme.textSub} px-1.5 flex justify-between select-none`}>
        <span>{t("chatbot.input.hint", "Shift + Enter로 줄바꿈")}</span>
        <span className="flex items-center gap-0.5"><CornerDownLeft size={8} /> Nano AI</span>
      </div>
    </div>
  );
}
