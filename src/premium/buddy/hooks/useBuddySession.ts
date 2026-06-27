import { useState, useCallback, useEffect, useRef } from "react";
import { Message, BuddySettings, BuddyMemory, BuddyChatData } from "../../../shared/chatbot-types";
import { useChromeStorage } from "../../../shared/hooks/useChromeStorage";
import { DEFAULT_BUDDY_SETTINGS } from "../components/BuddySettingsPanel";
import { generateEncryptionKey, encryptData, decryptData } from "../utils/buddy-crypto";
import { checkSafety } from "../../../shared/utils/safety-guard";
import { ENABLE_BUDDY_SAFETY } from "../../premium-config";

export function useBuddySession(
  isEnabled: boolean,
  t: (key: string, def: string) => string
) {
  const [buddySettings] = useChromeStorage<BuddySettings>("buddy_settings", DEFAULT_BUDDY_SETTINGS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<BuddyMemory[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [buddySaveState, setBuddySaveState] = useState<"idle" | "waiting_input" | "confirming_save">("idle");
  const [tempMemoryContent, setTempMemoryContent] = useState<string>("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const isAbortedRef = useRef(false);

  // 1. 암호화 키 로드 및 미존재 시 자동 생성
  useEffect(() => {
    if (!isEnabled) return;
    chrome.storage.local.get(["buddy_encryption_key"], async (res) => {
      if (res.buddy_encryption_key) {
        setEncryptionKey(res.buddy_encryption_key);
      } else {
        try {
          const newKey = await generateEncryptionKey();
          chrome.storage.local.set({ buddy_encryption_key: newKey }, () => {
            setEncryptionKey(newKey);
          });
        } catch (err) {
          console.error("Failed to generate encryption key:", err);
        }
      }
    });
  }, [isEnabled]);

  // 2. 키 로드 시 암호화된 대화 & 메모리 데이터 복호화 로드
  useEffect(() => {
    if (!isEnabled || !encryptionKey) return;

    chrome.storage.local.get(["buddy_chat_data"], async (res) => {
      const chatData = res.buddy_chat_data as BuddyChatData | undefined;
      if (!chatData || !chatData.messages_encrypted) {
        setMessages([]);
        setMemories([]);
        return;
      }

      try {
        const decryptedMsgsStr = await decryptData(
          chatData.messages_encrypted,
          chatData.iv,
          encryptionKey
        );
        setMessages(JSON.parse(decryptedMsgsStr));

        if (chatData.memories_encrypted) {
          const decryptedMemStr = await decryptData(
            chatData.memories_encrypted,
            chatData.iv,
            encryptionKey
          );
          setMemories(JSON.parse(decryptedMemStr));
        }
      } catch (err) {
        console.error("Failed to decrypt buddy chat data. Clearing corrupted data...", err);
        setMessages([]);
        setMemories([]);
        chrome.storage.local.remove(["buddy_chat_data"], () => {
          console.log("Corrupted buddy chat data has been cleared.");
        });
      }
    });
  }, [isEnabled, encryptionKey]);

  // 3. 메시지 혹은 메모리 변경 시 암호화 보관
  const saveEncryptedData = useCallback(
    async (currentMsgs: Message[], currentMem: BuddyMemory[]) => {
      if (!encryptionKey) return;
      try {
        const msgsStr = JSON.stringify(currentMsgs);
        const memStr = JSON.stringify(currentMem);

        // 메시지와 메모리가 동일한 초기화 벡터(IV)를 사용하여 암복호화되도록 공유 IV 생성
        const sharedIv = crypto.getRandomValues(new Uint8Array(12));

        // 공유 IV를 주입하여 메시지 및 메모리 암호화
        const encMsgs = await encryptData(msgsStr, encryptionKey, sharedIv);
        const encMem = await encryptData(memStr, encryptionKey, sharedIv);

        const chatData: BuddyChatData = {
          messages_encrypted: encMsgs.encrypted,
          memories_encrypted: encMem.encrypted,
          iv: encMsgs.iv, // IV 공유 보관
        };

        chrome.storage.local.set({ buddy_chat_data: chatData });
      } catch (err) {
        console.error("Failed to encrypt and save buddy chat data:", err);
      }
    },
    [encryptionKey]
  );

  // 성격 프리셋에 따른 지침 빌드
  const getPresetPrompt = useCallback((preset: string, customText: string) => {
    switch (preset) {
      case "caring":
        return "Warm, highly empathetic, supportive, and kind. Always use gentle language and express care.";
      case "cheerful":
        return "Bright, energetic, bubbly, and playful. Use friendly tones and appropriate emojis to lift the user's mood.";
      case "tsundere":
        return "A bit blunt, stubborn, and acts slightly tsundere (cold on the outside, but warm and caring on the inside). Uses phrases like 'It's not like I did this for you...'.";
      case "wise":
        return "Calm, intellectual, and thoughtful. Provide deep, philosophical, and insightful responses like a mentor.";
      case "humorous":
        return "Humorous, witty, and playful. Use subtle jokes, puns, and friendly sarcasm to make the conversation fun.";
      case "calm":
        return "Extremely calm, peaceful, mindful, and therapeutic. Acts as a supportive counselor for stress relief.";
      case "custom":
        return customText || "A close, reliable friend.";
      default:
        return "A supportive, warm and friendly companion.";
    }
  }, []);

  // 버디 시스템 프롬프트 조립
  const buildSystemPrompt = useCallback(() => {
    const name = buddySettings.buddy_name || "Buddy";
    const presetDesc = getPresetPrompt(
      buddySettings.buddy_personality_preset,
      buddySettings.buddy_personality_custom
    );

    let prompt = `[BUDDY IDENTITY]
Your name is "${name}". You are the user's personal, highly private AI buddy/friend.
Personality style: ${presetDesc}

[MEMORY INSTRUCTIONS]
The following are things the user has explicitly asked you to remember.
Refer to these facts naturally in conversation when relevant, and do not forget them:
`;

    if (memories.length > 0) {
      memories.forEach((mem) => {
        prompt += `- ${mem.content}\n`;
      });
    } else {
      prompt += `- (No specific memories saved yet. Build connection with the user!)\n`;
    }

    prompt += `
When the user explicitly says "remember this", "이거 기억해", "기억해줘", "覚えて", or similar requests to store information:
1. Extract the key information they want you to remember.
2. Wrap it inside [MEMORY_SAVE]content[/MEMORY_SAVE] tags at the end of your response. (Example: "I will keep that in mind! [MEMORY_SAVE]User likes black coffee[/MEMORY_SAVE]")
3. Keep the content inside [MEMORY_SAVE] short (under 200 characters).

[CONVERSATION RULES]
- Talk naturally as a close, dear friend, not as a formal assistant.
- Never mention that you are an AI assistant or a machine unless asked.
- Keep the character consistent at all times.
`;

    // 언어 지침 주입
    const locale = buddySettings.buddy_initialized ? "ko" : "en"; // Fallback
    const currentLocale = chrome.i18n.getUILanguage() || "ko";
    if (currentLocale.startsWith("ko")) {
      prompt += `\n[RESPONSE LANGUAGE]: Write your response in Korean. (반드시 친근한 친구 어조의 반말로 한국어로 대답하세요.)`;
    } else if (currentLocale.startsWith("ja")) {
      prompt += `\n[RESPONSE LANGUAGE]: Write your response in Japanese. (親しい友達の口調で日本語で答えてください。)`;
    } else {
      prompt += `\n[RESPONSE LANGUAGE]: Write your response in English.`;
    }

    return prompt;
  }, [buddySettings, memories, getPresetPrompt]);

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

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;

      // 1. 확인 버튼 대기 중일 때는 사용자 추가 입력 차단
      if (buddySaveState === "confirming_save") return;

      // 2. 명령어 분기 처리
      if (text === "/buddy/save") {
        const assistantMsgId = Math.random().toString(36).substring(7);
        const newMsg: Message = {
          id: assistantMsgId,
          role: "assistant",
          content: t("buddy.chat.savePrompt", "어떤 내용을 기억할까요? 기억하고 싶은 내용을 입력해 주세요."),
        };
        const nextMsgs = [...messages, newMsg];
        setMessages(nextMsgs);
        saveEncryptedData(nextMsgs, memories);
        setBuddySaveState("waiting_input");
        return;
      }

      if (text === "/buddy/view") {
        const assistantMsgId = Math.random().toString(36).substring(7);
        let tableContent = "";
        
        if (memories.length > 0) {
          const header = t("buddy.chat.memoriesListHeader", "현재 제가 기억하고 있는 내용 목록입니다:\n\n");
          const colContent = t("buddy.chat.memoryContent", "기억한 내용");
          const colDate = t("buddy.chat.memoryDate", "저장일");
          
          tableContent = header +
            `| No | ${colContent} | ${colDate} |\n` +
            `|---|---|---|\n` +
            memories.map((m, idx) => {
              const dateStr = new Date(m.createdAt).toLocaleDateString();
              return `| ${idx + 1} | ${m.content} | ${dateStr} |`;
            }).join("\n");
        } else {
          tableContent = t("buddy.chat.noMemories", "아직 기억하고 있는 내용이 없어요. 저에게 기억할 만한 이야기를 들려주세요! 🐾");
        }

        const newMsg: Message = {
          id: assistantMsgId,
          role: "assistant",
          content: tableContent,
        };
        const nextMsgs = [...messages, newMsg];
        setMessages(nextMsgs);
        saveEncryptedData(nextMsgs, memories);
        return;
      }

      if (text === "/buddy/guide") {
        text = t("buddy.quickMenu.items.guide.prompt", "버디의 핵심 특징과 메모리(기억) 시스템 사용 팁을 알려줘.");
      }

      // 3. 입력 대기 중 상태에서 온 메시지인 경우 -> 확인 질문으로 가로채기
      if (buddySaveState === "waiting_input") {
        const userMsgId = Math.random().toString(36).substring(7);
        const assistantMsgId = Math.random().toString(36).substring(7);
        const confirmMsgContent = t("buddy.chat.confirmSave", "기억하고 싶은 내용이 [ {text} ] 맞나요?").replace("{text}", text);

        const nextMsgs: Message[] = [
          ...messages,
          { id: userMsgId, role: "user", content: text },
          {
            id: assistantMsgId,
            role: "assistant",
            content: confirmMsgContent,
            isConfirm: true,
            confirmText: text
          }
        ];
        
        setMessages(nextMsgs);
        saveEncryptedData(nextMsgs, memories);
        setTempMemoryContent(text);
        setBuddySaveState("confirming_save");
        return;
      }

      // 4. 일반 대화 처리
      setIsSending(true);
      isAbortedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      const userMsgId = Math.random().toString(36).substring(7);
      const assistantMsgId = Math.random().toString(36).substring(7);

      const nextMsgs: Message[] = [
        ...messages,
        { id: userMsgId, role: "user", content: text },
      ];
      setMessages(nextMsgs);
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
      ]);

      const updateContent = (content: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content } : m))
        );
      };

      try {
        // 1. Safety Guard Check (조건부 적용)
        if (ENABLE_BUDDY_SAFETY) {
          const isSafe = await checkSafety(text);
          if (!isSafe) {
            updateContent(
              t(
                "guardrail.blocked",
                "🚫 **안전 가이드라인 위반이 감지되었습니다.**\n\n해당 요청은 선정적이거나 위험한 내용을 포함하고 있어 답변을 제공할 수 없습니다.\n일반적인 질문으로 다시 시도해 주세요."
              )
            );
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
            );
            setIsSending(false);
            return;
          }
        }

        // 2. Initialize Buddy Background Session
        const sysPrompt = buildSystemPrompt();
        await new Promise<void>((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: "init_buddy_session", systemPrompt: sysPrompt },
            (res) => {
              if (res?.success) resolve();
              else reject(new Error(res?.error || "Failed to init buddy session"));
            }
          );
        });

        // 3. Connect Stream Port
        const portId = Math.random().toString(36).substring(7);
        const port = chrome.runtime.connect({ name: `buddy-stream-${portId}` });
        let accumulated = "";

        // 이전 챗 히스토리 컨텍스트 주입
        let promptText = "";
        const historyMsgs = messages.slice(-6); // 최근 6개 대화만 컨텍스트로 전달
        historyMsgs.forEach((m) => {
          promptText += `${m.role === "user" ? "User" : "Buddy"}: ${m.content}\n`;
        });
        promptText += `User: ${text}\nBuddy:`;

        port.postMessage({ action: "stream_prompt", promptText });

        await new Promise<void>((resolve, reject) => {
          port.onMessage.addListener((msg) => {
            if (isAbortedRef.current) {
              port.disconnect();
              resolve();
              return;
            }

            if (msg.type === "chunk") {
              accumulated += msg.chunk;
              updateContent(accumulated);
            } else if (msg.type === "done") {
              port.disconnect();
              resolve();
            } else if (msg.type === "error") {
              port.disconnect();
              reject(new Error(msg.error));
            }
          });
        });

        // 4. Memory Save parsing (`[MEMORY_SAVE]...[/MEMORY_SAVE]`)
        const memoryRegex = /\[MEMORY_SAVE\]([\s\S]*?)\[\/MEMORY_SAVE\]/i;
        const match = accumulated.match(memoryRegex);

        // [MEMORY_SAVE] 태그는 유저 화면에 출력되지 않도록 필터링
        const cleanedContent = accumulated.replace(memoryRegex, "").trim();
        updateContent(cleanedContent);

        let finalMsgs: Message[] = [
          ...nextMsgs,
          { id: assistantMsgId, role: "assistant", content: cleanedContent },
        ];

        if (match && match[1]) {
          const memoryContent = match[1].trim().substring(0, 200); // 200자 제한
          if (memoryContent) {
            const confirmMsgId = Math.random().toString(36).substring(7);
            const confirmMsgContent = t("buddy.chat.confirmSave", "기억하고 싶은 내용이 [ {text} ] 맞나요?").replace("{text}", memoryContent);
            
            finalMsgs = [
              ...finalMsgs,
              {
                id: confirmMsgId,
                role: "assistant",
                content: confirmMsgContent,
                isConfirm: true,
                confirmText: memoryContent
              }
            ];
            
            setTempMemoryContent(memoryContent);
            setBuddySaveState("confirming_save");
          }
        }

        setMessages(finalMsgs);
        saveEncryptedData(finalMsgs, memories);
      } catch (err: any) {
        console.error(err);
        updateContent(`Error: ${err.message || String(err)}`);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
        );
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [messages, memories, isSending, buddySaveState, buildSystemPrompt, saveEncryptedData, t]
  );

  const triggerQuickMenu = useCallback(() => {
    const menuMsgId = "quick-menu-" + Date.now();
    const newMsg: Message = {
      id: menuMsgId,
      role: "system",
      content: t("buddy.quickMenu.message", "아래 퀵메뉴에서 원하는 서비스를 선택해 주세요."),
      isMenu: true
    };
    const nextMsgs = [...messages, newMsg];
    setMessages(nextMsgs);
    saveEncryptedData(nextMsgs, memories);
  }, [messages, memories, saveEncryptedData, t]);

  const handleConfirmAction = useCallback((confirmed: boolean) => {
    if (buddySaveState !== "confirming_save" || !tempMemoryContent) return;

    const assistantMsgId = Math.random().toString(36).substring(7);
    let replyContent = "";
    let updatedMemories = [...memories];

    if (confirmed) {
      replyContent = t("buddy.chat.saveSuccess", "기억하겠어요! 🧠✨");
      const newMemory: BuddyMemory = {
        id: Math.random().toString(36).substring(7),
        content: tempMemoryContent.substring(0, 200),
        createdAt: Date.now(),
      };
      if (updatedMemories.length >= 50) {
        updatedMemories.shift();
      }
      updatedMemories.push(newMemory);
      setMemories(updatedMemories);
    } else {
      replyContent = t("buddy.chat.saveCancel", "기억 저장을 취소했습니다.");
    }

    // 예/아니오 확인 메시지에서 isConfirm을 비활성화 처리하여 중복 클릭 방지
    const cleanedMessages = messages.map(msg => 
      msg.isConfirm ? { ...msg, isConfirm: false } : msg
    );

    const nextMsgs: Message[] = [
      ...cleanedMessages,
      { id: assistantMsgId, role: "assistant", content: replyContent }
    ];

    setMessages(nextMsgs);
    saveEncryptedData(nextMsgs, updatedMemories);
    
    // 상태 초기화
    setTempMemoryContent("");
    setBuddySaveState("idle");
  }, [buddySaveState, tempMemoryContent, memories, messages, saveEncryptedData, t]);

  return {
    messages,
    memories,
    isSending,
    sendMessage,
    stopGeneration,
    triggerQuickMenu,
    handleConfirmAction,
    buddySaveState
  };
}
