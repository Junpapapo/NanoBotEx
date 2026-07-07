import { useState, useCallback, useRef, useEffect } from "react";
import { Message, UserSettings, Skill, SearchResult } from "../chatbot-types";
import { useSessionHistory } from "./useSessionHistory";
import { useAISession } from "./useAISession";
import { ChatbotModel } from "../chatbot-model";
import { checkSafety } from "../utils/safety-guard";
import { ENABLE_CHAT_SAFETY } from "../../premium/premium-config";
import { ALL_TEMPORAL_KEYWORDS } from "../chatbot-constants";

export const performWebSearch = async (keyword: string): Promise<{ results: SearchResult[]; tabId: number }> => {
  let tempTabId = 0;
  let originalTabId = 0;
  const results: SearchResult[] = [];
  console.log("[NanoBot] performWebSearch start. Keyword:", keyword);
  
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab && currentTab.id) {
        originalTabId = currentTab.id;
      }

      const trimmedKeyword = keyword.trim();
      const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i.test(trimmedKeyword);

      if (isUrl) {
        // ──────────────────────────────────────────────
        // 1. 직접 URL 입력 시: 해당 사이트로 백그라운드 직접 탭 생성하여 스크래핑
        // ──────────────────────────────────────────────
        const url = trimmedKeyword.startsWith("http") ? trimmedKeyword : `https://${trimmedKeyword}`;
        console.log("[NanoBot] Directly scraping URL:", url);
        const tempTab = await chrome.tabs.create({ url, active: false });
        tempTabId = tempTab.id || 0;
      } else {
        // ──────────────────────────────────────────────
        // 2. 검색어인 경우: 브라우저 기본 검색엔진 활용 (chrome.search.query)
        // ──────────────────────────────────────────────
        console.log("[NanoBot] Querying browser default search engine for keyword:", trimmedKeyword);

        if (chrome.search && chrome.search.query) {
          // 새 탭이 열릴 때 ID 가로채기를 위한 리스너 등록
          const tabCreatedPromise = new Promise<number>((resolve) => {
            const listener = (tab: chrome.tabs.Tab) => {
              chrome.tabs.onCreated.removeListener(listener);
              resolve(tab.id || 0);
            };
            chrome.tabs.onCreated.addListener(listener);
            
            // 3초 타임아웃
            setTimeout(() => {
              chrome.tabs.onCreated.removeListener(listener);
              resolve(0);
            }, 3000);
          });

          // 기본 검색엔진 쿼리 실행 (브라우저 설정 연동)
          await chrome.search.query({ text: trimmedKeyword, disposition: "NEW_TAB" });
          tempTabId = await tabCreatedPromise;

          // 사용자가 기존에 보던 원본 탭으로 포커스를 신속하게 복원하여 화면 튐 차단
          if (tempTabId && originalTabId) {
            await chrome.tabs.update(originalTabId, { active: true });
            console.log("[NanoBot] Successfully restored focus to original tab:", originalTabId);
          }
        } else {
          // chrome.search API 미지원 시 구글 검색을 백그라운드로 대체 실행 (폴백)
          const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmedKeyword)}`;
          console.log("[NanoBot] chrome.search API not available. Falling back to Google in background:", fallbackUrl);
          const tempTab = await chrome.tabs.create({ url: fallbackUrl, active: false });
          tempTabId = tempTab.id || 0;
        }
      }

      if (tempTabId) {
        // 3. 탭 로딩 상태 대기 (최대 7초)
        const tabInfo = await chrome.tabs.get(tempTabId);
        if (tabInfo.status !== "complete") {
          await new Promise<void>((resolve) => {
            const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
              if (updatedTabId === tempTabId && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            
            setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }, 7000);
          });
        }

        // 4. 범용 DOM 파서를 통한 핵심 텍스트 스크래핑 (광고/메뉴 등 제외)
        const finalTabInfo = await chrome.tabs.get(tempTabId);
        const actualSearchUrl = finalTabInfo.url || (isUrl ? (trimmedKeyword.startsWith("http") ? trimmedKeyword : `https://${trimmedKeyword}`) : `https://www.google.com/search?q=${encodeURIComponent(trimmedKeyword)}`);

        const execResults = await chrome.scripting.executeScript({
          target: { tabId: tempTabId },
          func: () => {
            // 광고, 헤더, 푸터, 네비게이션 요소 일체 삭제하여 스크래핑 효율화
            const excludeSelectors = [
              "nav", "footer", "header", "aside", ".ads", "#ads", 
              ".ad-unit", "#header", "#footer", ".navigation", ".menu", ".sidebar"
            ];
            excludeSelectors.forEach(sel => {
              try {
                document.querySelectorAll(sel).forEach(el => el.remove());
              } catch (e) {}
            });

            // 일반 페이지의 article이나 main 콘텐츠가 있다면 우선 타겟팅
            const articleEl = document.querySelector("article") || document.querySelector("main") || document.querySelector("#content");
            if (articleEl && articleEl.innerText.trim().length > 200) {
              return articleEl.innerText;
            }

            return document.body.innerText;
          }
        });

        if (execResults && execResults[0] && typeof execResults[0].result === "string") {
          const rawText = execResults[0].result;
          const cleanedText = rawText
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 3500); // 3,500자 컨텍스트 한도 준수
          
          if (cleanedText) {
            results.push({
              title: isUrl ? `웹 사이트 직접 수집: "${trimmedKeyword}"` : `실시간 기본 검색 결과: "${trimmedKeyword}"`,
              url: isUrl ? (trimmedKeyword.startsWith("http") ? trimmedKeyword : `https://${trimmedKeyword}`) : actualSearchUrl,
              snippet: cleanedText
            });
          }
        }
      }
    }
  } catch (tabErr: any) {
    console.warn("[NanoBot] performWebSearch error:", tabErr);
    results.push({
      title: "⚠️ 스크래핑 에러 디버그 정보",
      url: "chrome://error-details",
      snippet: `에러 내용: ${tabErr?.message || tabErr}`
    });
  } finally {
    // 5. 사용이 완료된 임시 검색 탭은 반드시 강제 닫기 수행 (메모리 누수 차단)
    if (tempTabId) {
      try {
        await chrome.tabs.remove(tempTabId);
        console.log("[NanoBot] Safely removed temporary tab:", tempTabId);
      } catch (removeErr) {
        console.warn("[NanoBot] Failed to remove temporary tab:", removeErr);
      }
    }
  }

  console.log("[NanoBot] performWebSearch end. Found:", results.length, "results:", results);
  return { results, tabId: originalTabId };
};

