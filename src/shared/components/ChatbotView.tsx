import React, { useState, useEffect, useRef } from "react";
import { UserSettings, Skill } from "../chatbot-types";
import { useChatbotSession } from "../hooks/useChatbotSession";
import { getThemePalette, DEFAULT_SKILLS } from "../chatbot-constants";
import { useChromeStorage } from "../hooks/useChromeStorage";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { GuidePanel } from "./GuidePanel";
import { MemoPanel } from "./MemoPanel";
import { HistoryBar } from "./HistoryBar";
import { CustomDialog } from "./CustomDialog";
import { SystemSidebar, PanelType } from "./SystemSidebar";
import { BookmarksSidebar, UserBookmark } from "./BookmarksSidebar";
import { BookmarkEditModal } from "./BookmarkEditModal";
import { PromptsSidebar } from "./PromptsSidebar";
import { SkillEditModal } from "./SkillEditModal";
import { TranslatorPanel } from "./tools/TranslatorPanel";
import { ExchangePanel } from "./tools/ExchangePanel";
import { CalculatorPanel } from "./tools/CalculatorPanel";
import { SkillFinderPanel } from "./tools/SkillFinderPanel";
import { DiagnosticsPanel } from "./tools/DiagnosticsPanel";
import { BotSettingsPanel } from "./tools/BotSettingsPanel";
import { SettingsPanel } from "./tools/SettingsPanel";
import { ALL_AVATARS } from "./tools/settings-panel/avatar-list";
import { AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface ChatbotViewProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  skills: Skill[];
  activeSkill: Skill | null;
  setActiveSkill: (skill: Skill | null) => void;
  isSupported: boolean;
  effectiveAIAvatar: string;
  layoutMode: "sidepanel" | "widget";
  t: any;
  locale: string;
  isSettingsLoaded?: boolean;
}

