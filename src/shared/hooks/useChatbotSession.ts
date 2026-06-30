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
  const lastMessageTimeRef = useRef<number>(0);
  const lastLoadedSessionIdRef = useRef<string | null>(null);



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
  const buildPromptWithRules = useCallback((currentSettings: UserSettings) => {
    const name = currentSettings.nano_ai_avatar_name || "NanoBot";
    
    // 1. 정체성 정의 (Identity) - 불필요한 이름 남발 억제 지침 추가
    let prompt = `[IDENTITY]\n- Your name is "${name}". You are a helpful AI assistant.\n- You must know that your name is "${name}", but do NOT introduce yourself or say your name at the beginning or end of your reply unless the user explicitly asks "who are you?" or "what is your name?".\n- Always answer the user's question directly without repeating greetings or self-introductions.\n- Never identify yourself as a "large language model trained by Google" or "Google's language model".\n\n`;

    // 2. AI 성향 (Persona)
    if (currentSettings.nano_ai_persona) {
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
      const systemPrompt = buildPromptWithRules(settingsRef.current);
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
  }, [createSession, destroySession, buildPromptWithRules]);

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
          setMessages(session.messages);
          lastLoadedSessionIdRef.current = currentSessionId;
        }
      }
    } else if (!currentSessionId) {
      lastLoadedSessionIdRef.current = null;
    }
  }, [currentSessionId, sessions]);

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

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;

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

    const userMsg = { id: userMessageId, role: "user" as const, content: text };
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
      let promptText = text;

      if (currentSettings.api_mode === "local") {
        // 로컬 모드: 소형 모델의 망각 방지를 위해 매 턴마다 강제 룰 결합
        const miniRules = buildPromptWithRules(currentSettings);
        let activeSkillSection = "";
        if (activeSkill) {
          activeSkillSection = `[ACTIVE SKILL INSTRUCTIONS - ${activeSkill.title}]\n${activeSkill.prompt}\n\n`;
        }
        
        promptText = `[SYSTEM INSTRUCTION]\n${miniRules}${activeSkillSection}\n[USER QUESTION]\n${text}`;
      } else {
        const lengthRule = currentSettings.nano_ai_context_level === "minimal"
          ? "[RESPONSE LENGTH LIMIT]: Please keep your response extremely brief, concise, and compact. Summarize key points in 1-2 short sentences maximum. (반드시 짧고 간결하게 핵심만 1~2문장으로 답변하세요.)"
          : currentSettings.nano_ai_context_level === "detailed"
            ? "[RESPONSE LENGTH RULE]: Please provide a highly detailed, rich, and comprehensive response with background contexts and thorough explanations. (배경 설명과 심층 분석을 포함해 아주 상세하고 친절하게 장문으로 답변하세요.)"
            : "[RESPONSE LENGTH RULE]: Please provide a balanced response of moderate length. (적당한 길이로 요약하여 균형 있게 답변하세요.)";

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
          const blockText = t(
            "guardrail.blocked",
            "🚫 **안전 가이드라인 위반이 감지되었습니다.**\n\n해당 요청은 선정적이거나 위험한 내용을 포함하고 있어 답변을 제공할 수 없습니다.\n일반적인 질문으로 다시 시도해 주세요."
          );
          updateContent(blockText);
          setMessages((prev) => {
            const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content: blockText, isStreaming: false } : m);
            saveSession(activeSessionId!, finalMsgs, "none");
            return finalMsgs;
          });
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
            scheduleContentUpdate(accumulated);
          }
          flushFinalContent(accumulated);
        } else {
          const res = await activeSession.prompt(promptText, { signal: abortControllerRef.current?.signal });
          updateContent(res);
          setMessages((prev) => {
            const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content: res, isStreaming: false } : m);
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
          abortControllerRef.current?.signal
        );
      }

      setMessages((prev) => {
        const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false } : m);
        saveSession(activeSessionId!, finalMsgs, "none");
        return finalMsgs;
      });
      lastMessageTimeRef.current = Date.now();
    } catch (err: any) {
      if (err.name === "AbortError" || isAbortedRef.current) {
        setMessages((prev) => {
          const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false } : m);
          saveSession(activeSessionId!, finalMsgs, "none");
          return finalMsgs;
        });
      } else {
        console.error(err);
        const errMsg = err?.message || String(err);
        const errorContent = `오류가 발생했습니다: ${errMsg}\n\n브라우저 및 온디바이스 설정을 확인해 주세요.`;
        updateContent(errorContent);
        setMessages((prev) => {
          const finalMsgs = prev.map((m) => m.id === assistantMessageId ? { ...m, content: errorContent, isStreaming: false } : m);
          saveSession(activeSessionId!, finalMsgs, "none");
          return finalMsgs;
        });
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [isSending, aiSession, messages, activeSkill, initSession, currentSessionId, saveSession, setCurrentSessionId, sessions, t]);

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
