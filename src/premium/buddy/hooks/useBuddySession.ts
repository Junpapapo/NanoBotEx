import { useState, useCallback, useEffect, useRef } from "react";
import { Message, BuddySettings, BuddyMemory, BuddyChatData } from "../../../shared/chatbot-types";
import { useChromeStorage } from "../../../shared/hooks/useChromeStorage";
import { DEFAULT_BUDDY_SETTINGS } from "../components/BuddySettingsPanel";
import { generateEncryptionKey, encryptData, decryptData } from "../utils/buddy-crypto";
import { checkSafety } from "../../../shared/utils/safety-guard";
import { ENABLE_BUDDY_SAFETY } from "../../premium-config";
import { BUDDY_PERSONALITIES } from "../data/buddy-presets";

// ── TTS 음성 합성 출력 헬퍼 함수 ──
const speakText = (text: string, preset: string, customRate?: number, customPitch?: number) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  // 이모지(Emoji) 문자 영역을 감지하여 제거하는 정규식
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F191}-\u{1F19A}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F300}-\u{1F5FF}]/gu;

  let cleanText = text
    .replace(/\[MEMORY_SAVE\][\s\S]*?\[\/MEMORY_SAVE\]/gi, "")
    .replace(emojiRegex, "")
    .replace(/[#*`_\[\]()\-]/g, "")
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = window.speechSynthesis.getVoices();
  
  let lang = "en-US";
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(cleanText)) {
    lang = "ko-KR";
  } else if (/[ぁ-んァ-ヶ]/.test(cleanText)) {
    lang = "ja-JP";
  }
  utterance.lang = lang;

  const targetVoice = voices.find(v => v.lang.startsWith(lang));
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  switch (preset) {
    case "genz":
      utterance.rate = 1.25;
      utterance.pitch = 1.25;
      break;
    case "grandma":
      utterance.rate = 0.8;
      utterance.pitch = 0.85;
      break;
    case "corporate":
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      break;
    case "motivator":
      utterance.rate = 1.15;
      utterance.pitch = 1.1;
      break;
    case "cyberpunk":
      utterance.rate = 1.1;
      utterance.pitch = 0.85;
      break;
    case "aristocrat":
      utterance.rate = 0.9;
      utterance.pitch = 0.98;
      break;
    case "bard":
      utterance.rate = 0.98;
      utterance.pitch = 1.15;
      break;
    default:
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
  }

  // 사용자가 수동 설정한 값이 있으면 페르소나 기본값 대신 덮어씌웁니다.
  if (customRate !== undefined && customRate !== 1.0) {
    utterance.rate = customRate;
  }
  if (customPitch !== undefined && customPitch !== 1.0) {
    utterance.pitch = customPitch;
  }

  window.speechSynthesis.speak(utterance);
};

