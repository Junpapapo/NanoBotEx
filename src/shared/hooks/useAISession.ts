import { useState, useCallback, useEffect } from "react";

export function useAISession() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);

  // 백그라운드 스크립트를 통해 AI 지원 여부 감지
  useEffect(() => {
    const checkAI = async () => {
      try {
        chrome.runtime.sendMessage({ action: "check_ai_support" }, (res) => {
          setIsSupported(!!res?.supported);
        });
      } catch (err) {
        console.warn("Failed to contact background script for AI support check:", err);
        setIsSupported(false);
      }
    };
    checkAI();
  }, []);

  const destroySession = useCallback(async () => {
    try {
      chrome.runtime.sendMessage({ action: "destroy_ai_session" });
    } catch (e) {
      console.warn("Failed to request background session destruction:", e);
    }
    setSession(null);
  }, []);

  const createSession = useCallback(async (systemPrompt?: string, temperature?: number) => {
    await destroySession();

    // 백그라운드로 AI 세션 초기화 지시
    const response = await new Promise<any>((resolve) => {
      try {
        chrome.runtime.sendMessage({
          action: "init_ai_session",
          systemPrompt,
          temperature
        }, resolve);
      } catch (err) {
        resolve({ success: false, error: "Cannot communicate with background Service Worker." });
      }
    });

    if (!response || !response.success) {
      throw new Error(response?.error || "Failed to initialize AI session in background");
    }

    // 백그라운드 통신 대행 세션 객체(Mock Session) 생성
    const mockSession = {
      prompt: async (promptText: string, options?: any) => {
        return new Promise<string>((resolve, reject) => {
          try {
            chrome.runtime.sendMessage({
              action: "prompt_ai",
              promptText
            }, (res) => {
              if (res && res.success) {
                resolve(res.result);
              } else {
                reject(new Error(res?.error || "AI prompt failed in background"));
              }
            });
          } catch (err) {
            reject(err);
          }
        });
      },
      promptStreaming: (promptText: string, options?: any) => {
        const portName = `ai-stream-${Date.now()}`;
        const port = chrome.runtime.connect({ name: portName });

        let resolveNext: ((v: IteratorResult<string>) => void) | null = null;
        const queue: string[] = [];
        let done = false;
        let error: any = null;

        port.onMessage.addListener((msg) => {
          if (msg.type === "chunk") {
            if (resolveNext) {
              resolveNext({ value: msg.chunk, done: false });
              resolveNext = null;
            } else {
              queue.push(msg.chunk);
            }
          } else if (msg.type === "done") {
            done = true;
            if (resolveNext) {
              resolveNext({ value: "", done: true });
              resolveNext = null;
            }
          } else if (msg.type === "error") {
            error = new Error(msg.error);
            if (resolveNext) {
              resolveNext({ value: "", done: true });
              resolveNext = null;
            }
          }
        });

        port.postMessage({ action: "stream_prompt", promptText });

        return {
          [Symbol.asyncIterator]() {
            return {
              async next(): Promise<IteratorResult<string>> {
                if (error) throw error;
                if (queue.length > 0) {
                  return { value: queue.shift()!, done: false };
                }
                if (done) {
                  return { value: "", done: true };
                }
                return new Promise<IteratorResult<string>>((resolve) => {
                  resolveNext = resolve;
                });
              },
              async return(): Promise<IteratorResult<string>> {
                try {
                  port.disconnect();
                } catch (_) {}
                return { value: "", done: true };
              }
            };
          }
        };
      },
      destroy: () => {
        try {
          chrome.runtime.sendMessage({ action: "destroy_ai_session" });
        } catch (_) {}
      },
      close: () => {
        try {
          chrome.runtime.sendMessage({ action: "destroy_ai_session" });
        } catch (_) {}
      }
    };

    setSession(mockSession);
    return mockSession;
  }, [destroySession]);

  useEffect(() => {
    return () => {
      destroySession();
    };
  }, [destroySession]);

  return {
    isSupported,
    session,
    createSession,
    destroySession
  };
}


