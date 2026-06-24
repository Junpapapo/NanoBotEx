import { useState, useRef, useCallback, useEffect } from "react";

export function useAISession() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const sessionRef = useRef<any>(null);

  // 브라우저 window.ai 지원 확인
  useEffect(() => {
    const checkAI = async () => {
      const ai = (window as any).ai;
      if (ai) {
        try {
          const capabilities = await ai.assistant?.capabilities();
          setIsSupported(capabilities && capabilities.available !== "no");
        } catch {
          // 구버전 또는 대체 API 스펙 대응
          setIsSupported(typeof ai.createTextSession === "function" || typeof ai.assistant?.create === "function");
        }
      }
    };
    checkAI();
  }, []);

  const destroySession = useCallback(async () => {
    if (sessionRef.current) {
      try {
        if (typeof sessionRef.current.destroy === "function") {
          await sessionRef.current.destroy();
        } else if (typeof sessionRef.current.close === "function") {
          await sessionRef.current.close();
        }
      } catch (e) {
        console.warn("Failed to destroy local AI session:", e);
      }
      sessionRef.current = null;
    }
  }, []);

  const createSession = useCallback(async (systemPrompt?: string) => {
    await destroySession();
    const ai = (window as any).ai;
    if (!ai) throw new Error("window.ai is not available");

    const options: any = {};
    if (systemPrompt) {
      options.systemPrompt = systemPrompt;
    }

    if (ai.assistant && typeof ai.assistant.create === "function") {
      sessionRef.current = await ai.assistant.create(options);
    } else if (typeof ai.createTextSession === "function") {
      sessionRef.current = await ai.createTextSession(options);
    } else {
      throw new Error("Cannot find session creation method on window.ai");
    }

    return sessionRef.current;
  }, [destroySession]);

  // 언마운트 시 자동 파괴
  useEffect(() => {
    return () => {
      destroySession();
    };
  }, [destroySession]);

  return {
    isSupported,
    session: sessionRef.current,
    createSession,
    destroySession
  };
}
