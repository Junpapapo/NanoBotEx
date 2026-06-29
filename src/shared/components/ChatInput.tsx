import React, { useState, useRef, useEffect } from "react";
import { Send, Square, CornerDownLeft } from "lucide-react";
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
  t
}: ChatInputProps) {
  const themeKey = settings.nano_theme_color || "indigo";
  const theme = getThemePalette(themeKey, settings.nano_skin_mode || "dark");
  
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
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`p-3 border-t ${theme.borderMuted} ${theme.bgInput} flex-shrink-0 flex flex-col gap-2`}>
      <div className={`relative flex items-end ${theme.bgSub} border rounded-2xl p-2 transition-all ${
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
          className={`flex-1 bg-transparent border-0 outline-none combat-outline-none resize-none text-xs ${theme.textMain} max-h-24 min-h-[36px] placeholder-slate-500 px-2 py-1.5 custom-scrollbar`}
        />

        <div className="flex items-center gap-1.5 self-end flex-shrink-0">
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