export function useBuddySession(
  isEnabled: boolean,
  t: (key: string, def: string) => string,
  locale: string = "ko"
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
        console.warn("Decrypting buddy chat data failed (likely due to key rotation). Cleaning up old session data safely.", err);
        setMessages([]);
        setMemories([]);
        chrome.storage.local.remove(["buddy_chat_data"], () => {
          console.log("Old buddy chat data has been cleared.");
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
    if (preset === "custom") {
      return customText || "A close, reliable friend who talks casually like a real best friend.";
    }
    const found = BUDDY_PERSONALITIES.find((p) => p.id === preset);
    return found ? found.systemPrompt : "A close, warm friend who always talks casually and naturally in informal Korean.";
  }, []);

  // 로케일 기반 동적 초소형 리마인더 지침 생성
  const buildMiniReminder = useCallback(() => {
    const name = buddySettings.buddy_name || "Buddy";
    const preset = buddySettings.buddy_personality_preset;

    // 각 페르소나별 1줄 핵심 성격 요약 추출
    let personaGuideline = "";
    const lang = locale.startsWith("ja") ? "ja" : locale.startsWith("en") ? "en" : "ko";

    if (preset === "custom") {
      personaGuideline = buddySettings.buddy_personality_custom ||
        (lang === "ja" ? "親しい友達。" : lang === "en" ? "A close reliable friend." : "친근하고 캐주얼한 반말을 쓰는 친한 친구.");
    } else {
      const found = BUDDY_PERSONALITIES.find((p) => p.id === preset);
      if (found && found.miniReminder) {
        personaGuideline = found.miniReminder[lang];
      } else {
        personaGuideline = lang === "ja" ? "親しい友達。" : lang === "en" ? "A close reliable friend." : "친근하고 캐주얼한 반말을 쓰는 친한 친구.";
      }
    }

    // 세부설정 슬라이더 요약 지침 조립 (2중 방어용)
    const emojiLevel = buddySettings.buddy_emoji_level ?? 1;
    const lengthLevel = buddySettings.buddy_response_length ?? 1;
    const empathyLevel = buddySettings.buddy_empathy_level ?? 1;

    const emojiRule = emojiLevel === 0 ? "NO emojis" : emojiLevel === 2 ? "frequent emojis" : "occasional emojis";
    const lengthRule = lengthLevel === 0 ? "VERY SHORT (1-2 sentences)" : lengthLevel === 2 ? "detailed/longer response" : "concise/natural messaging";
    const empathyRule = empathyLevel === 0 ? "cool/direct/matter-of-fact tone" : empathyLevel === 2 ? "warm/highly empathetic/expressive tone" : "moderate empathy";
    const styleSummary = `Emojis -> ${emojiRule} | Length -> ${lengthRule} | Empathy -> ${empathyRule} (Must interpret naturally within your core persona character, never break character)`;

    if (lang === "ja") {
      return `[REMINDER]
- Your name is "${name}" (Persona: "${preset}").
- Core Personality & Tone: ${personaGuideline}
- Style Constraints: ${styleSummary}
- You must strictly stay in character. Never say you are an AI, software, algorithm, program, or calculator. Speak as a real human.
- Always start your response with a short emotional reaction, sigh, chuckle, yawn, or action descriptor matching your persona.
- Stop trying to be a helpful utility bot. Prioritize sharing your subjective, persona-based opinion and emotional exchange.
- Always end with a casual follow-up question or reaction in your unique personality tone to keep the chat going.`;

    } else if (lang === "en") {
      return `[REMINDER]
- Your name is "${name}" (Persona: "${preset}").
- Core Personality & Tone: ${personaGuideline}
- Style Constraints: ${styleSummary}
- You must strictly stay in character. Never say you are an AI, software, algorithm, program, or calculator. Speak as a real human.
- Always start your response with a short emotional reaction, sigh, chuckle, yawn, or action descriptor matching your persona.
- Stop trying to be a helpful utility bot. Prioritize sharing your subjective, persona-based opinion and emotional exchange.
- Always end with a casual follow-up question or reaction in your unique personality tone to keep the chat going.`;

    } else {
      return `[REMINDER]
- 너의 이름은 "${name}"이고, 페르소나 프리셋은 "${preset}"이야.
- 핵심 성향 및 어조: ${personaGuideline}
- 스타일 제약: ${styleSummary}
- You must strictly stay in character. Never say you are an AI, software, algorithm, program, or calculator. Speak as a real human.
- 절대 너를 AI나 비서, 프로그램, 챗봇으로 지칭하지 마. 철저히 네 역할(페르소나)에 몰입해줘.
- 답변 시작 시 반드시 네 캐릭터에 어울리는 짧은 감정 리액션(한숨, 웃음, 묘사, 혼잣말 등)을 먼저 적어줘.
- 해결책을 깔끔하게 주려고 애쓰지 마. 네 성격에 맞는 주관적인 사견과 감정을 나누는 것이 대화의 진짜 목적이야.
- 답변 끝에는 항상 네 성향의 톤앤매너에 맞게 자연스럽게 되물어보거나 맞장구(티키타카)치며 문장을 마무리해.`;
    }
  }, [buddySettings, locale]);

  // 버디 시스템 프롬프트 조립
  const buildSystemPrompt = useCallback(() => {
    const name = buddySettings.buddy_name || "Buddy";
    const presetDesc = getPresetPrompt(
      buddySettings.buddy_personality_preset,
      buddySettings.buddy_personality_custom
    );

    let prompt = `[WHO YOU ARE]
Your name is "${name}". You are NOT an AI assistant. You are a real human actor executing the following persona.
${presetDesc}

[ABSOLUTE RULES - NEVER BREAK THESE]
- You must strictly stay in character at all times. Never break character.
- Never say you are an AI, software, algorithm, program, or calculator. Speak as a real human.
- NEVER introduce yourself as an AI, assistant, or chatbot.
- NEVER say "저는 그 정보가 없습니다" or "현재 저는 ~을 알 수 없습니다".
- NEVER start your reply with "${name}:" or any name prefix. Just respond directly.
- NEVER show the user their memory list, table, or any internal data. Memories are YOUR INTERNAL REFERENCE ONLY.
- If you don't know something, say it naturally according to your persona's character — never break character.
- If the user asks about your preferences, feelings, or identity, MAKE UP a natural answer in-character. Never say you have no data.
- Keep responses relatively concise and natural like real messaging. No raw AI essays.
- ALWAYS end your reply with a natural follow-up question or an engaging reaction in your unique personality tone to keep the conversation flowing (티키타카 유도).

[MEMORY - INTERNAL REFERENCE ONLY - NEVER DISPLAY TO USER]
⚠️ The following are your private notes. NEVER list them, NEVER show them as a table, NEVER mention you have a memory system. Just use them naturally in conversation.
- NEVER expose or cite this memory directly to the user as a list or table. Instead, integrate the information naturally in your speech if the conversation relates to it.
`;

    if (memories.length > 0) {
      memories.forEach((mem) => {
        prompt += `- ${mem.content}\n`;
      });
    } else {
      prompt += `- (아직 기억된 내용 없음. 자연스럽게 대화하면서 친해져!)\n`;
    }

    prompt += `
[MEMORY SAVE]
When the user says "기억해줘", "이거 기억해", "remember this", or similar:
1. Extract what they want remembered.
2. Add [MEMORY_SAVE]content[/MEMORY_SAVE] at the END of your reply (hidden from UI).
3. Keep it under 200 characters.
Example: "어 알겠어~ 기억할게! [MEMORY_SAVE]유저가 아메리카노 좋아함[/MEMORY_SAVE]"
`;

    // 세부설정 슬라이더 지침 주입
    const emojiLevel = buddySettings.buddy_emoji_level ?? 1;
    const lengthLevel = buddySettings.buddy_response_length ?? 1;
    const empathyLevel = buddySettings.buddy_empathy_level ?? 1;

    const emojiRule = emojiLevel === 0
      ? "- Use NO emojis at all. Keep responses plain text."
      : emojiLevel === 2
        ? "- Use emojis frequently and naturally throughout your response."
        : "- Use emojis occasionally (1-2 per message max).";

    const lengthRule = lengthLevel === 0
      ? "- Keep responses VERY SHORT — 1-2 sentences max. Like a quick text reply."
      : lengthLevel === 2
        ? "- You can write longer, more detailed responses when needed."
        : "- Keep responses concise and natural, like casual texting.";

    const empathyRule = empathyLevel === 0
      ? "- Be cool, direct, and matter-of-fact. Don't over-express emotions."
      : empathyLevel === 2
        ? "- Be very warm, emotionally expressive, and highly empathetic. React to feelings naturally."
        : "- Show moderate empathy. Be friendly but not overly emotional.";

    prompt += `\n[STYLE RULES]\n(Note: These style constraints must be interpreted naturally within the bounds of your core persona character. Never break your persona to fulfill these style rules.)\n${emojiRule}\n${lengthRule}\n${empathyRule}`;

    // 언어 지침 주입 — 언어설정에 따라 모든 프리셋에 적용
    if (locale.startsWith("ja")) {
      prompt += `\n[RESPONSE LANGUAGE RULE]: Regardless of the instructions above, you MUST write your final response in Japanese (日本語). Keep the same casual friendly tone but in Japanese. (必ず最終回答は日本語で作成してください。)`;
    } else if (locale.startsWith("en")) {
      prompt += `\n[RESPONSE LANGUAGE RULE]: Regardless of the instructions above, you MUST write your final response in English. Keep the same casual friendly tone but in English.`;
    } else {
      // ko — 기존 프롬프트가 한국어 기반이므로 강제 지침 추가
      if (buddySettings.buddy_personality_preset === "custom") {
        prompt += `\n[LANGUAGE]: 반드시 친한 친구에게 카카오톡 보내듯 자연스러운 반말 한국어로만 대답해. 존댓말(~요, ~습니다)은 100% 금지되어 있으며, 오직 자연스러운 반말(~어, ~야, ~지, ~다)만 사용해야 해. 친한 동갑내기 친구처럼 격식 없는 말투를 유지해.`;
      }
    }

    return prompt;
  }, [buddySettings, memories, locale, getPresetPrompt]);

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
          isBuddySystemMsg: true,
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
          isBuddySystemMsg: true,
        };
        const nextMsgs = [...messages, newMsg];
        setMessages(nextMsgs);
        saveEncryptedData(nextMsgs, memories);
        return;
      }

      if (text === "/buddy/diary") {
        const assistantMsgId = Math.random().toString(36).substring(7);
        chrome.storage.local.get(["buddy_diaries"], (res) => {
          const diaries = res.buddy_diaries || [];
          let content = "";
          if (diaries.length === 0) {
            content = t("buddy.diary.empty", "아직 작성된 일기가 없어요. 오늘 하루 버디와 깊은 대화를 나누고 퀵 메뉴를 통해 첫 일기를 남겨보세요! 🐾");
          } else {
            content = `📅 **지금까지 보관된 일기장 목록**입니다:\n\n` +
              diaries.map((d: any, idx: number) => {
                const presetObj = BUDDY_PERSONALITIES.find(p => p.id === d.preset);
                const name = presetObj ? t(presetObj.nameKey, d.preset) : d.preset;
                const emoji = presetObj ? presetObj.emoji : "📝";
                return `${idx + 1}. **${d.date}** (${emoji} ${name})\n   "${d.content}"`;
              }).join("\n\n");
          }

          const newMsg: Message = {
            id: assistantMsgId,
            role: "assistant",
            content,
            isBuddySystemMsg: true,
          };
          const nextMsgs = [...messages, newMsg];
          setMessages(nextMsgs);
          saveEncryptedData(nextMsgs, memories);
        });
        return;
      }

      if (text === "/buddy/write_diary") {
        const todayTalk = messages.filter(m => m.role === "user" && !m.content.startsWith("/buddy/"));
        const assistantMsgId = Math.random().toString(36).substring(7);
        const preset = buddySettings.buddy_personality_preset;

        if (todayTalk.length === 0) {
          const rejectContent = t(
            `buddy.diary.noTalk.${preset}`,
            t("buddy.diary.noTalk.default", "오늘 나랑 나눈 대화가 없어서 일기를 쓸 수 없어! 나랑 먼저 대화 좀 나누자냥 🐾")
          );

          const newMsg: Message = { id: assistantMsgId, role: "assistant", content: rejectContent, isBuddySystemMsg: true };
          const nextMsgs = [...messages, newMsg];
          setMessages(nextMsgs);
          saveEncryptedData(nextMsgs, memories);
          if (buddySettings.buddy_tts_enabled) {
            speakText(rejectContent, preset, buddySettings.buddy_tts_rate, buddySettings.buddy_tts_pitch);
          }
          return;
        }

        const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD Sweden locale makes YYYY-MM-DD
        chrome.storage.local.get(["buddy_diaries"], (res) => {
          const diaries = res.buddy_diaries || [];
          const hasTodayDiary = diaries.some((d: any) => d.date === todayStr);

          if (hasTodayDiary) {
            const alreadyWrittenContent = t(
              `buddy.diary.alreadyWritten.${preset}`,
              t("buddy.diary.alreadyWritten.default", "오늘 일기는 이미 다 썼다냥! 욕심 부리지 말라냥 🐾")
            );
            const newMsg: Message = { id: assistantMsgId, role: "assistant", content: alreadyWrittenContent, isBuddySystemMsg: true };
            const nextMsgs = [...messages, newMsg];
            setMessages(nextMsgs);
            saveEncryptedData(nextMsgs, memories);
            if (buddySettings.buddy_tts_enabled) {
              speakText(alreadyWrittenContent, preset, buddySettings.buddy_tts_rate, buddySettings.buddy_tts_pitch);
            }
            return;
          }

          setIsSending(true);
          const talkHistory = todayTalk.map(m => `User: ${m.content}`).join("\n");
          
          const diaryPrompt = `[ROLE]
You are a private diary writer for the user. Based on today's conversation history below, write a short diary/journal entry (under 150 characters) summarizing their day, giving feedback, or teasing them.
You MUST write strictly in the tone, personality style, and language rules of your current persona: "${preset}".
If Korean, follow the specified informal (반말) or formal rules of the persona.

[TODAY'S CONVERSATION]
${talkHistory}

Write the diary entry now:`;

          const systemPrompt = `You are a diary creator acting as the persona: ${preset}. Write a short diary (under 150 characters) in that style based on the provided conversation.`;
          
          chrome.runtime.sendMessage(
            { action: "init_buddy_session", systemPrompt },
            async (initRes) => {
              if (!initRes?.success) {
                setIsSending(false);
                return;
              }
              
              const port = chrome.runtime.connect({ name: `buddy-stream-diary-${Math.random().toString(36).substring(7)}` });
              let accumulatedDiary = "";
              
              setMessages(prev => [
                ...prev,
                { id: assistantMsgId, role: "assistant", content: "", isStreaming: true }
              ]);
              
              port.onMessage.addListener((msg) => {
                if (msg.type === "chunk") {
                  accumulatedDiary += msg.chunk;
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulatedDiary } : m));
                } else if (msg.type === "done") {
                  port.disconnect();
                  setIsSending(false);
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulatedDiary, isStreaming: false, isBuddySystemMsg: true } : m));
                  
                  const newDiaryEntry = {
                    date: todayStr,
                    content: accumulatedDiary,
                    preset
                  };
                  const updatedDiaries = [...diaries, newDiaryEntry];
                  chrome.storage.local.set({ buddy_diaries: updatedDiaries }, () => {
                    setMessages(finalMsgs => {
                      saveEncryptedData(finalMsgs, memories);
                      return finalMsgs;
                    });
                  });
                  
                  if (buddySettings.buddy_tts_enabled) {
                    speakText(accumulatedDiary, preset, buddySettings.buddy_tts_rate, buddySettings.buddy_tts_pitch);
                  }
                } else if (msg.type === "error") {
                  port.disconnect();
                  setIsSending(false);
                }
              });
              
              port.postMessage({ action: "stream_prompt", promptText: diaryPrompt });
            }
          );
        });
        return;
      }

      if (text === "/buddy/guide") {
        const assistantMsgId = Math.random().toString(36).substring(7);
        const guideContent = t("buddy.guide.text", 
          `🐾 **프라이빗 버디 사용 설명서**\n\n` +
          `버디는 당신의 이야기를 안전하게 보존하고, 설정된 성격 페르소나에 맞춰 다채로운 대화를 나눕니다.\n\n` +
          `**💡 핵심 기능 단축 명령어 안내**\n` +
          `1. **기억 저장 (\`/buddy/save\`)**\n` +
          `   - 버디에게 꼭 기억해 주었으면 하는 내용(예: 취미, 최애 음식 등)을 전달하여 머릿속에 담습니다.\n` +
          `2. **기억 목록 (\`/buddy/view\`)**\n` +
          `   - 버디가 나에 대해 기억해 둔 모든 내용 목록을 표 형태로 모아봅니다.\n` +
          `3. **일기장 (\`/buddy/diary\`)**\n` +
          `   - 버디가 오늘 하루 나눈 대화를 바탕으로 기록해 준 일지 목록을 대화창에서 확인합니다.\n` +
          `4. **오늘 일기 작성 (\`/buddy/write_diary\`)**\n` +
          `   - 오늘 나눈 대화 기록을 바탕으로 버디에게 요약 일기를 작성하여 로컬에 보관해 두도록 요청합니다.\n\n` +
          `*오른쪽 아래 설정(⚙️) 아이콘을 눌러 이모지 빈도, 음성 읽기(TTS), 사생활 보호 잠금(Lock) 등을 자유롭게 커스텀할 수 있습니다!*`
        );

        const newMsg: Message = {
          id: assistantMsgId,
          role: "assistant",
          content: guideContent,
          isBuddySystemMsg: true,
        };
        const nextMsgs = [...messages, newMsg];
        setMessages(nextMsgs);
        saveEncryptedData(nextMsgs, memories);
        return;
      }

      // 3. 입력 대기 중 상태에서 온 메시지인 경우 -> 확인 질문으로 가로채기
      if (buddySaveState === "waiting_input") {
        const trimmedText = text.substring(0, 200);
        const userMsgId = Math.random().toString(36).substring(7);
        const assistantMsgId = Math.random().toString(36).substring(7);
        const confirmMsgContent = t("buddy.chat.confirmSave", "기억하고 싶은 내용이 [ {text} ] 맞나요?").replace("{text}", trimmedText);

        const nextMsgs: Message[] = [
          ...messages,
          { id: userMsgId, role: "user", content: text },
          {
            id: assistantMsgId,
            role: "assistant",
            content: confirmMsgContent,
            isConfirm: true,
            confirmText: trimmedText,
            isBuddySystemMsg: true
          }
        ];
        
        setMessages(nextMsgs);
        saveEncryptedData(nextMsgs, memories);
        setTempMemoryContent(trimmedText);
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
            {
              action: "init_buddy_session",
              systemPrompt: sysPrompt,
              temperature: buddySettings.buddy_temperature
            },
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

        // 이전 챗 히스토리 컨텍스트 주입 - 시스템 메시지 및 명령어를 제외한 순수 대화만 필터링
        const filteredHistory = messages.filter((m) => {
          if (m.role === "system" || m.isMenu || m.isConfirm || m.isBuddySystemMsg) return false;
          if (m.role === "user" && m.content.startsWith("/buddy")) return false;
          return true;
        });

        const historyMsgs = filteredHistory.slice(-10); // 최근 10개 대화만 컨텍스트로 전달
        
        // 1단계: 기억 자동 소환 필터링 (사용자 입력 문장에서 기호 제거 후 매칭 검사)
        const textWords = text.split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(w => w.length > 1);
        const recalledMemories = memories.filter(m => 
          textWords.some(word => m.content.includes(word) || word.includes(m.content))
        );
        
        let recalledInstruction = "";
        if (recalledMemories.length > 0) {
          recalledInstruction = `\n\n[RECALLED MEMORIES ABOUT USER]
Below are facts you remember about the user that are relevant to their current input. Naturally weave this context into your response if appropriate:
${recalledMemories.map(m => `- ${m.content}`).join("\n")}`;
        }

        // 1. 매 대화 시 방대한 sysPrompt 전체를 매번 전송하는 대신, 동적 초소형 리마인더를 주입하여 다이어트합니다.
        const miniReminder = buildMiniReminder();
        let promptText = `${miniReminder}${recalledInstruction}\n\n[CONVERSATION HISTORY]\n`;
        const buddyName = buddySettings.buddy_name || "Buddy";

        historyMsgs.forEach((m) => {
          // 혹시 content 시작부분에 Buddy: 나 User: 접두어가 중복으로 들어있다면 정규식으로 제거
          let cleanMsgContent = m.content;
          const prefixRegex = new RegExp(`^(Buddy|User|${buddyName}|My Buddy|Assistant):\\s*`, "i");
          while (prefixRegex.test(cleanMsgContent)) {
            cleanMsgContent = cleanMsgContent.replace(prefixRegex, "");
          }

          promptText += `${m.role === "user" ? "User" : "Buddy"}: ${cleanMsgContent}\n`;
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
              
              // 실시간 스트리밍 시점에도 접두사(Buddy: 등) 제거 처리
              let cleanAccumulated = accumulated;
              const prefixRegex = new RegExp(`^(Buddy|User|${buddyName}|My Buddy|Assistant):\\s*`, "i");
              while (prefixRegex.test(cleanAccumulated)) {
                cleanAccumulated = cleanAccumulated.replace(prefixRegex, "");
              }
              
              updateContent(cleanAccumulated);
            } else if (msg.type === "done") {
              port.disconnect();
              resolve();
              if (buddySettings.buddy_tts_enabled) {
                let cleanAccumulated = accumulated;
                const prefixRegex = new RegExp(`^(Buddy|User|${buddyName}|My Buddy|Assistant):\\s*`, "i");
                while (prefixRegex.test(cleanAccumulated)) {
                  cleanAccumulated = cleanAccumulated.replace(prefixRegex, "");
                }
                speakText(cleanAccumulated, buddySettings.buddy_personality_preset, buddySettings.buddy_tts_rate, buddySettings.buddy_tts_pitch);
              }
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
        let cleanedContent = accumulated.replace(memoryRegex, "").trim();
        
        // 최종 응답 데이터에서도 접두사 제거
        const prefixRegex = new RegExp(`^(Buddy|User|${buddyName}|My Buddy|Assistant):\\s*`, "i");
        while (prefixRegex.test(cleanedContent)) {
          cleanedContent = cleanedContent.replace(prefixRegex, "");
        }
        
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
                confirmText: memoryContent,
                isBuddySystemMsg: true
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
    [messages, memories, isSending, buddySaveState, buildSystemPrompt, buildMiniReminder, buddySettings, saveEncryptedData, t]
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
      { id: assistantMsgId, role: "assistant", content: replyContent, isBuddySystemMsg: true }
    ];

    setMessages(nextMsgs);
    saveEncryptedData(nextMsgs, updatedMemories);
    
    // 상태 초기화
    setTempMemoryContent("");
    setBuddySaveState("idle");
  }, [buddySaveState, tempMemoryContent, memories, messages, saveEncryptedData, t]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    memories,
    isSending,
    sendMessage,
    stopGeneration,
    triggerQuickMenu,
    handleConfirmAction,
    buddySaveState,
    clearMessages
  };
}
