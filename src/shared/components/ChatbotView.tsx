import React, { useState } from "react";
import { MessageSquare, Cpu, FileText, RefreshCw } from "lucide-react";
import { UserSettings, Skill } from "../chatbot-types";
import { useChatbotSession } from "../hooks/useChatbotSession";
import { getThemePalette } from "../chatbot-constants";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { GuidePanel } from "./GuidePanel";
import { MemoPanel } from "./MemoPanel";
import { HistoryBar } from "./HistoryBar";
import { ShortcutBar } from "./ShortcutBar";
import { BookmarkBar } from "./BookmarkBar";
import { CustomDialog } from "./CustomDialog";

interface ChatbotViewProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  skills: Skill[];
  activeSkill: Skill | null;
  setActiveSkill: (skill: Skill | null) => void;
  isSupported: boolean;
  effectiveAIAvatar: string;
  t: any;
  locale: string;
}

export function ChatbotView({
  settings,
  updateSettings,
  skills,
  activeSkill,
  setActiveSkill,
  isSupported,
  effectiveAIAvatar,
  t,
  locale
}: ChatbotViewProps) {
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");

  const {
    messages,
    isSending,
    sendMessage,
    resetConversation,
    stopGeneration,
    sessions,
    currentSessionId,
    loadSession,
    deleteSession
  } = useChatbotSession(true, settings, activeSkill, skills, t);

  const [activePanel, setActivePanel] = useState<"none" | "history" | "memo" | "guide">("none");
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setDialogState(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleResetChat = () => {
    showConfirm(
      t("dialog.reset.title", "대화 초기화"),
      t("dialog.reset.message", "현재 세션의 모든 대화 기록을 지우고 초기화하시겠습니까?"),
      () => {
        resetConversation();
      }
    );
  };

  const handleQuickQuestion = (text: string) => {
    sendMessage(text);
  };

  const togglePanel = (panel: "history" | "memo" | "guide") => {
    setActivePanel(prev => (prev === panel ? "none" : panel));
  };

  const defaultBookmarks = [
    { id: 1, iconName: "emoji:📊", title: t("bookmark.default.naver", "네이버 금융"), url: "https://finance.naver.com" },
    { id: 2, iconName: "emoji:📈", title: t("bookmark.default.google", "구글 파이낸스"), url: "https://www.google.com/finance" },
    { id: 3, iconName: "emoji:🇯🇵", title: t("bookmark.default.yahoo", "야후재팬 금융"), url: "https://finance.yahoo.co.jp" }
  ];

  return (
    <div className={`flex w-full h-full bg-[#080e21]/95 text-slate-100 ${theme.mainShadow} font-sans`}>
      {/* 좌측 사이드 네비게이션 툴바 */}
      <div className="w-12 border-r border-white/5 flex flex-col items-center py-4 gap-4 bg-[#060a18]/90 shrink-0">
        <button
          onClick={() => togglePanel("history")}
          className={`p-2 rounded-xl transition cursor-pointer ${activePanel === "history" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:text-white"}`}
          title={t("menu.history", "대화 기록")}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          onClick={() => togglePanel("memo")}
          className={`p-2 rounded-xl transition cursor-pointer ${activePanel === "memo" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:text-white"}`}
          title={t("menu.memo", "메모장")}
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          onClick={() => togglePanel("guide")}
          className={`p-2 rounded-xl transition cursor-pointer ${activePanel === "guide" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:text-white"}`}
          title={t("menu.guide", "가이드")}
        >
          <Cpu className="h-4 w-4" />
        </button>
        <button
          onClick={handleResetChat}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer mt-auto"
          title={t("menu.reset", "대화 초기화")}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* 서브패널 */}
      {activePanel !== "none" && (
        <div className="w-64 border-r border-white/5 h-full overflow-hidden shrink-0">
          {activePanel === "history" && (
            <HistoryBar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelectSession={loadSession}
              onDeleteSession={deleteSession}
              t={t}
            />
          )}
          {activePanel === "memo" && (
            <MemoPanel locale={locale} t={t} />
          )}
          {activePanel === "guide" && (
            <GuidePanel t={t} />
          )}
        </div>
      )}

      {/* 우측 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080e21]/95 relative">
        <ChatHeader
          settings={settings}
          isSupported={isSupported}
          effectiveAIAvatar={effectiveAIAvatar}
          isMaximized={false}
          onToggleMaximize={() => {}}
          onMinimize={() => {}}
          onClose={() => {}}
          isSending={isSending}
          t={t}
        />

        <ChatMessageList
          messages={messages}
          settings={settings}
          isSupported={isSupported}
          effectiveAIAvatar={effectiveAIAvatar}
          onQuickQuestion={handleQuickQuestion}
          onOpenGuideSection={() => togglePanel("guide")}
          t={t}
        />

        {messages.length === 0 && (
          <div className="px-4 pb-2 flex flex-col gap-2 shrink-0">
            <ShortcutBar
              skills={skills}
              onSelectPrompt={handleQuickQuestion}
              t={t}
            />
            <BookmarkBar
              bookmarks={defaultBookmarks}
              onSelectBookmark={(url) => window.open(url, "_blank")}
              t={t}
            />
          </div>
        )}

        <ChatInput
          onSendMessage={sendMessage}
          isSending={isSending}
          onStop={stopGeneration}
          settings={settings}
          t={t}
        />
      </div>

      {/* 커스텀 다이얼로그 모달 */}
      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={t("common.confirm", "확인")}
        cancelText={t("common.cancel", "취소")}
      />
    </div>
  );
}
