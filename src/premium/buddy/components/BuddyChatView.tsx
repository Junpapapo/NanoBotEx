import React from "react";
import { Message, BuddySettings } from "../../../shared/chatbot-types";
import { ChatMessageList } from "../../../shared/components/ChatMessageList";
import { ChatInput } from "../../../shared/components/ChatInput";
import { ShieldCheck, Brain } from "lucide-react";

interface BuddyChatViewProps {
  messages: Message[];
  memoriesCount: number;
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  buddySettings: BuddySettings;
  theme: any;
  t: (key: string, def: string) => string;
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
}: BuddyChatViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* 프라이버시 & 메모리 알림 상단 바 */}
      <div
        className={`px-4 py-2 text-[10.5px] border-b ${theme.borderMuted} ${theme.bgInput} flex items-center justify-between z-[5] select-none`}
      >
        <div className="flex items-center gap-1.5 text-purple-400 font-black">
          <ShieldCheck size={12} />
          <span>{t("buddy.chat.secure", "🔒 프라이빗 종단간 암호화 적용됨")}</span>
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
        onOpenGuideSection={() => {}}
        t={t}
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
