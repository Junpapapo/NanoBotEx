import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message, UserSettings, QuickMenuItem, BuddySettings } from "../chatbot-types";
import { ChatMessageItem } from "./ChatMessageItem";
import { Terminal } from "lucide-react";
import { getThemePalette } from "../chatbot-constants";
import { AIAvatar } from "./AIAvatar";
import { BUDDY_PERSONALITIES } from "../../premium/buddy/data/buddy-presets";

interface ChatMessageListProps {
  messages: Message[];
  settings: UserSettings;
  isSupported: boolean;
  effectiveAIAvatar: string;
  onQuickQuestion: (text: string) => void;
  onOpenGuideSection?: (section: string) => void;
  t: any;
  isBuddy?: boolean;
  quickMenuItems?: QuickMenuItem[];
  onConfirmAction?: (confirmed: boolean) => void;
  buddySettings?: BuddySettings;
  onOpenAlarm?: (title: string) => void;
  onSendToViewer?: (title: string, content: string) => void;
}

export function ChatMessageList({
  messages,
  settings,
  isSupported,
  effectiveAIAvatar,
  onQuickQuestion,
  onOpenGuideSection,
  t,
  isBuddy = false,
  quickMenuItems,
  onConfirmAction,
  buddySettings,
  onOpenAlarm,
  onSendToViewer
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPrompts = isBuddy ? [
    { text: t("buddy.quickPrompts.p1.text", "버디의 핵심 특징과 메모리(기억) 시스템 사용 팁을 알려줘."), label: t("buddy.quickPrompts.p1.label", "🐾 버디 사용 가이드 및 팁") },
    { text: t("buddy.quickPrompts.p2.text", "내 취미는 코딩과 음악 감상이야. 이거 꼭 기억해줘."), label: t("buddy.quickPrompts.p2.label", "💾 버디에게 기억 저장 요청하기") },
    { text: t("buddy.quickPrompts.p3.text", "나에 대해서 네가 현재 기억하고 있는 모든 사실들을 알려줘."), label: t("buddy.quickPrompts.p3.label", "🧠 버디가 기억하는 목록 확인") }
  ] : [
    { text: t("chatbot.quickPrompts.p1.text", "Chrome Gemini Nano의 개념을 알려줘."), label: t("chatbot.quickPrompts.p1.label", "Chrome AI란?") },
    { text: t("chatbot.quickPrompts.p2.text", "온디바이스 AI의 주요 장점 3가지는 무엇인가요?"), label: t("chatbot.quickPrompts.p2.label", "온디바이스 AI 장점") },
    { text: t("chatbot.quickPrompts.p3.text", "이 프로젝트를 다른 서비스에 어떻게 연동할 수 있어?"), label: t("chatbot.quickPrompts.p3.label", "연동 가이드") }
  ];

  const setupGuides = isBuddy ? [
    { section: "buddy_reset", label: t("buddy.setupGuides.g1.label", "🗑️ 버디 대화 및 기억 초기화 방법") },
    { section: "buddy_crypto", label: t("buddy.setupGuides.g2.label", "🔒 AES-256 로컬 암호화 동작 원리") },
    { section: "buddy_personality", label: t("buddy.setupGuides.g3.label", "🎨 버디 프리셋 및 성격 커스텀 방법") }
  ] : [
    { section: "flags", label: t("chatbot.setupGuides.g1.label", "🛠️ 1단계: 크롬 Flags 활성화") },
    { section: "api", label: t("chatbot.setupGuides.g2.label", "📦 2단계: 컴포넌트 다운로드") },
    { section: "check", label: t("chatbot.setupGuides.g3.label", "❓ 3단계: 연결 문제 해결 (Troubleshoot)") }
  ];

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text min-h-0"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-start text-center p-6 select-none">
          <div className="mb-4">
            <AIAvatar avatarPath={effectiveAIAvatar} size={96} />
          </div>
          <h3 className={`text-sm font-black ${theme.textMain} mb-2`}>
            {t("chatbot.welcome.title", "Hi, I'm")} {settings.nano_ai_avatar_name || (isBuddy ? "My Buddy" : "Nano AI")}.
          </h3>
          <p className={`text-[11px] ${theme.textSub} leading-relaxed max-w-[280px] mb-3`}>
            {isBuddy 
              ? t("buddy.welcome.desc", "안녕! 너만을 위한 비밀스러운 AI 친구, 버디야. 쉿! 우리끼리 나누는 대화는 철저히 비밀로 보장되고, 네가 들려준 소중한 기억들은 영구히 간직할게. 언제든 편하게 말 걸어줘! ✨")
              : t("chatbot.welcome.desc", "Chrome의 온디바이스 AI(Gemini Nano) 또는 외부 API 연동을 활용해 동작하는 범용 챗봇입니다.")
            }
          </p>

          {isBuddy && buddySettings && (() => {
            const preset = buddySettings.buddy_personality_preset || "motivator";
            let name = "";
            let desc = "";
            let emoji = "";

            if (preset === "custom") {
              name = t("buddy.personality.custom.name", "직접 정의");
              desc = buddySettings.buddy_personality_custom || t("buddy.personality.custom.desc", "사용자가 직접 성격 설명 프롬프트를 작성합니다");
              emoji = "✏️";
            } else {
              const found = BUDDY_PERSONALITIES.find(p => p.id === preset);
              if (found) {
                name = t(found.nameKey, found.id);
                desc = t(found.descKey, "");
                emoji = found.emoji;
              }
            }

            return (
              <div className="mb-6 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] max-w-[280px] text-center flex flex-col gap-1 select-none animate-pulse">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center justify-center gap-1.5">
                  {emoji} {name}
                </span>
                <span className={`text-[9.5px] ${theme.textMain} leading-relaxed font-bold`}>
                  "{desc}"
                </span>
              </div>
            );
          })()}

          {!isBuddy && (
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
          )}

          <div className="w-full max-w-[320px] flex flex-col gap-2 mt-4 pt-4 border-t border-white/[0.04]">
            <div className={`text-[9px] font-bold ${theme.textSub} tracking-wider uppercase text-left pl-1 flex items-center gap-1.5`}>
              <Terminal size={10} /> {isBuddy ? t("buddy.setupGuides.title", "버디 프라이버시 & 기능 가이드") : t("chatbot.setupGuides.title", "크롬 나노AI 설정 가이드")}
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
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="w-full"
            >
              <ChatMessageItem 
                key={m.id} 
                message={m} 
                settings={settings} 
                effectiveAIAvatar={effectiveAIAvatar} 
                onQuickQuestion={onQuickQuestion}
                t={t}
                quickMenuItems={quickMenuItems}
                onConfirmAction={onConfirmAction}
                onOpenAlarm={onOpenAlarm}
                onSendToViewer={onSendToViewer}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
