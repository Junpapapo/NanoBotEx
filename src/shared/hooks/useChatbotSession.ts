import { useState, useCallback, useRef, useEffect } from "react";
import { Message, StockContext, ScenarioType, UserSettings, Skill } from "../chatbot-types";
import { useSessionHistory } from "./useSessionHistory";
import { useAISession } from "./useAISession";
import { runStandardScenario, runWebScrapeAndAnalyze, runRAG, searchAndDetectStock } from "../utils/scenarioRunner";
import { ChatbotModel } from "../chatbot-model";

export function useChatbotSession(
  isEnabled: boolean,
  settings: UserSettings,
  activeSkill: Skill | null,
  skills: Skill[],
  t: (key: string, def: string) => string
) {
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
  const [historyEnabled, setHistoryEnabled] = useState<boolean>(false);
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>("none");
  const [activeStockContext, setActiveStockContext] = useState<StockContext | null>(null);

  const prevActiveSkillRef = useRef<Skill | null>(null);
  const isFirstRender = useRef(true);
  const isAbortedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const clearHistoryIndexRef = useRef<number>(0);
  const sessionHasRAGRef = useRef<string | null>(null);

  // 세션 클리어 기능
  const clearContext = useCallback(() => {
    clearHistoryIndexRef.current = messages.length;
    const assistantMessageId = Math.random().toString(36).substring(7);
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: t("session.clearContext", "🧹 **AI의 이전 대화 맥락 기억이 클리어되었습니다.**")
      }
    ]);
  }, [messages.length, t]);

  // 대화 세션 복원
  const loadSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setCurrentScenario(session.scenario);
      clearHistoryIndexRef.current = 0;
    }
  }, [sessions, setCurrentSessionId]);

  // 새로운 대화 시작 (세션 리셋)
  const createNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    setCurrentScenario("none");
    setActiveStockContext(null);
  }, [setCurrentSessionId]);

  // 세션 파괴 및 대화 초기화
  const resetConversation = useCallback(async () => {
    await destroySession();
    clearHistoryIndexRef.current = 0;
    setMessages([]);
    setIsSending(false);
    setCurrentScenario("none");
    setActiveStockContext(null);
    sessionHasRAGRef.current = null;
    setCurrentSessionId(null);
  }, [destroySession, setCurrentSessionId]);

  // 세션 초기화 로직
  const initSession = useCallback(async (stockContext: StockContext | null) => {
    await destroySession();
    try {
      let globalRules = "";
      let generalRules = "";
      if (typeof window !== "undefined") {
        globalRules = localStorage.getItem("nano-ai-global-rules") || "";
        generalRules = localStorage.getItem("nano-ai-general-rules") || "";
      }

      let systemPrompt = "";
      if (globalRules.trim()) {
        systemPrompt += `[MUST FOLLOW - GLOBAL RULES]\n${globalRules.trim()}\n\n`;
      }
      systemPrompt += settings.nano_ai_persona;

      if (activeSkill) {
        systemPrompt += `\n\n[ACTIVE SKILL INSTRUCTIONS - ${activeSkill.title}]\n${activeSkill.prompt}`;
      }

      if (!stockContext && currentScenario === "none" && generalRules.trim()) {
        systemPrompt += `\n\n[GENERAL CONVERSATION RULES]\n${generalRules.trim()}`;
      }

      if (stockContext) {
        const currency = stockContext.currency || (stockContext.market === "US" ? "USD" : "KRW");
        systemPrompt += `\n\n[실시간 분석 연동 정보 (RAG)]
- 종목명: ${stockContext.name} (${stockContext.ticker})
- 현재가: ${stockContext.price.toLocaleString()} ${currency}
위의 데이터를 바탕으로, 사용자가 질문할 때 이 실시간 데이터를 직접적으로 참고하여 시장 흐름과 최신 이슈를 정확히 반영해 분석하고 설명해 주세요.`;
      }

      await createSession(systemPrompt);
      sessionHasRAGRef.current = stockContext ? stockContext.ticker : null;
    } catch (err) {
      console.warn("Failed to initialize session with system prompt, trying default.");
      try {
        await createSession();
        sessionHasRAGRef.current = null;
      } catch (e) {
        console.error("Local session init failed completely.", e);
      }
    }
  }, [createSession, destroySession, settings.nano_ai_persona, currentScenario, activeSkill]);

  // AI 모드가 로컬일 경우 세션 기동
  useEffect(() => {
    if (isEnabled && settings.api_mode === "local") {
      initSession(activeStockContext);
    }
    return () => {
      destroySession();
    };
  }, [initSession, destroySession, isEnabled, settings.api_mode]);

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

    const assistantMessageId = Math.random().toString(36).substring(7);
    if (activeSkill) {
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: assistantMessageId,
          role: "assistant",
          content: t("skills.activation.activated", "💡 **[{title}]** 스킬이 장착되었습니다.\n\n지침에 맞춰 준비가 완료되었습니다.")
            .replace("{title}", activeSkill.title)
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

  // 메시지 갱신 시 백업 보관
  useEffect(() => {
    if (messages.length === 0) return;
    const targetId = currentSessionId || "session-" + Date.now();
    if (!currentSessionId) {
      setCurrentSessionId(targetId);
    }
    saveSession(targetId, messages, currentScenario);
  }, [messages, currentSessionId, currentScenario, saveSession, setCurrentSessionId]);

  const sendMessage = useCallback(async (text: string, overrideRAGMode?: "RAG_ONLY" | "LOCAL_ONLY" | "PLAIN_QUESTION") => {
    if (!text.trim() || isSending) return;

    const hasRAGTag = text.includes("*") || text.includes("[REALTIME_SEARCH");
    if (currentScenario === "TPOCKET_SHORTCUTS" && hasRAGTag && !overrideRAGMode) {
      const userMessageId = Math.random().toString(36).substring(7);
      const assistantMessageId = Math.random().toString(36).substring(7);
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: "user", content: text },
        {
          id: assistantMessageId,
          role: "assistant",
          content: t("session.ragDetect.desc", "💡 **실시간 검색 RAG 연동 지시가 감지되었습니다.**"),
          suggestions: [
            { code: "ACTION_RAG_YES", name: t("session.ragDetect.yes", "실시간 연동 분석 실행 ⚡"), price: 0, market: text, ticker: "RAG_YES" },
            { code: "ACTION_RAG_NO", name: t("session.ragDetect.no", "일반 AI 답변 생성"), price: 0, market: text, ticker: "RAG_NO" }
          ]
        }
      ]);
      return;
    }

    setIsSending(true);
    isAbortedRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const userMessageId = Math.random().toString(36).substring(7);
    const assistantMessageId = Math.random().toString(36).substring(7);

    if (!overrideRAGMode) {
      setMessages((prev) => [...prev, { id: userMessageId, role: "user", content: text }]);
    }
    setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "", isStreaming: true }]);

    const updateContent = (content: string) => {
      setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content } : m));
    };

    try {
      // 1. 일반 시나리오 실행 (PRICE_CHECK, NEWS_CHECK, PORTFOLIO_OPT)
      if (currentScenario !== "none" && currentScenario !== "TPOCKET_SHORTCUTS") {
        if (currentScenario === "PAGE_ANALYZE") {
          await runWebScrapeAndAnalyze(text, t, aiSession, settings.api_mode, updateContent, () => isAbortedRef.current);
        } else {
          const onMultiple = (sugs: any[], msgContent: string) => {
            setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content: msgContent, isStreaming: false, suggestions: sugs } : m));
          };
          const detected = await runStandardScenario(currentScenario, text, activeStockContext, t, onMultiple, updateContent);
          if (detected && detected !== "multiple") {
            setActiveStockContext(detected);
          }
        }
        setIsSending(false);
        setCurrentScenario("none");
        return;
      }

      // 2. 종목 자동 감지
      let currentStock = activeStockContext;
      if (overrideRAGMode !== "PLAIN_QUESTION") {
        const onMultiple = (sugs: any[], msgContent: string) => {
          setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content: msgContent, isStreaming: false, suggestions: sugs } : m));
        };
        const detected = await searchAndDetectStock(text, activeStockContext, t, onMultiple);
        if (detected === "multiple") {
          setIsSending(false);
          return;
        }
        if (detected) {
          currentStock = detected;
          if (sessionHasRAGRef.current !== detected.ticker) {
            setActiveStockContext(detected);
            await initSession(detected);
          }
        }
      }

      // 3. RAG 처리
      const shouldRunRAG = overrideRAGMode === "RAG_ONLY" || (overrideRAGMode !== "LOCAL_ONLY" && (text.includes("*") || text.includes("[REALTIME_SEARCH")));
      if (shouldRunRAG) {
        const promptWithHistory = text; // 단순화
        await runRAG(text, promptWithHistory, t, updateContent);
        setIsSending(false);
        return;
      }

      // 4. 일반 AI 대화 실행 (로컬 vs API)
      let promptText = text;
      if (activeSkill) {
        promptText = `[AI 스킬 규칙 - ${activeSkill.title}]\n${activeSkill.prompt}\n\n[사용자 입력]\n${text}`;
      }

      if (settings.api_mode === "local") {
        if (!aiSession) throw new Error("Local AI session is not initialized.");
        let accumulated = "";
        if (typeof aiSession.promptStreaming === "function") {
          const stream = aiSession.promptStreaming(promptText, { signal: abortControllerRef.current?.signal });
          for await (const chunk of stream) {
            if (isAbortedRef.current) break;
            accumulated = chunk;
            updateContent(accumulated);
          }
        } else {
          const res = await aiSession.prompt(promptText, { signal: abortControllerRef.current?.signal });
          updateContent(res);
        }
      } else {
        let accumulated = "";
        await ChatbotModel.streamExternalChat(
          messages.concat({ id: userMessageId, role: "user", content: promptText }),
          (chunk) => {
            if (isAbortedRef.current) return;
            accumulated += chunk;
            updateContent(accumulated);
          },
          () => {},
          (err) => { throw err; },
          abortControllerRef.current?.signal
        );
      }

      setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false } : m));
    } catch (err: any) {
      if (err.name === "AbortError" || isAbortedRef.current) {
        setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false } : m));
      } else {
        console.error(err);
        updateContent(t("session.errorOccurred", "오류가 발생했습니다. 브라우저 및 온디바이스 설정을 확인해 주세요."));
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [isSending, currentScenario, activeStockContext, aiSession, settings.api_mode, messages, activeSkill, initSession, t]);

  const triggerScenario = useCallback((scenario: ScenarioType) => {
    setCurrentScenario(scenario);
    let content = "";
    if (scenario === "PRICE_CHECK") content = t("session.scenarios.priceCheck", "📊 **시세를 확인할 종목명을 입력해 주세요.**");
    else if (scenario === "NEWS_CHECK") content = t("session.scenarios.newsCheck", "📰 **최신 뉴스를 확인할 종목명을 입력해 주세요.**");
    else if (scenario === "PAGE_ANALYZE") content = t("session.scenarios.webAnalyze", "📄 **요약 및 분석할 웹 페이지 주소(URL)를 입력해 주세요.**");
    else if (scenario === "PORTFOLIO_OPT") content = t("session.scenarios.portfolioOpt", "⚖️ **미국 주식 티커들을 쉼표로 구분하여 입력해 주세요 (예: AAPL, MSFT).**");

    if (content) {
      setMessages(prev => [...prev, { id: Math.random().toString(36).substring(7), role: "assistant", content }]);
    }
  }, [t]);

  return {
    messages,
    isSending,
    sendMessage,
    resetConversation,
    stopGeneration,
    reloadSession: initSession,
    historyEnabled,
    setHistoryEnabled,
    currentScenario,
    triggerScenario,
    clearContext,
    sessions,
    currentSessionId,
    loadSession,
    deleteSession,
    createNewSession,
    clearAllSessions
  };
}
