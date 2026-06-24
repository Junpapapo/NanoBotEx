import React, { useRef, useEffect } from "react";
import { Message, UserSettings } from "../chatbot-types";
import { ChatMessageItem } from "./ChatMessageItem";
import { Terminal } from "lucide-react";
import { getThemePalette } from "../chatbot-constants";
import { AIAvatar } from "./AIAvatar";

interface ChatMessageListProps {
  messages: Message[];
  settings: UserSettings;
  isSupported: boolean;
  effectiveAIAvatar: string;
  onQuickQuestion: (text: string) => void;
  onOpenGuideSection?: (section: string) => void;
  t: any;
}

export function ChatMessageList({
  messages,
  settings,
  isSupported,
  effectiveAIAvatar,
  onQuickQuestion,
  onOpenGuideSection,
  t
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPrompts = [
    { text: t("chatbot.quickPrompts.p1.text", "Chrome Gemini Nano의 개념을 알려줘."), label: t("chatbot.quickPrompts.p1.label", "Chrome AI란?") },
    { text: t("chatbot.quickPrompts.p2.text", "온디바이스 AI의 주요 장점 3가지는 무엇인가요?"), label: t("chatbot.quickPrompts.p2.label", "온디바이스 AI 장점") },
    { text: t("chatbot.quickPrompts.p3.text", "이 프로젝트를 다른 서비스에 어떻게 연동할 수 있어?"), label: t("chatbot.quickPrompts.p3.label", "연동 가이드") }
  ];

  const setupGuides = [
    { section: "flags", label: t("chatbot.setupGuides.g1.label", "🛠️ 1단계: 크롬 Flags 활성화") },
    { section: "api", label: t("chatbot.setupGuides.g2.label", "📦 2단계: 컴포넌트 다운로드") },
    { section: "check", label: t("chatbot.setupGuides.g3.label", "❓ 3단계: 연결 문제 해결 (Troubleshoot)") }
  ];

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none my-auto">
          <div className="mb-4">
            <AIAvatar avatarPath={effectiveAIAvatar} size={96} />
          </div>
          <h3 className={`text-sm font-black ${theme.textMain} mb-2`}>
            {t("chatbot.welcome.title", "Hi, I'm")} {settings.nano_ai_avatar_name || "Nano AI"}.
          </h3>
          <p className={`text-[11px] ${theme.textSub} leading-relaxed max-w-[280px] mb-6`}>
            {t("chatbot.welcome.desc", "Chrome의 온디바이스 AI(Gemini Nano) 또는 외부 API 연동을 활용해 동작하는 범용 챗봇입니다.")}
          </p>

          <div className="w-full max-w-[320px] flex flex-col gap-2">
            <div className={`text-[9px] font-bold ${theme.textSub} tracking-wider uppercase text-left pl-1 flex items-center gap-1.5`}>
              <Terminal size={10} /> {t("chatbot.quickPrompts.title", "빠른 시작 프롬프트")}
            </div>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onQuickQuestion(p.text)}
                className={`w-full text-left py-2.5 px-4 rounded-xl border ${theme.borderMuted} ${theme.bgInput} hover:bg-indigo-600/10 hover:border-indigo-500/30 ${theme.textSub} hover:${theme.textMain} text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-full max-w-[320px] flex flex-col gap-2 mt-4 pt-4 border-t border-white/[0.04]">
            <div className={`text-[9px] font-bold ${theme.textSub} tracking-wider uppercase text-left pl-1 flex items-center gap-1.5`}>
              <Terminal size={10} /> {t("chatbot.setupGuides.title", "크롬 나노AI 설정 가이드")}
            </div>
            {setupGuides.map((g, idx) => (
              <button
                key={idx}
                onClick={() => onOpenGuideSection?.(g.section)}
                className={`w-full text-left py-2.5 px-4 rounded-xl border border-dashed ${theme.borderMuted} bg-slate-950/20 hover:bg-emerald-600/10 hover:border-emerald-500/30 ${theme.textSub} hover:${theme.textMain} text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((m) => (
          <ChatMessageItem key={m.id} message={m} settings={settings} effectiveAIAvatar={effectiveAIAvatar} />
        ))
      )}
    </div>
  );
}
