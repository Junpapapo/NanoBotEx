import { useChromeStorage } from "./useChromeStorage";
import { ChatSession, Message, ScenarioType } from "../chatbot-types";
import { useCallback } from "react";

export function useSessionHistory() {
  const [sessions, setSessions] = useChromeStorage<ChatSession[]>("nano-ai-chat-sessions", []);
  const [currentSessionId, setCurrentSessionId] = useChromeStorage<string | null>("nano-ai-current-session-id", null);

  const getSession = useCallback((sessionId: string | null) => {
    if (!sessionId) return null;
    return sessions.find(s => s.id === sessionId) || null;
  }, [sessions]);

  const saveSession = useCallback((sessionId: string, messages: Message[], scenario: ScenarioType = "none", title?: string) => {
    setSessions((prev: ChatSession[]) => {
      const idx = prev.findIndex((s: ChatSession) => s.id === sessionId);
      const now = Date.now();
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          messages,
          scenario,
          timestamp: now
        };
        return updated.sort((a, b) => b.timestamp - a.timestamp);
      } else {
        const newTitle = title || (messages.find(m => m.role === "user")?.content || "새로운 대화").substring(0, 16);
        const newSession: ChatSession = {
          id: sessionId,
          title: newTitle,
          timestamp: now,
          messages,
          scenario
        };
        return [newSession, ...prev];
      }
    });
  }, [setSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev: ChatSession[]) => prev.filter((s: ChatSession) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId, setCurrentSessionId, setSessions]);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);
  }, [setCurrentSessionId, setSessions]);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    getSession,
    saveSession,
    deleteSession,
    clearAllSessions
  };
}
