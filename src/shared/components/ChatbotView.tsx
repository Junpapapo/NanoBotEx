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
import { DiagnosticsPanel } from "./tools/DiagnosticsPanel";
import { BotSettingsPanel } from "./tools/BotSettingsPanel";
import { SettingsPanel } from "./tools/SettingsPanel";
import { ALL_AVATARS } from "./tools/settings-panel/avatar-list";
import { DocViewerPanel } from "./tools/DocViewerPanel";
import { AnimatePresence, motion } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { ENABLE_PREMIUM } from "../../premium/premium-config";
import {
  useBuddySession,
  BuddyChatView,
  DEFAULT_BUDDY_SETTINGS,
  BuddySettingsView,
} from "../../premium/buddy";
import { BuddySettings } from "../chatbot-types";
import { BuddyDiaryPanel } from "../../premium/buddy/components/BuddyDiaryPanel";
import { useAlarm, AlarmDialog, AlarmPanel } from "../../premium/alarm";
import { Bell, AlertCircle } from "lucide-react";

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
  isSettingsLoaded = false,
}: ChatbotViewProps) {
  const theme = getThemePalette(
    settings.nano_theme_color || "indigo",
    settings.nano_skin_mode || "dark",
  );

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
    clearContext,
    clearMessages: clearBotMessages,
    clearAllSessions,
  } = useChatbotSession(true, settings, activeSkill, skills, t);

  const [activePanel, setActivePanel] = useState<PanelType>("none");
  const [activeMode, setActiveMode] = useState<"bot" | "buddy">("bot");

  // 문서 뷰어 활성 문서 상태
  const [activeDoc, setActiveDoc] = useState<{ title: string; content: string } | null>(null);

  const handleSendToViewer = (title: string, content: string) => {
    setActiveDoc({ title, content });
    setActivePanel("doc-viewer");
  };

  const [buddySettings] = useChromeStorage<BuddySettings>(
    "buddy_settings",
    DEFAULT_BUDDY_SETTINGS,
  );

  // 프리미엄 스마트 알람 관리
  const { alarms, addAlarm, deleteAlarm, toggleAlarmActive, markAsTriggered } =
    useAlarm();

  const [isAlarmDialogOpen, setIsAlarmDialogOpen] = useState(false);
  const [alarmDefaultTitle, setAlarmDefaultTitle] = useState("");
  const [alarmSource, setAlarmSource] = useState<"memo" | "chat" | "manual">(
    "manual",
  );
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // 로캘(설정된 언어)에 따라 요약/번역 지침 생성 헬퍼
  const getPromptInstruction = (
    type: "summarize" | "translate" | "page_summarize",
    content: string,
  ) => {
    const currentLocale = settings.nano_locale || locale || "ko";
    const isKo = currentLocale === "ko";
    const isJa = currentLocale === "ja";

    if (type === "summarize") {
      if (isKo) {
        return `제공된 드래그 텍스트를 분석하여 아래의 형식을 엄격히 준수하여 한국어로 정확히 3개의 글머리 기호로 요약해줘.\n\n• [핵심 주제]: [필수적인 컨텍스트 및 영향]\n\n규칙:\n1. 지나치게 단순화하지 마세요. 핵심 사실, 원인, 결과가 완전히 포함되도록 하세요.\n2. 간결하지만 완전한 형태의 절(clause)로 작성하고, 충분한 정보를 제공할 수 있도록 각 글머리 기호를 15자에서 25자 사이로 유지하세요.\n3. 머리말이나 꼬리말 설명 없이 오직 3개의 글머리 기호만 출력하세요.\n\n[텍스트]\n${content}`;
      }
      if (isJa) {
        return `提供されたドラッグテキストを分析し、以下のフォーマットを厳密に遵守して日本語で正確に3つの箇条書きで要約してください。\n\n• [主要な主語]: [必須のコンテキストと影響]\n\nルール：\n1. 過度に単純化しないでください。重要な事実、原因、結果が完全に保持されるようにしてください。\n2. 簡潔ながらも完全な節（clause）で記述し、十分な情報を提供するために、各箇条書きを15文字から25文字の間に維持してください。\n3. 前置きや結びの言葉は一切含めず、3つの箇条書きのみを出力してください。\n\n[テキスト]\n${content}`;
      }
      return `Please analyze the provided dragged text and summarize the core context into exactly 3 bullet points in English, strictly following the format below:\n\n• [Key Subject]: [Essential Context & Impact]\n\nRules:\n1. Do not overly simplify. Ensure that key facts, causes, and consequences are fully retained.\n2. Write in concise but complete clauses, keeping each bullet point between 15 to 25 words to provide sufficient information.\n3. Output ONLY the 3 bullet points, without any introductory or concluding remarks.\n\n[Text]\n${content}`;
    }

    if (type === "translate") {
      if (isKo)
        return `다음 드래그한 텍스트를 문맥에 맞게 아주 매끄러운 한국어로 번역해줘.\n\n[텍스트]\n${content}`;
      if (isJa)
        return `以下のドラッグしたテキストを、文脈に合わせて非常に自然な日本語に翻訳してください。\n\n[テキスト]\n${content}`;
      return `Please translate the following dragged text into very natural English according to the context.\n\n[Text]\n${content}`;
    }

    // page_summarize
    if (isKo) {
      return `제공된 웹 페이지 본문을 분석하여 아래의 형식을 엄격히 준수하여 한국어로 정확히 3개의 글머리 기호로 요약해서 답변해줘.\n\n• [핵심 주제]: [필수적인 컨텍스트 및 영향]\n\n규칙:\n1. 지나치게 단순화하지 마세요. 핵심 사실, 원인, 결과가 완전히 포함되도록 하세요.\n2. 간결하지만 완전한 형태의 절(clause)로 작성하고, 충분한 정보를 제공할 수 있도록 각 글머리 기호를 15자에서 25자 사이로 유지하세요.\n3. 머리말이나 꼬리말 설명 없이 오직 3개의 글머리 기호만 출력하세요.\n\n[웹 페이지 본문]\n${content}`;
    }
    if (isJa) {
      return `提供されたウェブページ本文を分析し、以下のフォーマットを厳密に遵守して日本語で正確に3つの箇条書きで要約して回答してください。\n\n• [主要な主語]: [必須のコンテキストと影響]\n\nルール：\n1. 過度に単純化しないでください。重要な事実、原因、結果が完全に保持されるようにしてください。\n2. 簡潔ながらも完全な節（clause）で記述し、十分な情報を提供するために、各箇条書きを15文字から25文字の間に維持してください。\n3. 前置きや結びの言葉は一切含めず、3つの箇条書きのみを出力してください。\n\n[ウェブページ本文]\n${content}`;
    }
    return `Please analyze the provided web page content and summarize the core context into exactly 3 bullet points in English, strictly following the format below:\n\n• [Key Subject]: [Essential Context & Impact]\n\nRules:\n1. Do not overly simplify. Ensure that key facts, causes, and consequences are fully retained.\n2. Write in concise but complete clauses, keeping each bullet point between 15 to 25 words to provide sufficient information.\n3. Output ONLY the 3 bullet points, without any introductory or concluding remarks.\n\n[Web Page Content]\n${content}`;
  };

  // 드래그 액션 처리 헬퍼
  const handleDragAction = (text: string, type: "summarize" | "translate") => {
    const prompt = getPromptInstruction(type, text);

    if (activeMode === "buddy") {
      setActiveMode("bot");
      sendMessage(prompt, true);
    } else {
      sendMessage(prompt, true);
    }
  };

  // 알람 트리거 메시지 리스너
  useEffect(() => {
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.onMessage
    )
      return;

    const handleMessage = (message: any) => {
      if (message.action === "alarm_triggered" && message.alarm) {
        setActiveToast({
          id: message.alarm.id,
          title: message.alarm.title,
        });
        markAsTriggered(message.alarm.id);

        setTimeout(() => {
          setActiveToast((prev) =>
            prev?.id === message.alarm.id ? null : prev,
          );
        }, 5000);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [markAsTriggered]);

  // 스토리지 기반 드래그앤액션 감지 및 중복 없는 소비
  useEffect(() => {
    if (
      typeof chrome === "undefined" ||
      !chrome.storage ||
      !chrome.storage.local
    )
      return;
    if (!isSettingsLoaded) return;

    const consumeDragAction = (pending: any) => {
      if (pending && pending.text) {
        handleDragAction(pending.text, pending.type);
        // 스토리지 클리어하여 중복 실행 방지
        chrome.storage.local.remove("pending_drag");
      }
    };

    // 1. 마운트 시 대기 중인 드래그 스냅샷 소비
    chrome.storage.local.get(["pending_drag"], (result) => {
      if (result.pending_drag) {
        consumeDragAction(result.pending_drag);
      }
    });

    // 2. 실시간 스토리지 변경 수신
    const handleStorageChange = (changes: any, areaName: string) => {
      if (
        areaName === "local" &&
        changes.pending_drag &&
        changes.pending_drag.newValue
      ) {
        consumeDragAction(changes.pending_drag.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [activeMode, isSettingsLoaded]);

  const handleOpenAlarmDialog = (title: string, source: "memo" | "chat") => {
    setAlarmDefaultTitle(title);
    setAlarmSource(source);
    setIsAlarmDialogOpen(true);
  };

  const handleSummarizeCurrentPage = async () => {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.scripting) {
      alert("Page summarization is only supported in a Chrome Extension environment.");
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.id) {
        alert("Cannot find an active web page to summarize.");
        return;
      }

      const url = tab.url || "";
      if (
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.includes("chrome.google.com/webstore") ||
        url.includes("chromewebstore.google.com")
      ) {
        alert(
          "Due to Chrome's security policies, page summarization is not supported on browser settings, built-in extension pages, or the Chrome Web Store.\n\nPlease try again on a standard external website."
        );
        return;
      }

      if (url.endsWith(".pdf") || url.includes(".pdf#")) {
        alert("Page summarization is not supported on PDF tabs. Please run on a standard web page.");
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => document.body.innerText,
        },
        async (results) => {
          if (chrome.runtime.lastError) {
            console.warn("executeScript warning:", chrome.runtime.lastError.message);
            alert(`Cannot read the web page content.\n(Reason: ${chrome.runtime.lastError.message || "Security restrictions or page blocked"})`);
            return;
          }

          if (!results || !results[0] || typeof results[0].result !== "string") {
            alert("Cannot read the web page content. The body text might be empty or extraction failed.");
            return;
          }

          const rawText = results[0].result;
          const cleanedText = rawText
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 3000);

          if (!cleanedText) {
            alert("The extracted web page text is empty.");
            return;
          }

          const prompt = getPromptInstruction("page_summarize", cleanedText);

          if (activeMode === "buddy") {
            setActiveMode("bot");
            sendMessage(prompt, true);
          } else {
            sendMessage(prompt, true);
          }
        },
      );
    } catch (err: any) {
      console.error("Failed to summarize page:", err);
      alert("Failed to summarize page: " + (err.message || err));
    }
  };

  const {
    messages: buddyMessages,
    memories: buddyMemories,
    isSending: isBuddySending,
    sendMessage: sendBuddyMessage,
    stopGeneration: stopBuddyGeneration,
    triggerQuickMenu: triggerBuddyQuickMenu,
    handleConfirmAction: handleBuddyConfirmAction,
    buddySaveState,
    clearMessages: clearBuddyMessages,
  } = useBuddySession(activeMode === "buddy", t, locale);

  const [isPromptsBarOpen, setIsPromptsBarOpen] = useChromeStorage<boolean>(
    "nano_show_prompts_bar",
    true,
  );
  const [isBookmarksBarOpen, setIsBookmarksBarOpen] = useChromeStorage<boolean>(
    "nano_show_bookmarks_bar",
    true,
  );
  const [isBookmarksExpanded, setIsBookmarksExpanded] =
    useState<boolean>(false);
  const [isShortcutsExpanded, setIsShortcutsExpanded] =
    useState<boolean>(false);
  const [promptToInject, setPromptToInject] = useState<string>("");
  const [guideSection, setGuideSection] = useState<string>("flags");

  // 즐겨찾기 상태 연동
  const defaultBookmarks = [
    {
      id: 1,
      iconName: "emoji:🐱",
      title: t("bookmark.default.github", "GitHub"),
      url: "https://github.com",
    },
    {
      id: 2,
      iconName: "emoji:🤗",
      title: t("bookmark.default.huggingface", "Hugging Face"),
      url: "https://huggingface.co",
    },
    {
      id: 3,
      iconName: "emoji:🔍",
      title: t("bookmark.default.google", "Google"),
      url: "https://www.google.com",
    },
    {
      id: 4,
      iconName: "emoji:💬",
      title: t("bookmark.default.chatgpt", "ChatGPT"),
      url: "https://chatgpt.com",
    },
    {
      id: 5,
      iconName: "emoji:💻",
      title: t("bookmark.default.stackoverflow", "Stack Overflow"),
      url: "https://stackoverflow.com",
    },
    {
      id: 6,
      iconName: "emoji:📺",
      title: t("bookmark.default.youtube", "YouTube"),
      url: "https://www.youtube.com",
    },
    {
      id: 7,
      iconName: "emoji:🌐",
      title: t("bookmark.default.reddit", "Reddit"),
      url: "https://www.reddit.com",
    },
    {
      id: 8,
      iconName: "emoji:📖",
      title: t("bookmark.default.wikipedia", "Wikipedia"),
      url: "https://www.wikipedia.org",
    },
  ];
  const [bookmarks, setBookmarks, isBookmarksLoaded] = useChromeStorage<
    UserBookmark[]
  >("user_bookmarks", defaultBookmarks);
  const [editingBookmark, setEditingBookmark] = useState<UserBookmark | null>(
    null,
  );

  // 구 북마크 마이그레이션 (이전 3대 금융 사이트 -> 신규 8대 글로벌 사이트)
  useEffect(() => {
    if (!isBookmarksLoaded) return;
    const hasLegacy = bookmarks.some(
      (b) =>
        b.url.includes("finance.naver.com") ||
        b.url.includes("finance.yahoo.co.jp") ||
        b.url.includes("google.com/finance"),
    );
    if (hasLegacy) {
      setBookmarks(defaultBookmarks);
    }
  }, [isBookmarksLoaded, bookmarks, setBookmarks]);
  const [showBookmarkIconPicker, setShowBookmarkIconPicker] =
    useState<boolean>(false);

  // 커스텀 스킬 로컬 상태 동기화
  const [localSkills, setLocalSkills, isLocalSkillsLoaded] = useChromeStorage<
    Skill[]
  >("user_skills", skills);
  const [isRightMenuOpen, setIsRightMenuOpen] = useChromeStorage<boolean>(
    "nano_show_right_menu",
    true,
  );

  // 사용자의 로컬 스토리지에 8대 스킬 중 누락된 스킬이 있다면 자동으로 추가해 주는 마이그레이션 처리
  useEffect(() => {
    if (!isLocalSkillsLoaded) return;
    if (!localSkills || localSkills.length === 0) return;
    const localIds = localSkills.map((s) => s.id);
    const missingSkills = DEFAULT_SKILLS.filter(
      (s) => !localIds.includes(s.id),
    );
    if (missingSkills.length > 0) {
      setLocalSkills((prev) => {
        const merged = [...prev];
        missingSkills.forEach((ms) => {
          if (!merged.some((s) => s.id === ms.id)) {
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
          nano_ai_avatar_name: settings.nano_ai_avatar_name,
        });
      }
    }
  }, [
    isSettingsLoaded,
    settings.nano_ai_random_avatar,
    settings.nano_ai_avatar,
    updateSettings,
  ]);

  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [showSkillIconPicker, setShowSkillIconPicker] =
    useState<boolean>(false);
  const [isOptimizingSkill, setIsOptimizingSkill] = useState<boolean>(false);

  // 서브창 너비 조절 상태
  const [panelWidth, setPanelWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleClearScreen = () => {
    if (activeMode === "buddy") {
      clearBuddyMessages();
    } else {
      clearBotMessages();
    }
  };

  const handleModeChange = (mode: "bot" | "buddy") => {
    setActiveMode(mode);
  };

  const currentPanelWidth = activePanel !== "none" ? `${panelWidth}px` : "0px";

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
    onConfirm: () => {},
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setDialogState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleResetChat = () => {
    showConfirm(
      t("dialog.reset.title", "대화 초기화"),
      t(
        "dialog.reset.message",
        "현재 세션의 모든 대화 기록을 지우고 초기화하시겠습니까?",
      ),
      () => {
        resetConversation();
      },
    );
  };

  const handleClearAllSessions = () => {
    showConfirm(
      t("dialog.clearAll.title", "대화 기록 전체 삭제"),
      t(
        "dialog.clearAll.message",
        "모든 대화 기록을 지우고 초기화하시겠습니까?",
      ),
      () => {
        clearAllSessions();
      },
    );
  };

  const handleQuickQuestion = (text: string) => {
    if (activeMode === "buddy") {
      sendBuddyMessage(text);
    } else {
      sendMessage(text);
    }
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
      const exists = prev.some((b) => b.id === bm.id);
      if (exists) {
        return prev.map((b) => (b.id === bm.id ? bm : b));
      } else {
        return [...prev, bm];
      }
    });
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = (id: number) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    setEditingBookmark(null);
  };

  const handleSaveSkill = (skill: Skill) => {
    setLocalSkills((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      if (exists) {
        return prev.map((s) => (s.id === skill.id ? skill : s));
      } else {
        const newId = skill.id || "skill-" + Date.now();
        return [...prev, { ...skill, id: newId }];
      }
    });
    setEditingSkill(null);
  };

  const handleDeleteSkill = (id: string) => {
    setLocalSkills((prev) => prev.filter((s) => s.id !== id));
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
          systemPrompt:
            "You are a prompt engineer. Make the given user prompt clearer, more professional, and highly optimized for LLMs. Keep the output clean without markdown wraps. Respond in the same language as the prompt.",
        });
        optimizedPrompt = await session.prompt(editingSkill.prompt);
        session.destroy();
      } else {
        optimizedPrompt = `${editingSkill.prompt.trim()}\n\n[Optimized by AI: Provide clear, concise, and accurate responses. Maintain a professional tone and format the outputs cleanly using markdown.]`;
      }

      setEditingSkill({
        ...editingSkill,
        prompt: optimizedPrompt.trim(),
      });
    } catch (err) {
      console.error("Failed to optimize prompt:", err);
    } finally {
      setIsOptimizingSkill(false);
    }
  };

  return (
    <div
      className={`flex justify-end w-full h-full ${theme.bgMain} ${theme.textMain} ${theme.mainShadow} font-sans overflow-hidden relative`}
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
              onClearAllSessions={handleClearAllSessions}
              t={t}
              theme={theme}
            />
          )}
          {activePanel === "memo" && (
            <MemoPanel
              locale={locale}
              t={t}
              theme={theme}
              onOpenAlarm={(title) => handleOpenAlarmDialog(title, "memo")}
              onSendToViewer={handleSendToViewer}
            />
          )}
          {activePanel === "doc-viewer" && (
            <DocViewerPanel
              activeDoc={activeDoc}
              setActiveDoc={setActiveDoc}
              theme={theme}
              t={t}
              locale={locale}
            />
          )}
          {activePanel === "alarm" && (
            <AlarmPanel
              alarms={alarms}
              onToggleActive={toggleAlarmActive}
              onDelete={deleteAlarm}
              onAddManualAlarm={(title, timeISO) =>
                addAlarm(title, timeISO, "manual")
              }
              theme={theme}
              t={t}
              locale={locale}
            />
          )}
          {activePanel === "guide" && (
            <GuidePanel
              t={t}
              theme={theme}
              isBuddy={activeMode === "buddy"}
              initialTab={guideSection}
            />
          )}
          {activePanel === "translator" && (
            <TranslatorPanel settings={settings} t={t} theme={theme} />
          )}
          {activePanel === "exchange" && (
            <ExchangePanel t={t} theme={theme} locale={locale} />
          )}
          {activePanel === "calculator" && (
            <CalculatorPanel t={t} theme={theme} />
          )}
          {activePanel === "diagnostics" && (
            <DiagnosticsPanel t={t} theme={theme} />
          )}
          {activePanel === "bot-settings" && (
            <BotSettingsPanel t={t} theme={theme} />
          )}
          {activePanel === "settings" && (
            <SettingsPanel
              settings={settings}
              updateSettings={updateSettings}
              locale={locale}
              setLocale={(l) => updateSettings({ nano_locale: l })}
              t={t}
            />
          )}
          {activePanel === "buddy-settings" && (
            <BuddySettingsView theme={theme} t={t} />
          )}
          {activePanel === "buddy-diary" && (
            <BuddyDiaryPanel
              theme={theme}
              t={t}
              onClose={() => setActivePanel("none")}
              onTriggerQuickQuestion={handleQuickQuestion}
            />
          )}

          {activePanel !== "none" && (
            <div className="absolute top-4.5 right-4 z-[30] flex items-center gap-1.5">
              {/* 닫기 단추 */}
              <button
                onClick={() => {
                  setActivePanel("none");
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
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden ${theme.bgMain} relative`}
        style={
          {
            "--nano-chat-font-size":
              settings.nano_chat_font_size === "small"
                ? "11px"
                : settings.nano_chat_font_size === "large"
                  ? "15px"
                  : "13px",
            "--nano-chat-font-family":
              settings.nano_chat_font === "inter"
                ? "'Inter', sans-serif"
                : settings.nano_chat_font === "noto"
                  ? "'Noto Sans KR', sans-serif"
                  : settings.nano_chat_font === "mono"
                    ? "'JetBrains Mono', 'Fira Code', monospace"
                    : "ui-sans-serif, system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        <ChatHeader
          settings={
            ENABLE_PREMIUM &&
            activeMode === "buddy" &&
            buddySettings?.buddy_initialized
              ? ({
                  ...settings,
                  nano_ai_avatar_name: buddySettings.buddy_name,
                } as any)
              : settings
          }
          isSupported={isSupported}
          effectiveAIAvatar={
            ENABLE_PREMIUM &&
            activeMode === "buddy" &&
            buddySettings?.buddy_initialized
              ? buddySettings.buddy_avatar
              : effectiveAIAvatar
          }
          isMaximized={false}
          onToggleMaximize={() => {}}
          onMinimize={() => {}}
          onClose={() => {}}
          isSending={
            ENABLE_PREMIUM &&
            activeMode === "buddy" &&
            buddySettings?.buddy_initialized
              ? isBuddySending
              : isSending
          }
          showRightMenu={isRightMenuOpen}
          onToggleRightMenu={() => setIsRightMenuOpen(!isRightMenuOpen)}
          onClearScreen={handleClearScreen}
          onSummarizePage={activeMode === "buddy" ? undefined : handleSummarizeCurrentPage}
          layoutMode={layoutMode}
          t={t}
        />

        {ENABLE_PREMIUM &&
        activeMode === "buddy" &&
        buddySettings?.buddy_initialized ? (
          <BuddyChatView
            messages={buddyMessages}
            memoriesCount={buddyMemories.length}
            isSending={isBuddySending}
            sendMessage={sendBuddyMessage}
            stopGeneration={stopBuddyGeneration}
            buddySettings={buddySettings}
            settings={settings}
            theme={theme}
            t={t}
            onOpenGuideSection={(section) => {
              setGuideSection(section);
              setActivePanel("guide");
            }}
            onConfirmAction={handleBuddyConfirmAction}
            buddySaveState={buddySaveState}
          />
        ) : (
          <>
            <ChatMessageList
              messages={messages}
              settings={settings}
              isSupported={isSupported}
              effectiveAIAvatar={effectiveAIAvatar}
              onQuickQuestion={handleQuickQuestion}
              onOpenGuideSection={(section) => {
                setGuideSection(section);
                setActivePanel("guide");
              }}
              onOpenAlarm={(title) => handleOpenAlarmDialog(title, "chat")}
              onSendToViewer={handleSendToViewer}
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
              updateSettings={updateSettings}
            />
          </>
        )}
      </div>

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
          theme={theme}
          setCopiedPrompt={handleSetCopiedPrompt}
          t={t}
          settings={settings}
          updateSettings={updateSettings}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          buddySettings={buddySettings}
          onTriggerQuickMenu={triggerBuddyQuickMenu}
          onTriggerQuickQuestion={handleQuickQuestion}
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

      {/* 인앱 토스트 알림 */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-4 z-[9999] p-3 rounded-lg border border-indigo-500/30 bg-[#0c122c]/95 shadow-2xl flex items-start gap-2.5 max-w-[280px]"
          >
            <Bell className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-bold text-white mb-0.5">
                {t("premium.alarm.toast.title", "⏰ 알람 리마인더")}
              </h4>
              <p className="text-[10px] text-slate-300 truncate">
                {activeToast.title}
              </p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-500 hover:text-white transition cursor-pointer"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 알람 설정 다이얼로그 */}
      <AlarmDialog
        isOpen={isAlarmDialogOpen}
        defaultTitle={alarmDefaultTitle}
        onClose={() => setIsAlarmDialogOpen(false)}
        onSave={(title, time) => addAlarm(title, time, alarmSource)}
        t={t}
        locale={locale}
      />
    </div>
  );
}
