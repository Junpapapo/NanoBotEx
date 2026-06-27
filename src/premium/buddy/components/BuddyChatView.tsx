import React from "react";
import { Message, BuddySettings } from "../../../shared/chatbot-types";
import { ChatMessageList } from "../../../shared/components/ChatMessageList";
import { ChatInput } from "../../../shared/components/ChatInput";
import { Key, Brain, ShieldCheck } from "lucide-react";
import { BUDDY_QUICK_MENU_ITEMS } from "../buddy-constants";

interface BuddyChatViewProps {
  messages: Message[];
  memoriesCount: number;
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  buddySettings: BuddySettings;
  theme: any;
  t: (key: string, def: string) => string;
  onOpenGuideSection?: (section: string) => void;
}

export function BuddyChatView({
  messages,
  memoriesCount,
  isSending,
  sendMessage,
  stopGeneration,
  buddySettings,
  theme,
  t,
  onOpenGuideSection
}: BuddyChatViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* 프라이버시 & 메모리 알림 상단 바 */}
      <div
        className={`px-4 py-2 text-[10.5px] border-b ${theme.borderMuted} ${theme.bgInput} flex items-center justify-between z-[5] select-none`}
      >
        <div className="relative group flex items-center cursor-help">
          <div className="flex items-center gap-1 text-purple-400 font-black transition-opacity hover:opacity-85">
            <ShieldCheck size={12} />
            <Key size={12} className="text-amber-400" />
          </div>
          {/* 커스텀 툴팁 */}
          <div className="absolute left-0 top-6 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 origin-top-left flex items-center bg-slate-950/95 border border-white/[0.08] text-white text-[9.5px] py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-2xl z-[60]">
            <span>{t("buddy.chat.secure", "프라이빗 종단간 암호화 적용됨")}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-extrabold text-[10px]">
          <Brain size={11} className="text-purple-400" />
          <span>
            {t("buddy.chat.memories", "버디 기억")}: {memoriesCount}/50
          </span>
        </div>
      </div>

      {/* 메시지 리스트 */}
      <ChatMessageList
        messages={messages}
        settings={
          {
            nano_ai_avatar: buddySettings.buddy_avatar,
            nano_ai_avatar_name: buddySettings.buddy_name,
            nano_chat_font: "sans",
            nano_chat_font_size: "medium",
          } as any
        }
        isSupported={true}
        effectiveAIAvatar={buddySettings.buddy_avatar}
        onQuickQuestion={(text) => sendMessage(text)}
        onOpenGuideSection={onOpenGuideSection}
        t={t}
        isBuddy={true}
        quickMenuItems={BUDDY_QUICK_MENU_ITEMS}
      />

      {/* 입력기 */}
      <ChatInput
        onSendMessage={sendMessage}
        isSending={isSending}
        onStop={stopGeneration}
        settings={
          {
            nano_chat_font: "sans",
            nano_chat_font_size: "medium",
          } as any
        }
        t={t}
        externalText=""
        onClearExternalText={() => {}}
      />
    </div>
  );
}
