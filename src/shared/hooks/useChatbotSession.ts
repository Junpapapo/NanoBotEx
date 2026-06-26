import { useState, useCallback, useRef, useEffect } from "react";
import { Message, UserSettings, Skill } from "../chatbot-types";
import { useSessionHistory } from "./useSessionHistory";
import { useAISession } from "./useAISession";
import { ChatbotModel } from "../chatbot-model";
import { checkSafety } from "../utils/safety-guard";

export function useChatbotSession(
  isEnabled: boolean,
  settings: UserSettings,
  activeSkill: Skill | null,
  skills: Skill[],
  t: (key: string, def: string) => string
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

  // 세션 초기화 로직
  const initSession = useCallback(async () => {
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
      systemPrompt += settingsRef.current.nano_ai_persona;

      // 답변 길이 조절(nano_ai_context_level) 지침 주입
      const lengthRule = settingsRef.current.nano_ai_context_level === "minimal"
        ? "\n\n[RESPONSE LENGTH LIMIT]: Please keep your response extremely brief, concise, and compact. Summarize key points in 1-2 short sentences maximum. (반드시 짧고 간결하게 핵심만 1~2문장으로 답변하세요.)"
        : settingsRef.current.nano_ai_context_level === "detailed"
          ? "\n\n[RESPONSE LENGTH RULE]: Please provide a highly detailed, rich, and comprehensive response with background contexts and thorough explanations. (배경 설명과 심층 분석을 포함해 아주 상세하고 친절하게 장문으로 답변하세요.)"
          : "\n\n[RESPONSE LENGTH RULE]: Please provide a balanced response of moderate length. (적당한 길이로 요약하여 균형 있게 답변하세요.)";
      
      systemPrompt += lengthRule;

      if (activeSkill) {
        systemPrompt += `\n\n[ACTIVE SKILL INSTRUCTIONS - ${activeSkill.title}]\n${activeSkill.prompt}`;
      }

      if (generalRules.trim()) {
        systemPrompt += `\n\n[GENERAL CONVERSATION RULES]\n${generalRules.trim()}`;
      }

      // 설정 언어 지침 강제 주입 (스킬 프롬프트가 영어이더라도 사용자 언어설정에 맞춰 대답하도록 함)
      const currentLocale = settingsRef.current.nano_locale || "ko";
      let langRule = "";
      if (currentLocale === "ko") {
        langRule = "\n\n[RESPONSE LANGUAGE RULE]: Regardless of the language of the prompt instructions above, you MUST write your final response in Korean. (반드시 최종 답변은 한국어로 친절하게 작성하세요.)";
      } else if (currentLocale === "ja") {
        langRule = "\n\n[RESPONSE LANGUAGE RULE]: Regardless of the language of the prompt instructions above, you MUST write your final response in Japanese. (必ず最終回答は日本語で親切に作成してください。)";
      } else {
        langRule = "\n\n[RESPONSE LANGUAGE RULE]: Regardless of the language of the prompt instructions above, you MUST write your final response in English.";
      }
      systemPrompt += langRule;

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
  }, [createSession, destroySession, activeSkill]);

  // AI 모드가 로컬일 경우 세션 기동
  useEffect(() => {
    if (isEnabled && settings.api_mode === "local") {
      initSession();
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
    saveSession(targetId, messages, "none");
  }, [messages, currentSessionId, saveSession, setCurrentSessionId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    isAbortedRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const userMessageId = Math.random().toString(36).substring(7);
    const assistantMessageId = Math.random().toString(36).substring(7);

    setMessages((prev) => [...prev, { id: userMessageId, role: "user", content: text }]);
    setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "", isStreaming: true }]);

    const updateContent = (content: string) => {
      setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content } : m));
    };

    try {
      const currentSettings = settingsRef.current;
      let promptText = text;
      const lengthRule = currentSettings.nano_ai_context_level === "minimal"
        ? "[RESPONSE LENGTH LIMIT]: Please keep your response extremely brief, concise, and compact. Summarize key points in 1-2 short sentences maximum. (반드시 짧고 간결하게 핵심만 1~2문장으로 답변하세요.)"
        : currentSettings.nano_ai_context_level === "detailed"
          ? "[RESPONSE LENGTH RULE]: Please provide a highly detailed, rich, and comprehensive response with background contexts and thorough explanations. (배경 설명과 심층 분석을 포함해 아주 상세하고 친절하게 장문으로 답변하세요.)"
          : "[RESPONSE LENGTH RULE]: Please provide a balanced response of moderate length. (적당한 길이로 요약하여 균형 있게 답변하세요.)";

      if (currentSettings.api_mode === "local" && !isSystemPromptApplied.current) {
        let systemRules = "";
        let globalRules = "";
        let generalRules = "";
        if (typeof window !== "undefined") {
          globalRules = localStorage.getItem("nano-ai-global-rules") || "";
          generalRules = localStorage.getItem("nano-ai-general-rules") || "";
        }

        if (globalRules.trim()) {
          systemRules += `[MUST FOLLOW - GLOBAL RULES]\n${globalRules.trim()}\n\n`;
        }
        if (currentSettings.nano_ai_persona) {
          systemRules += `[AI PERSONA]\n${currentSettings.nano_ai_persona}\n\n`;
        }
        systemRules += `${lengthRule}\n\n`;
        if (activeSkill) {
          systemRules += `[ACTIVE SKILL INSTRUCTIONS - ${activeSkill.title}]\n${activeSkill.prompt}\n\n`;
        } else if (generalRules.trim()) {
          systemRules += `[GENERAL CONVERSATION RULES]\n${generalRules.trim()}\n\n`;
        }
        
        promptText = `${systemRules}[USER QUESTION]\n${text}`;
      } else {
        if (activeSkill) {
          promptText = `${lengthRule}\n\n[AI 스킬 규칙 - ${activeSkill.title}]\n${activeSkill.prompt}\n\n[사용자 입력]\n${text}`;
        } else {
          promptText = `${lengthRule}\n\n[USER QUESTION]\n${text}`;
        }
      }

      if (currentSettings.api_mode === "local") {
        // ──────────────────────────────────────────────
        // Dual-Pass Guardrails: 메인 AI에 전달 전 안전성 선제 판별
        // ──────────────────────────────────────────────
        const isSafe = await checkSafety(text);

        // unsafe로 판정된 경우 즉시 차단
        if (!isSafe) {
          updateContent(
            t(
              "guardrail.blocked",
              "🚫 **안전 가이드라인 위반이 감지되었습니다.**\n\n해당 요청은 선정적이거나 위험한 내용을 포함하고 있어 답변을 제공할 수 없습니다.\n일반적인 질문으로 다시 시도해 주세요."
            )
          );
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, isStreaming: false } : m))
          );
          return;
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
            updateContent(accumulated);
          }
        } else {
          const res = await activeSession.prompt(promptText, { signal: abortControllerRef.current?.signal });
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
        const errMsg = err?.message || String(err);
        updateContent(`오류가 발생했습니다: ${errMsg}\n\n브라우저 및 온디바이스 설정을 확인해 주세요.`);
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [isSending, aiSession, messages, activeSkill, initSession]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      setMessages([]);
    }
  }, [currentSessionId, deleteSession]);

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
    clearAllSessions
  };
}