export function useChatbotSession(
  isEnabled: boolean,
  settings: UserSettings,
  activeSkill: Skill | null,
  skills: Skill[],
  t: (key: string, def: string) => string,
  setActiveSkill?: (skill: Skill | null) => void
) {
  const settingsRef = useRef<UserSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    getSession,
    saveSession,
    deleteSession,
    clearAllSessions
  } = useSessionHistory();

  const {
    session: aiSession,
    createSession,
    destroySession
  } = useAISession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  const prevActiveSkillRef = useRef<Skill | null>(null);
  const isFirstRender = useRef(true);
  const isAbortedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const clearHistoryIndexRef = useRef<number>(0);
  const isSystemPromptApplied = useRef<boolean>(false);
  const lastMessageTimeRef = useRef<number>(0);
  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef<boolean>(true);
  const isBypassingDeactivationNoticeRef = useRef<boolean>(false);



  // 대화 세션 복원
  const loadSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      clearHistoryIndexRef.current = 0;
    }
  }, [sessions, setCurrentSessionId]);

  // 새로운 대화 시작 (세션 리셋)
  const createNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, [setCurrentSessionId]);

  // 세션 파괴 및 대화 초기화
  const resetConversation = useCallback(async () => {
    await destroySession();
    if (currentSessionId) {
      deleteSession(currentSessionId);
    }
    clearHistoryIndexRef.current = 0;
    setMessages([]);
    setIsSending(false);
    setCurrentSessionId(null);
  }, [destroySession, currentSessionId, deleteSession, setCurrentSessionId]);

  //이름, 성향, 글로벌/일반 룰(공동 세팅) 및 스타일 지침 통합 빌드
  const buildPromptWithRules = useCallback((currentSettings: UserSettings, activeSkill: Skill | null) => {
    const name = currentSettings.nano_ai_avatar_name || "NanoBot";
    
    // 1. 정체성 정의 (Identity) - 불필요한 이름 남발 억제 지침 추가
    let prompt = `[IDENTITY]\n- Your name is "${name}". You are a helpful AI assistant.\n- You must know that your name is "${name}", but do NOT introduce yourself or say your name at the beginning or end of your reply unless the user explicitly asks "who are you?" or "what is your name?".\n- Always answer the user's question directly without repeating greetings or self-introductions.\n- Never identify yourself as a "large language model trained by Google" or "Google's language model".\n\n`;

    // 2. AI 성향 (Persona)
    if (activeSkill) {
      prompt += `[AI PERSONA (SKILL: ${activeSkill.title})]\n${activeSkill.prompt}\n\n`;
    } else if (currentSettings.nano_ai_persona) {
      prompt += `[AI PERSONA]\n${currentSettings.nano_ai_persona}\n\n`;
    }

    // 3. 공동 세팅 (Common Settings / Rules)
    let globalRules = "";
    let generalRules = "";
    if (typeof window !== "undefined") {
      globalRules = localStorage.getItem("nano-ai-global-rules") || "";
      generalRules = localStorage.getItem("nano-ai-general-rules") || "";
    }

    if (globalRules.trim() || generalRules.trim()) {
      prompt += `[COMMON SETTINGS]\n`;
      if (globalRules.trim()) {
        prompt += `- Global Rules:\n${globalRules.trim()}\n`;
      }
      if (generalRules.trim()) {
        prompt += `- General Rules:\n${generalRules.trim()}\n`;
      }
      prompt += `\n`;
    }

    // 4. 답변 길이 규칙 (Length Rules)
    const lengthRule = currentSettings.nano_ai_context_level === "minimal"
      ? "- [RESPONSE LENGTH RULE]: Please keep your response extremely brief, concise, and compact. Summarize key points in 1-2 short sentences maximum. (반드시 짧고 간결하게 핵심만 1~2문장으로 답변하세요.)"
      : currentSettings.nano_ai_context_level === "detailed"
        ? "- [RESPONSE LENGTH RULE]: Please provide a highly detailed, rich, and comprehensive response with background contexts and thorough explanations. (배경 설명과 심층 분석을 포함해 아주 상세하고 친절하게 장문으로 답변하세요.)"
        : "- [RESPONSE LENGTH RULE]: Please provide a balanced response of moderate length. (적당한 길이로 요약하여 균형 있게 답변하세요.)";

    prompt += `[STYLE RULES]\n${lengthRule}\n\n`;

    // 5. 언어 강제 지침
    const currentLocale = currentSettings.nano_locale || "ko";
    let langRule = "";
    if (currentLocale === "ko") {
      langRule = "[RESPONSE LANGUAGE RULE]: Regardless of the language of the prompt instructions above, you MUST write your final response in Korean. (반드시 최종 답변은 한국어로 친절하게 작성하세요.)";
    } else if (currentLocale === "ja") {
      langRule = "[RESPONSE LANGUAGE RULE]: Regardless of the language of the prompt instructions above, you MUST write your final response in Japanese. (必ず最終回答は日本語で親切に作成してください。)";
    } else {
      langRule = "[RESPONSE LANGUAGE RULE]: Regardless of the language of the prompt instructions above, you MUST write your final response in English.";
    }
    prompt += `[LANGUAGE RULE]\n${langRule}\n`;

    return prompt;
  }, []);

  // 세션 초기화 로직
  const initSession = useCallback(async () => {
    await destroySession();
    try {
      const systemPrompt = buildPromptWithRules(settingsRef.current, activeSkill);
      const s = await createSession(systemPrompt, settingsRef.current.nano_ai_temperature);
      isSystemPromptApplied.current = true;
      return s;
    } catch (err) {
      console.warn("Failed to initialize session with system prompt, trying default.");
      try {
        const s = await createSession(undefined, settingsRef.current.nano_ai_temperature);
        isSystemPromptApplied.current = false;
        return s;
      } catch (e) {
        console.error("Local session init failed completely.", e);
        isSystemPromptApplied.current = false;
        return null;
      }
    }
  }, [createSession, destroySession, buildPromptWithRules, activeSkill]);

  // 세션 클리어 기능
  const clearContext = useCallback(async () => {
    if (currentSessionId && messages.length > 0) {
      const hasUserMsg = messages.some((m) => m.role === "user");
      const title = hasUserMsg ? undefined : "(Empty)";
      saveSession(currentSessionId, messages, "none", title);
    }

    await destroySession();
    if (settingsRef.current.api_mode === "local") {
      await initSession();
    }

    setCurrentSessionId(null);
    clearHistoryIndexRef.current = 0;
    lastLoadedSessionIdRef.current = null;

    const assistantMessageId = Math.random().toString(36).substring(7);
    setMessages([
      {
        id: assistantMessageId,
        role: "assistant",
        content: t("session.clearContext", "🧹 **AI의 이전 대화 맥락 기억이 클리어되었습니다.** (이후의 질문은 이전 내용과 연계되지 않고 완전히 새롭게 답변됩니다.)")
      }
    ]);
  }, [currentSessionId, messages, saveSession, setCurrentSessionId, destroySession, initSession, t]);

  // AI 모드가 로컬일 경우 세션 기동
  useEffect(() => {
    if (isEnabled && settings.api_mode === "local") {
      initSession();
    }
    return () => {
      destroySession();
    };
  }, [initSession, destroySession, isEnabled, settings.api_mode]);

  // 마운트 시 혹은 세션 ID 로드 시 기존 활성화된 세션의 대화 내역 복원
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      if (lastLoadedSessionIdRef.current !== currentSessionId) {
        const session = sessions.find((s) => s.id === currentSessionId);
        if (session) {
          // 최초 앱 기동(마운트) 시 복원할 세션의 타임아웃 검사 (단발성 뺄셈 계산)
          if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            const timeoutMinutes = settingsRef.current.nano_session_timeout_minutes ?? 60;
            if (timeoutMinutes > 0 && session.messages.length > 0) {
              const elapsedMs = Date.now() - session.timestamp;
              const elapsedMinutes = elapsedMs / 1000 / 60;
              if (elapsedMinutes >= timeoutMinutes) {
                console.log(`[Session Timeout on Mount] Session ${session.id} expired. Starting new session.`);
                setCurrentSessionId(null);
                setMessages([]);
                lastLoadedSessionIdRef.current = null;
                return;
              }
            }
          }

          setMessages(session.messages);
          lastLoadedSessionIdRef.current = currentSessionId;
        }
      }
    } else if (!currentSessionId) {
      lastLoadedSessionIdRef.current = null;
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
      }
    }
  }, [currentSessionId, sessions, setCurrentSessionId]);

  // 스킬 변경 감지 메시지 추가
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevActiveSkillRef.current = activeSkill;
      return;
    }
    const prev = prevActiveSkillRef.current;
    prevActiveSkillRef.current = activeSkill;
    if (prev?.id === activeSkill?.id) return;

    if (isBypassingDeactivationNoticeRef.current) {
      isBypassingDeactivationNoticeRef.current = false;
      return;
    }

    const assistantMessageId = Math.random().toString(36).substring(7);
    if (activeSkill) {
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: assistantMessageId,
          role: "assistant",
          content: t("skills.activation.activated", "💡 **[{title}]** 스킬이 장착되었습니다.\n\n*{description}*{additionalContent}\n\n지침에 맞춰 준비가 완료되었습니다.")
            .replace("{title}", activeSkill.title)
            .replace("{description}", activeSkill.description)
            .replace("{additionalContent}", "")
        }
      ]);
    } else if (prev) {
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: assistantMessageId,
          role: "assistant",
          content: t("skills.activation.deactivated", "💡 **[{title}]** 스킬 장착이 해제되었습니다. 일반 대화 모드로 전환됩니다.")
            .replace("{title}", prev.title)
        }
      ]);
    }
  }, [activeSkill, t]);

  const sendMessage = useCallback(async (text: string, skipWebSearch?: boolean) => {
    if (!text.trim() || isSending) return;

    const currentActiveSkill = activeSkill;
    if (activeSkill && setActiveSkill) {
      isBypassingDeactivationNoticeRef.current = true;
      setActiveSkill(null);
    }

    
    let isQuoteRequest = false;
    let isLearnRequest = false;
    let cleanText = text;
    if (text.endsWith("__QUOTE_EXPLAIN_REQUEST__")) {
      isQuoteRequest = true;
      cleanText = text.replace("__QUOTE_EXPLAIN_REQUEST__", "").trim();
    } else if (text.includes("__LEARN_TODAY_REQUEST__")) {
      isLearnRequest = true;
      cleanText = t ? t("chatbot.quickPrompts.p5.text", "오늘의 외국어 배움 한마디를 준비해 주세요.") : "오늘의 외국어 배움 한마디를 준비해 주세요.";
    }

    let searchResults: SearchResult[] = [];
    let searchTabId: number | undefined = undefined;

    // ──────────────────────────────────────────────
    // 세션 타임아웃 체크: 마지막 메시지로부터 N분 경과 시 새 세션 자동 시작
    // ──────────────────────────────────────────────
    let activeSessionId = currentSessionId;
    let currentMessages = messages;

    const timeoutMinutes = settingsRef.current.nano_session_timeout_minutes ?? 60;
    if (timeoutMinutes > 0 && currentMessages.length > 0) {
      const currentSession = sessions.find((s) => s.id === currentSessionId);
      const lastTime = lastMessageTimeRef.current > 0
        ? lastMessageTimeRef.current
        : (currentSession ? currentSession.timestamp : Date.now());
      const elapsedMs = Date.now() - lastTime;
      const elapsedMinutes = elapsedMs / 1000 / 60;
      if (elapsedMinutes >= timeoutMinutes) {
        // 기존 세션 히스토리 저장
        const expiredSessionId = currentSessionId || "session-" + Date.now();
        saveSession(expiredSessionId, currentMessages, "none");
        // 새 세션으로 전환
        activeSessionId = null;
        setCurrentSessionId(null);
        currentMessages = [];
        setMessages([]);
        clearHistoryIndexRef.current = 0;
        lastLoadedSessionIdRef.current = null;
        // 새 세션 시작 알림 메시지
        const noticeId = Math.random().toString(36).substring(7);
        const noticeMsg = {
          id: noticeId,
          role: "assistant" as const,
          content: t(
            "session.timeoutNewSession",
            `⏱️ **이전 대화 세션이 {minutes}분 비활성으로 히스토리에 저장되었습니다.**\n새로운 대화를 시작합니다.`
          ).replace("{minutes}", String(timeoutMinutes))
        };
        currentMessages = [noticeMsg];
        setMessages(currentMessages);
        // 타이머 리셋
        lastMessageTimeRef.current = Date.now();
      }
    }

    // 세션 ID가 없을 시 새 세션 ID 명시적 생성 및 설정
    if (!activeSessionId) {
      activeSessionId = "session-" + Date.now();
      setCurrentSessionId(activeSessionId);
    }

    setIsSending(true);
    isAbortedRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const userMessageId = Math.random().toString(36).substring(7);
    const assistantMessageId = Math.random().toString(36).substring(7);

    const userMsg = { id: userMessageId, role: "user" as const, content: cleanText };
    const assistantMsg = { id: assistantMessageId, role: "assistant" as const, content: "", isStreaming: true };

    const nextMessages = [...currentMessages, userMsg, assistantMsg];
    setMessages(nextMessages);

    // 첫 메시지 전송 시점에 즉시 임시 저장 (대화 목록에 방 생성)
    saveSession(activeSessionId, nextMessages, "none");

    const updateContent = (content: string) => {
      setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content } : m));
    };

    // ── RAF Throttle: 청크가 매우 빠르게 들어올 때 16ms 단위로 묶어 렌더링 횟수를 줄임
    let rafId: number | null = null;
    let latestContent = "";
    const scheduleContentUpdate = (content: string) => {
      latestContent = content;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateContent(latestContent);
          rafId = null;
        });
      }
    };
    const flushFinalContent = (content: string) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      updateContent(content);
      
      // 답변이 끝난 순간 완성된 메시지 상태를 한 번 더 안전하게 세션 스토리지에 동기화 저장합니다.
      setMessages((prev) => {
        const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content, isStreaming: false } : m);
        saveSession(activeSessionId!, finalMsgs, "none");
        return finalMsgs;
      });
    };

    try {
      const currentSettings = settingsRef.current;
      let promptText = cleanText;

      // ──────────────────────────────────────────────
      // 웹 검색 토글 활성화 시 검색 수행 및 프롬프트 인젝션
      // ──────────────────────────────────────────────
      const currentMode = currentSettings.nano_web_search_mode || (currentSettings.nano_web_search_enabled !== undefined ? (currentSettings.nano_web_search_enabled ? "force" : "off") : "auto");
      console.log("[NanoBot] Web search mode in sendMessage:", currentMode);
      
      const shouldSkipSearch = skipWebSearch || text.startsWith("scraped-direct:") || !!currentActiveSkill || isLearnRequest;
      let isSearchActive = false;

      if (!shouldSkipSearch && currentMode !== "off") {
        if (currentMode === "force") {
          isSearchActive = true;
        } else if (currentMode === "auto") {
          // URL 정규식 감지
          const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i.test(text.trim());
          
          // 실시간성 키워드 감지 (휴리스틱 - 다국어 대응 통합 단어 사전 적용)
          const hasTemporalKeyword = ALL_TEMPORAL_KEYWORDS.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (isUrl || hasTemporalKeyword) {
            isSearchActive = true;
            console.log("[NanoBot] Auto mode search triggered. Reason:", isUrl ? "URL detected" : "Temporal keyword detected");
          }
        }
      }

      if (isSearchActive) {
        console.log("[NanoBot] Web search execution starts. query:", text);
        updateContent(t("chatbot.status.searching", "🔍 실시간 검색 결과를 가져오는 중입니다..."));
        try {
          const searchData = await performWebSearch(text);
          searchResults = searchData.results;
          searchTabId = searchData.tabId;
          console.log("[NanoBot] Scrape success. Count:", searchResults.length, "tabId:", searchTabId);
        } catch (searchErr) {
          console.error("[NanoBot] Web search failed:", searchErr);
        }
        // 검색 프로세스가 끝나면 대기 문구 비움
        updateContent("");
      }

      if (searchResults.length > 0) {
        const now = new Date();
        const todayStr = now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
        const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
        const dateHeader = `[📅 Current Date & Time: ${todayStr} ${timeStr}]\n`;

        const searchContext = searchResults
          .map((r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.snippet}`)
          .join("\n\n");

        if (currentSettings.api_mode === "local") {
          const miniRules = buildPromptWithRules(currentSettings, currentActiveSkill);
          promptText = `[SYSTEM INSTRUCTION]\n${miniRules}\n[WEB SEARCH RESULT]\n${dateHeader}${searchContext}\n\n[USER QUESTION]\n${cleanText}\n\n(참고: 제공된 [WEB SEARCH RESULT]의 신뢰성 높은 최신 정보를 분석해서 한국어로 친절하게 답변하세요.)`;
        } else {
          const lengthRule = currentSettings.nano_ai_context_level === "minimal"
            ? "[RESPONSE LENGTH LIMIT]: Please keep your response extremely brief, concise, and compact. Summarize key points in 1-2 short sentences maximum. (반드시 짧고 간결하게 핵심만 1~2문장으로 답변하세요.)"
            : currentSettings.nano_ai_context_level === "detailed"
              ? "[RESPONSE LENGTH RULE]: Please provide a highly detailed, rich, and comprehensive response with background contexts and thorough explanations. (배경 설명과 심층 분석을 포함해 아주 상세하고 친절하게 장문으로 답변하세요.)"
              : "[RESPONSE LENGTH RULE]: Please provide a balanced response of moderate length. (적당한 길이로 요약하여 균형 있게 답변하세요.)";

          promptText = `${lengthRule}\n\n[웹 검색 결과]\n${dateHeader}${searchContext}\n\n[USER QUESTION]\n${cleanText}\n\n(참고: 제공된 [웹 검색 결과]의 신뢰성 높은 내용을 분석해서 친절한 한국어로 답변하세요.)`;
        }
      } else {
        if (currentSettings.api_mode === "local") {
          // 로컬 모드: 소형 모델의 망각 방지를 위해 매 턴마다 강제 룰 결합
          const miniRules = buildPromptWithRules(currentSettings, currentActiveSkill);
          promptText = `[SYSTEM INSTRUCTION]\n${miniRules}\n[USER QUESTION]\n${cleanText}`;
        } else {
          const lengthRule = currentSettings.nano_ai_context_level === "minimal"
            ? "[RESPONSE LENGTH LIMIT]: Please keep your response extremely brief, concise, and compact. Summarize key points in 1-2 short sentences maximum. (반드시 짧고 간결하게 핵심만 1~2문장으로 답변하세요.)"
            : currentSettings.nano_ai_context_level === "detailed"
              ? "[RESPONSE LENGTH RULE]: Please provide a highly detailed, rich, and comprehensive response with background contexts and thorough explanations. (배경 설명과 심층 분석을 포함해 아주 상세하고 친절하게 장문으로 답변하세요.)"
              : "[RESPONSE LENGTH RULE]: Please provide a balanced response of moderate length. (적당한 길이로 요약하여 균형 있게 답변하세요.)";

          promptText = `${lengthRule}\n\n[USER QUESTION]\n${cleanText}`;
        }
      }

      if (isQuoteRequest) {
        const locale = currentSettings.nano_locale || "ko";
        const isEnglish = locale === "en" || /in english|english|영어로/i.test(cleanText);
        const isJapanese = locale === "ja" || /in japanese|japanese|日本語|일본어로/i.test(cleanText);

        if (isEnglish) {
          promptText = promptText + "\n\n[SYSTEM RULE]: Please respond using the special quote card JSON format below. Ensure the JSON is valid and escaped correctly.\nAlways provide both the original English quote and its translation in English (simply repeat the original quote or provide a simplified version if needed).\nFor the 'explanation' field, do not write long paragraphs. Instead, provide a clear, structured summary in exactly 3 concise bullet points (using -) with newlines (\\n) in between in English.\n[QUOTE] {\"text\": \"Original English Quote\", \"translation\": \"English translation or simplified version of the quote\", \"author\": \"Author Name\", \"explanation\": \"- Key Meaning: ...\\n- Practical Lesson: ...\\n- Conclusion: ...\"}\n(Note: The newline must be represented as a single string using the escape character \\n in JSON. Do not output any intro, outro, or bullet list text outside the [QUOTE] block. Return ONLY the [QUOTE] block.)";
        } else if (isJapanese) {
          promptText = promptText + "\n\n[SYSTEM RULE]: Please respond using the special quote card JSON format below. Ensure the JSON is valid and escaped correctly.\nAlways provide both the original English quote and its translation in Japanese.\nFor the 'explanation' field, do not write long paragraphs. Instead, provide a clear, structured summary in exactly 3 concise bullet points (using -) with newlines (\\n) in between in Japanese.\n[QUOTE] {\"text\": \"Original English Quote\", \"translation\": \"Translated Quote in Japanese\", \"author\": \"Author Name\", \"explanation\": \"- 主な意味: ...\\n- 実践的な教訓: ...\\n- 結論: ...\"}\n(注: 改行は必ずJSON内のエスケープ文字 \\n を使用して単一の文字列として表現してください。[QUOTE]ブロック以外には、導入部や結論、箇条書きテキストなど、いかなるテキストも出力しないでください。 [QUOTE]ブロックのみを返してください。)";
        } else {
          promptText = promptText + "\n\n[SYSTEM RULE]: Please respond using the special quote card JSON format below. Ensure the JSON is valid and escaped correctly.\nAlways provide both the original English quote and its translation in the user's language.\nFor the 'explanation' field, do not write long paragraphs. Instead, provide a clear, structured summary in exactly 3 concise bullet points (using -) with newlines (\\n) in between.\n[QUOTE] {\"text\": \"Original English Quote\", \"translation\": \"Translated Quote in user's language (Korean or Japanese)\", \"author\": \"Author Name\", \"explanation\": \"- 핵심 의미: ...\\n- 실천적 교훈: ...\\n- 결론: ...\"}\n(참고: 줄바꿈은 반드시 JSON 내 이스케이프 문자 \\n 을 사용하여 단일 문자열로 표현하세요. [QUOTE] 블록 외에 다른 어떠한 서론, 결론, 혹은 불릿 리스트 텍스트도 절대 출력해서는 안 됩니다. 오직 [QUOTE] 블록 하나만 반환하세요.)";
        }
      }

      if (isLearnRequest) {
        const lang = currentSettings.tutor_lang || "en";
        const level = currentSettings.tutor_level || "adult";
        const diff = currentSettings.tutor_difficulty || "intermediate";
        
        const langNames: Record<string, string> = {
          ko: "Korean (한국어)",
          en: "English (영어)",
          ja: "Japanese (일본어)",
          zh: "Chinese (중국어)",
          es: "Spanish (스페인어)",
          fr: "French (프랑스어)",
          de: "German (독일어)",
          vi: "Vietnamese (베트남어)"
        };
        
        const targetLangName = langNames[lang] || "English (영어)";
        
        const levelNames: Record<string, string> = {
          kids: "Kids (easy words, fairy tale vibes, friendly honorifics, emojis)",
          teens: "Teens (school life, hobbies, internet culture, trendy slangs, casual tone)",
          adult: "Business/Adults (professional contexts, travel, business mails, formal tutor tone)"
        };
        
        const targetLevelName = levelNames[level] || "Business/Adults";

        const diffGuidelines: Record<string, string> = {
          beginner: "Use very simple grammar and extremely common, high-frequency words. Focus on basic everyday survival expressions.",
          intermediate: "Use moderate vocabulary and common idiomatic expressions. Focus on natural daily conversation.",
          advanced: "Use highly sophisticated, advanced, or academic vocabulary. Focus on complex idioms, professional business terminology, and intellectual or philosophical thoughts. Avoid basic or greeting-level sentences."
        };
        
        const targetDiffInstruction = diffGuidelines[diff] || diffGuidelines.intermediate;

        const currentLocale = currentSettings.nano_locale || "ko";
        const topic = currentSettings.tutor_topic || "general";
        
        const topicGuidelines: Record<string, string> = {
          general: "Focus on everyday daily life conversation, casual greetings, general chat, and common expressions used in routine situations.",
          travel: "Focus on travel scenarios, hotel booking, airports, asking directions, restaurants, sightseeing, shopping, and survival conversations abroad.",
          business: "Focus on business contexts, office communication, meetings, professional phone calls, emails, negotiations, and workplace jargon.",
          slang: "Focus on modern slangs, casual idioms, native-only expressions, colloquial phrases, and trending buzzwords in active use.",
          grammar: "Focus on highly useful grammar patterns, structure templates, sentence frames, and practical syntax guidelines."
        };
        const targetTopicInstruction = topicGuidelines[topic] || topicGuidelines.general;

        if (currentLocale === "en") {
          const targetLangName = langNames[lang] || "English (영어)";
          promptText = promptText + "\n\n[SYSTEM RULE]: Respond ONLY with the special [LEARN_CARD] JSON format below. Do not output any other text, intro, or explanation outside the [LEARN_CARD] block. Absolutely no other sentences are allowed. Ensure the JSON is valid and escaped correctly.\nGenerate an interesting, practical expression to learn for the target language: \"" + targetLangName + "\" tailored for target age/level: \"" + targetLevelName + "\", difficulty: \"" + diff + " (" + targetDiffInstruction + ")\" and topic: \"" + topic + " (" + targetTopicInstruction + ")\".\nExplain and translate strictly in English.\n\n[LEARN_CARD] {\n  \"sentence\": \"Original sentence/expression in the target language (e.g. 'Break a leg!')\",\n  \"pronunciation\": \"Phonetic reading/pronunciation guide written strictly using English characters (e.g. '[break uh leg]'). Never use Hangul, Katakana, or other language characters.\",\n  \"translation\": \"Translation of the sentence in English (e.g. 'Good luck!')\",\n  \"vocabulary\": [\n    { \"word\": \"word/phrase\", \"meaning\": \"definition in English\" }\n  ],\n  \"tutor_note\": \"Brief 1-2 sentence explanation in English of when/how to use this expression. Then add a short 2-turn dialogue where EACH LINE is written in " + targetLangName + " first, followed by its English translation in parentheses. Format: '👨‍🏫 Tutor Guide:\\n[1-2 sentence usage tip]\\n\\n💬 Example Dialogue:\\nA: [sentence in " + targetLangName + "] (English meaning)\\nB: [sentence in " + targetLangName + "] (English meaning)'. Crucial: Never use raw unescaped double quotes inside this string value; use single quotes (') or escape them as \\\\\\\" to avoid JSON SyntaxErrors.\"\n}\n(Note: The newline must be represented as a single string using the escape character \\n in JSON. Do not output any intro, outro, or explanation outside the [LEARN_CARD] block. Return ONLY the [LEARN_CARD] block.)";
        } else if (currentLocale === "ja") {
          const targetLangName = langNames[lang] || "English (영어)";
          promptText = promptText + "\n\n[SYSTEM RULE]: Respond ONLY with the special [LEARN_CARD] JSON format below. Do not output any other text, intro, or explanation outside the [LEARN_CARD] block. Absolutely no other sentences are allowed. Ensure the JSON is valid and escaped correctly.\nGenerate an interesting, practical expression to learn for the target language: \"" + targetLangName + "\" tailored for target age/level: \"" + targetLevelName + "\", difficulty: \"" + diff + " (" + targetDiffInstruction + ")\" and topic: \"" + topic + " (" + targetTopicInstruction + ")\".\nExplain and translate strictly in Japanese.\n\n[LEARN_CARD] {\n  \"sentence\": \"Original sentence/expression in the target language (e.g. 'Break a leg!')\",\n  \"pronunciation\": \"Phonetic reading/pronunciation guide written strictly using Japanese Katakana (e.g. '[ブレイク ア レッグ]'). Never use Hangul, English, or other language characters.\",\n  \"translation\": \"Translation of the sentence in Japanese (e.g. '幸運を祈る！')\",\n  \"vocabulary\": [\n    { \"word\": \"word/phrase\", \"meaning\": \"definition in Japanese\" }\n  ],\n  \"tutor_note\": \"1〜2文の簡潔な使い方の説明（日本語）。その後、2ターンの会話例を追加。各行はまず" + targetLangName + "で書き、次に括弧内に日本語訳を記載する。形式：'👨‍🏫 チューターガイド:\\n[1〜2文の使い方]\\n\\n💬 会話例:\\nA: [" + targetLangName + "の文] (日本語訳)\\nB: [" + targetLangName + "の文] (日本語訳)'. Crucial: Never use raw unescaped double quotes inside this string value; use single quotes (') or escape them as \\\\\\\" to avoid JSON SyntaxErrors.\"\n}\n(注: 改行は必ずJSON内のエスケープ文字 \\n を使用して単一の文字列として表現してください。[LEARN_CARD]ブロック以外には、導入部や結論、解説テキストなど、いかなるテキストも出力しないでください。 [LEARN_CARD]ブロックのみを返してください。)";
        } else {
          const targetLangName = langNames[lang] || "English (영어)";
          promptText = promptText + "\n\n[SYSTEM RULE]: Respond ONLY with the special [LEARN_CARD] JSON format below. Do not output any other text, intro, or explanation outside the [LEARN_CARD] block. Absolutely no other sentences are allowed. Ensure the JSON is valid and escaped correctly.\nGenerate an interesting, practical expression to learn for the target language: \"" + targetLangName + "\" tailored for target age/level: \"" + targetLevelName + "\", difficulty: \"" + diff + " (" + targetDiffInstruction + ")\" and topic: \"" + topic + " (" + targetTopicInstruction + ")\".\nExplain and translate strictly in Korean.\n\n[LEARN_CARD] {\n  \"sentence\": \"Original sentence/expression in the target language (e.g. 'Break a leg!')\",\n  \"pronunciation\": \"Phonetic reading/pronunciation guide written strictly and ONLY using Korean Hangul (e.g. '[브레이크 어 렉]'). Never use Japanese Katakana, Hiragana, English, or other language characters. Absolutely strictly enforce Hangul characters only.\",\n  \"translation\": \"Translation of the sentence in Korean (e.g. '행운을 빌어!')\",\n  \"vocabulary\": [\n    { \"word\": \"word/phrase\", \"meaning\": \"definition in Korean\" }\n  ],\n  \"tutor_note\": \"1~2문장의 간결한 사용법 설명(한국어). 그 후, 2턴 대화 예시를 추가하되 각 대화 줄은 반드시 " + targetLangName + "으로 먼저 쓰고, 괄호 안에 한국어 뜻을 병기한다. 형식: '👨‍🏫 튜터 가이드:\\n[1~2문장 사용 팁]\\n\\n💬 예시 대화:\\nA: [" + targetLangName + " 문장] (한국어 뜻)\\nB: [" + targetLangName + " 문장] (한국어 뜻)'. Crucial: Never use raw unescaped double quotes inside this string value; use single quotes (') or escape them as \\\\\\\" to avoid JSON SyntaxErrors.\"\n}\n(참고: 줄바꿈은 반드시 JSON 내 이스케이프 문자 \\n 을 사용하여 단일 문자열로 표현하세요. [LEARN_CARD] 블록 외에 다른 어떠한 서론, 결론 텍스트도 절대 출력해서는 안 됩니다.)";
        }
      }
const flushFinalContent = (content: string) => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        updateContent(content);
        
        // 답변이 끝난 순간 완성된 메시지 상태를 한 번 더 안전하게 세션 스토리지에 동기화 저장합니다.
        setMessages((prev) => {
          const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content, isStreaming: false, sources: searchResults.length > 0 ? searchResults : undefined, searchTabId, searchQuery: searchResults.length > 0 ? text : undefined } : m);
          saveSession(activeSessionId!, finalMsgs, "none");
          return finalMsgs;
        });
      };

      if (currentSettings.api_mode === "local") {
        // ──────────────────────────────────────────────
        // Dual-Pass Guardrails: 메인 AI에 전달 전 안전성 선제 판별 (조건부 적용)
        // ──────────────────────────────────────────────
        if (ENABLE_CHAT_SAFETY) {
          const isSafe = await checkSafety(text);

          // unsafe로 판정된 경우 즉시 차단
          if (!isSafe) {
            const blockText = t(
              "guardrail.blocked",
              "🚫 **안전 가이드라인 위반이 감지되었습니다.**\n\n해당 요청은 선정적이거나 위험한 내용을 포함하고 있어 답변을 제공할 수 없습니다.\n일반적인 질문으로 다시 시도해 주세요."
            );
            updateContent(blockText);
            setMessages((prev) => {
              const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content: blockText, isStreaming: false, sources: searchResults.length > 0 ? searchResults : undefined, searchTabId, searchQuery: searchResults.length > 0 ? text : undefined } : m);
              saveSession(activeSessionId!, finalMsgs, "none");
              return finalMsgs;
            });
            return;
          }
        }


        // 백그라운드 서비스 워커의 세션 활성 여부 체크
        const isSessionActive = await new Promise<boolean>((resolve) => {
          try {
            chrome.runtime.sendMessage({ action: "check_session_active" }, (res) => {
              resolve(!!res?.active);
            });
          } catch (e) {
            resolve(false);
          }
        });

        let activeSession = aiSession;
        if (!activeSession || !isSessionActive) {
          activeSession = await initSession();
        }
        if (!activeSession) throw new Error("Local AI session is not initialized.");
        let accumulated = "";
        if (typeof activeSession.promptStreaming === "function") {
          const stream = activeSession.promptStreaming(promptText, { signal: abortControllerRef.current?.signal });
          for await (const chunk of stream) {
            if (isAbortedRef.current) break;
            
            if (chunk) {
              if (chunk.startsWith(accumulated)) {
                accumulated = chunk;
              } else {
                accumulated += chunk;
              }
            }
            scheduleContentUpdate(accumulated);
          }
          flushFinalContent(accumulated);
        } else {
          const res = await activeSession.prompt(promptText, { signal: abortControllerRef.current?.signal });
          updateContent(res);
          setMessages((prev) => {
            const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content: res, isStreaming: false, sources: searchResults.length > 0 ? searchResults : undefined, searchTabId, searchQuery: searchResults.length > 0 ? text : undefined } : m);
            saveSession(activeSessionId!, finalMsgs, "none");
            return finalMsgs;
          });
        }
      } else {
        let accumulated = "";
        await ChatbotModel.streamExternalChat(
          currentMessages.concat({ id: userMessageId, role: "user", content: promptText }),
          (chunk) => {
            if (isAbortedRef.current) return;
            accumulated += chunk;
            scheduleContentUpdate(accumulated);
          },
          () => { flushFinalContent(accumulated); },
          (err) => { throw err; },
          abortControllerRef.current?.signal,
          currentActiveSkill
        );
      }

      setMessages((prev) => {
        const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false, sources: searchResults.length > 0 ? searchResults : undefined, searchTabId, searchQuery: searchResults.length > 0 ? text : undefined } : m);
        saveSession(activeSessionId!, finalMsgs, "none");
        return finalMsgs;
      });
      lastMessageTimeRef.current = Date.now();
    } catch (err: any) {
      if (err.name === "AbortError" || isAbortedRef.current) {
        setMessages((prev) => {
          const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false, sources: searchResults.length > 0 ? searchResults : undefined, searchTabId, searchQuery: searchResults.length > 0 ? text : undefined } : m);
          saveSession(activeSessionId!, finalMsgs, "none");
          return finalMsgs;
        });
      } else {
        console.error(err);
        const errMsg = err?.message || String(err);
        const errorContent = `오류가 발생했습니다: ${errMsg}\n\n브라우저 및 온디바이스 설정을 확인해 주세요.`;
        updateContent(errorContent);
        setMessages((prev) => {
          const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content: errorContent, isStreaming: false, sources: searchResults.length > 0 ? searchResults : undefined, searchTabId, searchQuery: searchResults.length > 0 ? text : undefined } : m);
          saveSession(activeSessionId!, finalMsgs, "none");
          return finalMsgs;
        });
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [isSending, aiSession, messages, activeSkill, initSession, currentSessionId, saveSession, setCurrentSessionId, sessions, t, setActiveSkill]);

  const stopGeneration = useCallback(() => {
    isAbortedRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setMessages((prev) =>
      prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    );
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      setMessages([]);
    }
  }, [currentSessionId, deleteSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isSending,
    sendMessage,
    resetConversation,
    stopGeneration,
    reloadSession: initSession,
    clearContext,
    sessions,
    currentSessionId,
    loadSession,
    deleteSession: handleDeleteSession,
    createNewSession,
    clearAllSessions,
    clearMessages
  };
}