export function ChatbotView({
  settings,
  updateSettings,
  skills,
  activeSkill,
  setActiveSkill,
  isSupported,
  effectiveAIAvatar,
  layoutMode,
  t,
  locale,
  isSettingsLoaded = false
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
    deleteSession,
    currentScenario,
    triggerScenario,
    clearContext
  } = useChatbotSession(true, settings, activeSkill, skills, t);

  const [activePanel, setActivePanel] = useState<PanelType>("none");
  const [showChat, setShowChat] = useState<boolean>(true);
  const [isPromptsBarOpen, setIsPromptsBarOpen] = useChromeStorage<boolean>("nano_show_prompts_bar", true);
  const [isBookmarksBarOpen, setIsBookmarksBarOpen] = useChromeStorage<boolean>("nano_show_bookmarks_bar", true);
  const [isBookmarksExpanded, setIsBookmarksExpanded] = useState<boolean>(false);
  const [isShortcutsExpanded, setIsShortcutsExpanded] = useState<boolean>(false);
  const [promptToInject, setPromptToInject] = useState<string>("");

  // 즐겨찾기 상태 연동
  const defaultBookmarks = [
    { id: 1, iconName: "emoji:🐱", title: t("bookmark.default.github", "GitHub"), url: "https://github.com" },
    { id: 2, iconName: "emoji:🤗", title: t("bookmark.default.huggingface", "Hugging Face"), url: "https://huggingface.co" },
    { id: 3, iconName: "emoji:🔍", title: t("bookmark.default.google", "Google"), url: "https://www.google.com" },
    { id: 4, iconName: "emoji:💬", title: t("bookmark.default.chatgpt", "ChatGPT"), url: "https://chatgpt.com" },
    { id: 5, iconName: "emoji:💻", title: t("bookmark.default.stackoverflow", "Stack Overflow"), url: "https://stackoverflow.com" },
    { id: 6, iconName: "emoji:📺", title: t("bookmark.default.youtube", "YouTube"), url: "https://www.youtube.com" },
    { id: 7, iconName: "emoji:🌐", title: t("bookmark.default.reddit", "Reddit"), url: "https://www.reddit.com" },
    { id: 8, iconName: "emoji:📖", title: t("bookmark.default.wikipedia", "Wikipedia"), url: "https://www.wikipedia.org" }
  ];
  const [bookmarks, setBookmarks, isBookmarksLoaded] = useChromeStorage<UserBookmark[]>("user_bookmarks", defaultBookmarks);
  const [editingBookmark, setEditingBookmark] = useState<UserBookmark | null>(null);

  // 구 북마크 마이그레이션 (이전 3대 금융 사이트 -> 신규 8대 글로벌 사이트)
  useEffect(() => {
    if (!isBookmarksLoaded) return;
    const hasLegacy = bookmarks.some(b => 
      b.url.includes("finance.naver.com") || 
      b.url.includes("finance.yahoo.co.jp") ||
      b.url.includes("google.com/finance")
    );
    if (hasLegacy) {
      setBookmarks(defaultBookmarks);
    }
  }, [isBookmarksLoaded, bookmarks, setBookmarks]);
  const [showBookmarkIconPicker, setShowBookmarkIconPicker] = useState<boolean>(false);

  // 커스텀 스킬 로컬 상태 동기화
  const [localSkills, setLocalSkills, isLocalSkillsLoaded] = useChromeStorage<Skill[]>("user_skills", skills);
  const [isRightMenuOpen, setIsRightMenuOpen] = useChromeStorage<boolean>("nano_show_right_menu", true);

  // 사용자의 로컬 스토리지에 8대 스킬 중 누락된 스킬이 있다면 자동으로 추가해 주는 마이그레이션 처리
  useEffect(() => {
    if (!isLocalSkillsLoaded) return;
    if (!localSkills || localSkills.length === 0) return;
    const localIds = localSkills.map(s => s.id);
    const missingSkills = DEFAULT_SKILLS.filter(s => !localIds.includes(s.id));
    if (missingSkills.length > 0) {
      setLocalSkills((prev) => {
        const merged = [...prev];
        missingSkills.forEach(ms => {
          if (!merged.some(s => s.id === ms.id)) {
            merged.push(ms);
          }
        });
        return merged;
      });
    }
  }, [isLocalSkillsLoaded, localSkills, setLocalSkills]);

  // 사용자가 설정을 통해 비활성 -> 활성으로 수동 토글한 시점에만 랜덤 추첨하여 최종 스토리지에 반영
  const prevRandomRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!isSettingsLoaded) return;
    
    const wasRandom = prevRandomRef.current;
    prevRandomRef.current = settings.nano_ai_random_avatar;

    // 최초 로드 시점(wasRandom === undefined)에는 추첨하지 않고, 
    // 오직 수동으로 토글을 새로 켰을 때(wasRandom === false)에만 무작위 추첨합니다.
    if (settings.nano_ai_random_avatar && wasRandom === false) {
      const randomIndex = Math.floor(Math.random() * ALL_AVATARS.length);
      const chosenAvatar = ALL_AVATARS[randomIndex];
      
      if (settings.nano_ai_avatar !== chosenAvatar.path) {
        updateSettings({
          nano_ai_avatar: chosenAvatar.path,
          nano_ai_avatar_name: settings.nano_ai_avatar_name
        });
      }
    }
  }, [isSettingsLoaded, settings.nano_ai_random_avatar, settings.nano_ai_avatar, updateSettings]);

  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [showSkillIconPicker, setShowSkillIconPicker] = useState<boolean>(false);
  const [isOptimizingSkill, setIsOptimizingSkill] = useState<boolean>(false);

  // 서브창 너비 조절 상태
  const [panelWidth, setPanelWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleToggleChat = () => {
    if (showChat) {
      setShowChat(false);
      if (activePanel === "none") {
        setActivePanel("bot-settings");
      }
    } else {
      setShowChat(true);
    }
  };

  const currentPanelWidth = activePanel !== "none"
    ? (!showChat ? "calc(100% - 80px)" : `${panelWidth}px`)
    : "0px";

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

  const handleSetCopiedPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setPromptToInject(prompt);
  };

  // 마우스 드래그 리사이즈 로직
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSaveBookmark = (bm: UserBookmark) => {
    setBookmarks((prev) => {
      const exists = prev.some(b => b.id === bm.id);
      if (exists) {
        return prev.map(b => b.id === bm.id ? bm : b);
      } else {
        return [...prev, bm];
      }
    });
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = (id: number) => {
    setBookmarks((prev) => prev.filter(b => b.id !== id));
    setEditingBookmark(null);
  };

  const handleSaveSkill = (skill: Skill) => {
    setLocalSkills((prev) => {
      const exists = prev.some(s => s.id === skill.id);
      if (exists) {
        return prev.map(s => s.id === skill.id ? skill : s);
      } else {
        const newId = skill.id || "skill-" + Date.now();
        return [...prev, { ...skill, id: newId }];
      }
    });
    setEditingSkill(null);
  };

  const handleDeleteSkill = (id: string) => {
    setLocalSkills((prev) => prev.filter(s => s.id !== id));
    setEditingSkill(null);
    if (activeSkill?.id === id) {
      setActiveSkill(null);
    }
  };

  const handleOptimizeSkill = async () => {
    if (!editingSkill || !editingSkill.prompt.trim()) return;
    setIsOptimizingSkill(true);
    try {
      const glob = window as any;
      let optimizedPrompt = "";
      let lm = glob.ai?.languageModel;
      if (!lm && glob.chrome?.ai?.languageModel) {
        lm = glob.chrome.ai.languageModel;
      }
      
      if (lm && typeof lm.create === "function") {
        const session = await lm.create({
          systemPrompt: "You are a prompt engineer. Make the given user prompt clearer, more professional, and highly optimized for LLMs. Keep the output clean without markdown wraps. Respond in the same language as the prompt."
        });
        optimizedPrompt = await session.prompt(editingSkill.prompt);
        session.destroy();
      } else {
        optimizedPrompt = `${editingSkill.prompt.trim()}\n\n[Optimized by AI: Provide clear, concise, and accurate responses. Maintain a professional tone and format the outputs cleanly using markdown.]`;
      }

      setEditingSkill({
        ...editingSkill,
        prompt: optimizedPrompt.trim()
      });
    } catch (err) {
      console.error("Failed to optimize prompt:", err);
    } finally {
      setIsOptimizingSkill(false);
    }
  };

  return (
    <div 
      className={`flex w-full h-full ${theme.bgMain} ${theme.textMain} ${theme.mainShadow} font-sans overflow-hidden relative`}
      id="nanobot-chat-frame"
    >
      {/* 1. 왼쪽 슬라이딩 서브 패널 */}
      <div 
        style={{ width: currentPanelWidth }}
        className={`h-full border-r ${theme.borderMuted} ${theme.bgMain} ${theme.textMain} overflow-hidden flex-shrink-0 relative transition-all duration-300 ease-out`}
      >
        <div className="w-full h-full relative" style={{ minWidth: "200px" }}>
          {activePanel === "history" && (
            <HistoryBar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelectSession={loadSession}
              onDeleteSession={deleteSession}
              t={t}
              theme={theme}
            />
          )}
          {activePanel === "memo" && <MemoPanel locale={locale} t={t} theme={theme} />}
          {activePanel === "guide" && <GuidePanel t={t} theme={theme} />}
          {activePanel === "translator" && <TranslatorPanel settings={settings} t={t} theme={theme} />}
          {activePanel === "exchange" && <ExchangePanel t={t} theme={theme} locale={locale} />}
          {activePanel === "calculator" && <CalculatorPanel t={t} theme={theme} />}
          {activePanel === "skill-finder" && <SkillFinderPanel t={t} theme={theme} />}
          {activePanel === "diagnostics" && <DiagnosticsPanel t={t} theme={theme} />}
          {activePanel === "bot-settings" && <BotSettingsPanel t={t} theme={theme} />}
          {activePanel === "settings" && (
            <SettingsPanel 
              settings={settings} 
              updateSettings={updateSettings} 
              locale={locale} 
              setLocale={(l) => updateSettings({ nano_locale: l })}
              t={t} 
            />
          )}

          {activePanel !== "none" && (
            <div className="absolute top-4.5 right-4 z-[30] flex items-center gap-1.5">
              {/* 최대화/복구 단추 */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-1 ${theme.textSub} hover:${theme.textMain} ${theme.bgHover} rounded transition-colors cursor-pointer`}
                title={!showChat ? t("common.restore", "이전 크기로") : t("common.maximize", "최대화")}
              >
                {!showChat ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              {/* 닫기 단추 */}
              <button
                onClick={() => {
                  setActivePanel("none");
                  setShowChat(true);
                }}
                className={`p-1 ${theme.textSub} hover:${theme.textMain} ${theme.bgHover} rounded transition-colors cursor-pointer`}
                title={t("common.close", "닫기")}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div
            onMouseDown={() => setIsResizing(true)}
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-all z-[10] flex items-center justify-center"
          >
            <div className="w-[1px] h-6 bg-slate-500/20 rounded" />
          </div>
        </div>
      </div>

      {/* 2. 중앙 메인 채팅 영역 */}
      {showChat && (
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${theme.bgMain} relative`}>
          <ChatHeader
            settings={settings}
            isSupported={isSupported}
            effectiveAIAvatar={effectiveAIAvatar}
            isMaximized={false}
            onToggleMaximize={() => {}}
            onMinimize={() => {}}
            onClose={() => {}}
            isSending={isSending}
            showRightMenu={isRightMenuOpen}
            onToggleRightMenu={() => setIsRightMenuOpen(!isRightMenuOpen)}
            layoutMode={layoutMode}
            t={t}
          />

          <ChatMessageList
            messages={messages}
            settings={settings}
            isSupported={isSupported}
            effectiveAIAvatar={effectiveAIAvatar}
            onQuickQuestion={handleQuickQuestion}
            onOpenGuideSection={() => setActivePanel("guide")}
            t={t}
          />



          <ChatInput
            onSendMessage={sendMessage}
            isSending={isSending}
            onStop={stopGeneration}
            settings={settings}
            t={t}
            externalText={promptToInject}
            onClearExternalText={() => setPromptToInject("")}
          />
        </div>
      )}

      {/* 2.5 오른쪽 PromptsSidebar (스킬 바) */}
      {isRightMenuOpen && (
        <PromptsSidebar
          skills={localSkills}
          activeSkill={activeSkill}
          setActiveSkill={setActiveSkill}
          isPromptsBarOpen={isPromptsBarOpen}
          isShortcutsExpanded={isShortcutsExpanded}
          setIsShortcutsExpanded={setIsShortcutsExpanded}
          setEditingSkill={setEditingSkill}
          setShowIconPicker={setShowSkillIconPicker}
          theme={theme}
          settings={settings}
          t={t}
        />
      )}

      {/* 3. 오른쪽 BookmarksSidebar */}
      {isRightMenuOpen && (
        <BookmarksSidebar
          bookmarks={bookmarks}
          isBookmarksBarOpen={isBookmarksBarOpen}
          isBookmarksExpanded={isBookmarksExpanded}
          setIsBookmarksExpanded={setIsBookmarksExpanded}
          setEditingBookmark={setEditingBookmark}
          setShowBookmarkIconPicker={setShowBookmarkIconPicker}
          theme={theme}
          settings={settings}
          t={t}
        />
      )}

      {/* 4. 가장 오른쪽 SystemSidebar */}
      {isRightMenuOpen && (
        <SystemSidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          onClearContext={clearContext}
          onResetConversation={handleResetChat}
          isSending={isSending}
          isPromptsBarOpen={isPromptsBarOpen}
          setIsPromptsBarOpen={setIsPromptsBarOpen}
          isBookmarksBarOpen={isBookmarksBarOpen}
          setIsBookmarksBarOpen={setIsBookmarksBarOpen}
          currentScenario={currentScenario}
          triggerScenario={triggerScenario}
          theme={theme}
          setCopiedPrompt={handleSetCopiedPrompt}
          t={t}
          settings={settings}
          updateSettings={updateSettings}
          showChat={showChat}
          onToggleChat={handleToggleChat}
        />
      )}

      {/* 5. 북마크 편집 모달 */}
      <AnimatePresence>
        {editingBookmark && (
          <BookmarkEditModal
            editingBookmark={editingBookmark}
            setEditingBookmark={setEditingBookmark}
            showIconPicker={showBookmarkIconPicker}
            setShowIconPicker={setShowBookmarkIconPicker}
            onDelete={handleDeleteBookmark}
            onCancel={() => setEditingBookmark(null)}
            onSave={handleSaveBookmark}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* 5.5 스킬 편집 모달 */}
      <AnimatePresence>
        {editingSkill && (
          <SkillEditModal
            editingShortcut={editingSkill}
            setEditingShortcut={setEditingSkill}
            showIconPicker={showSkillIconPicker}
            setShowIconPicker={setShowSkillIconPicker}
            isOptimizing={isOptimizingSkill}
            onOptimize={handleOptimizeSkill}
            onDelete={handleDeleteSkill}
            onCancel={() => setEditingSkill(null)}
            onSave={handleSaveSkill}
            t={t}
          />
        )}
      </AnimatePresence>

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


