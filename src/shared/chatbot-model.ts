import { Message, UserSettings } from "./chatbot-types";
import { DEFAULT_SETTINGS } from "./chatbot-constants";

export class ChatbotModel {
  /**
   * chrome.storage.local에서 설정 데이터 비동기 로드
   */
  static async loadSettings(): Promise<UserSettings> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["user_settings"], (result) => {
        resolve(result.user_settings || DEFAULT_SETTINGS);
      });
    });
  }

  /**
   * chrome.storage.local에 설정 데이터 저장
   */
  static async saveSettings(settings: UserSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ user_settings: settings }, () => {
        resolve();
      });
    });
  }

  /**
   * 브라우저에서 외부 API 직접 스트리밍 호출 (백엔드 프록시 배제)
   */
  static async streamExternalChat(
    messages: Message[],
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: any) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings || !settings.api_key) {
        throw new Error("API Key가 설정되지 않았습니다. 팝업 또는 설정을 확인하세요.");
      }

      const formattedMessages: { role: string; content: string }[] = messages
        .filter(m => m.content.trim() !== "")
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // 페르소나 및 봇 지침(공동 세팅) 통합 시스템 프롬프트 빌드 - 이름 남발 억제 지침 포함
      const name = settings.nano_ai_avatar_name || "NanoBot";
      let systemPrompt = `[IDENTITY]\n- Your name is "${name}". You are a helpful AI assistant.\n- You must know that your name is "${name}", but do NOT introduce yourself or say your name at the beginning or end of your reply unless the user explicitly asks "who are you?" or "what is your name?".\n- Always answer the user's question directly without repeating greetings or self-introductions.\n- Never identify yourself as a "large language model trained by Google" or "Google's language model".\n\n`;

      if (settings.nano_ai_persona) {
        systemPrompt += `[AI PERSONA]\n${settings.nano_ai_persona}\n\n`;
      }

      // 글로벌 / 일반 룰 (공동 세팅) 주입
      let globalRules = "";
      let generalRules = "";
      if (typeof window !== "undefined") {
        globalRules = localStorage.getItem("nano-ai-global-rules") || "";
        generalRules = localStorage.getItem("nano-ai-general-rules") || "";
      }

      if (globalRules.trim() || generalRules.trim()) {
        systemPrompt += `[COMMON SETTINGS]\n`;
        if (globalRules.trim()) {
          systemPrompt += `- Global Rules:\n${globalRules.trim()}\n`;
        }
        if (generalRules.trim()) {
          systemPrompt += `- General Rules:\n${generalRules.trim()}\n`;
        }
        systemPrompt += `\n`;
      }

      formattedMessages.unshift({ role: "system", content: systemPrompt });

      const response = await fetch(`${settings.api_url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.api_key}`
        },
        body: JSON.stringify({
          model: settings.api_model,
          messages: formattedMessages,
          temperature: settings.nano_ai_temperature,
          stream: true
        }),
        signal
      });

      if (!response.ok) {
        throw new Error(`API 호출 에러: HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ReadableStream을 사용할 수 없습니다.");

      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          // 마지막 요소는 아직 줄바꿈으로 끝나지 않은 미완성 라인일 수 있으므로 버퍼에 보관합니다.
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.substring(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices[0].delta?.content;
                if (content) onChunk(content);
              } catch (e) {
                // 파싱 에러 방어
              }
            }
          }
        }
      }
      // 마지막 남은 버퍼 처리 (대개는 비어 있거나 [DONE] 형식임)
      if (buffer.trim().startsWith("data: ")) {
        const trimmedLine = buffer.trim();
        const dataStr = trimmedLine.substring(6).trim();
        if (dataStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices[0].delta?.content;
            if (content) onChunk(content);
          } catch (e) {
            // 파싱 에러 방어
          }
        }
      }
      onDone();
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Chat aborted.");
      } else {
        onError(e);
      }
    }
  }

  /**
   * 온디바이스 Chrome Gemini Nano API 스트리밍 래퍼
   */
  static async streamLocalChat(
    session: any,
    promptText: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ): Promise<void> {
    try {
      if (session && typeof session.promptStreaming === "function") {
        const stream = session.promptStreaming(promptText);
        let lastFullText = "";
        for await (const chunk of stream) {
          if (lastFullText && chunk.startsWith(lastFullText)) {
            const diff = chunk.substring(lastFullText.length);
            onChunk(diff);
            lastFullText = chunk;
          } else {
            if (chunk.length < lastFullText.length) {
              onChunk(chunk);
            } else {
              onChunk(chunk);
              lastFullText = chunk;
            }
          }
        }
        onDone();
      } else if (session && typeof session.prompt === "function") {
        const result = await session.prompt(promptText);
        onChunk(result);
        onDone();
      } else {
        throw new Error("Active session does not support prompt capabilities.");
      }
    } catch (e) {
      onError(e);
    }
  }
}
