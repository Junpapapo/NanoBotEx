import React, { useState } from "react";
import { Message, UserSettings, QuickMenuItem } from "../chatbot-types";
import { AIAvatar } from "./AIAvatar";
import { CodeBlock } from "./CodeBlock";
import { MiniChart } from "./MiniChart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { getThemePalette } from "../chatbot-constants";
import { Check, CheckSquare, FileText, Globe, Bell, Eye, Copy, BookOpen, Volume2 } from "lucide-react";

interface ChatMessageItemProps {
  message: Message;
  settings: UserSettings;
  effectiveAIAvatar: string;
  onQuickQuestion?: (text: string) => void;
  t?: any;
  quickMenuItems?: QuickMenuItem[];
  onConfirmAction?: (confirmed: boolean) => void;
  onOpenAlarm?: (title: string) => void;
  onSendToViewer?: (title: string, content: string) => void;
}

// ──────────────────────────────────────────────────────────────────────────
// 유효하지 않은 줄바꿈 및 백슬래시 에러를 보정하여 안전하게 JSON을 파싱하는 헬퍼 함수
// 1단계: 문자열 내 리터럴 줄바꿈 및 이스케이프 수정 후 JSON.parse 시도
// 2단계: 여전히 실패 시 문자열 값 내 이중 따옴표를 강제 이스케이프 처리
// 3단계: 마지막 수단으로 정규식 기반 필드 추출
// ──────────────────────────────────────────────────────────────────────────
const cleanAndParseJson = (jsonStr: string) => {
  const cleaned = jsonStr.trim();

  // ── 1단계: 문자열 내 리터럴 개행을 \n으로 치환하는 char-by-char 정제 ──
  const repairLiterals = (src: string): string => {
    let inStr = false;
    let escape = false;
    const out: string[] = [];
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (escape) {
        const valid = '"\\\/bfnrtu'.includes(ch);
        if (valid) { out.push('\\'); out.push(ch); }
        else if (ch === '\n' || ch === '\r') { out.push('\\n'); if (ch === '\r' && src[i+1] === '\n') i++; }
        else { out.push(ch); }
        escape = false; continue;
      }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inStr = !inStr; out.push(ch); continue; }
      if (inStr && (ch === '\n' || ch === '\r')) {
        out.push('\\n'); if (ch === '\r' && src[i+1] === '\n') i++;
      } else { out.push(ch); }
    }
    if (escape) out.push('\\');
    return out.join('');
  };

  // ── 2단계: 각 string 값 내부의 이스케이프되지 않은 " 를 교체 ──
  // JSON 문자열 값 경계를 추적하며, 값 내부의 raw " 를 \" 로 수정
  const repairUnescapedQuotes = (src: string): string => {
    // 각 키의 값 부분을 따로 처리하기 위해 키-값 경계를 수동으로 탐색
    const out: string[] = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '"') {
        // 문자열 시작 - 닫는 따옴표를 추적
        out.push('"');
        i++;
        while (i < src.length) {
          const c = src[i];
          if (c === '\\') {
            // 이미 이스케이프된 문자 - 그대로 통과
            out.push(c);
            i++;
            if (i < src.length) { out.push(src[i]); i++; }
          } else if (c === '"') {
            // 문자열 종료 따옴표 - 다음 문자로 , } ] 가 오면 실제 종료
            const next = src.slice(i + 1).trimStart();
            if (next.startsWith(',') || next.startsWith('}') || next.startsWith(']') || next === '') {
              out.push('"'); i++; break;
            } else {
              // 값 내부의 이스케이프되지 않은 " → \" 로 교체
              out.push('\\"'); i++;
            }
          } else {
            out.push(c); i++;
          }
        }
      } else {
        out.push(ch); i++;
      }
    }
    return out.join('');
  };

  // ── 3단계: 정규식 기반 필드 추출 (최후 수단) ──
  const extractByRegex = (src: string): Record<string, any> => {
    const getString = (key: string): string => {
      // key": "value" 형식을 찾되, 다음 키까지의 내용을 모두 값으로 간주
      const re = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*[,}])`, 'i');
      const m = src.match(re);
      return m ? m[1].replace(/\\n/g, '\n') : '';
    };
    const getArray = (key: string): any[] => {
      const re = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i');
      const m = src.match(re);
      if (!m) return [];
      try {
        const fixed = repairLiterals('[' + m[1] + ']');
        return JSON.parse(fixed);
      } catch { return []; }
    };
    return {
      sentence: getString('sentence'),
      pronunciation: getString('pronunciation'),
      translation: getString('translation'),
      vocabulary: getArray('vocabulary'),
      tutor_note: getString('tutor_note'),
    };
  };

  // 순서대로 시도
  try {
    return JSON.parse(repairLiterals(cleaned));
  } catch (_e1) {
    try {
      return JSON.parse(repairUnescapedQuotes(repairLiterals(cleaned)));
    } catch (_e2) {
      // 최후 수단: 정규식 추출
      const result = extractByRegex(cleaned);
      if (result.sentence) return result;
      throw new Error('All JSON repair strategies failed');
    }
  }
};

export function ChatMessageItem({ message, settings, effectiveAIAvatar, onQuickQuestion, t, quickMenuItems, onConfirmAction, onOpenAlarm, onSendToViewer }: ChatMessageItemProps) {
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");
  const isUser = message.role === "user";
  const isLight = settings.nano_skin_mode === "light";

  const [todoSaved, setTodoSaved] = useState(false);

  const handlePlayTTS = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = settings.tutor_lang || "en";
    const langCodeMap: Record<string, string> = {
      en: "en-US",
      ko: "ko-KR",
      ja: "ja-JP",
      zh: "zh-CN",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      vi: "vi-VN"
    };
    utterance.lang = langCodeMap[lang] || "en-US";
    window.speechSynthesis.speak(utterance);
  };
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (message.role === "assistant") {
      const learnBlock = extractJsonBlock(message.content, '"sentence"', '\\[LEARN_CARD\\]');
      if (learnBlock) {
        try {
          const learnData = cleanAndParseJson(learnBlock.jsonText);
          if (learnData.sentence && learnData.translation) {
            if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
              chrome.storage.local.get(["nanobot-tutor-archive"], (result) => {
                const list = result["nanobot-tutor-archive"] || [];
                const exists = list.some((item: any) => item.sentence === learnData.sentence);
                if (!exists) {
                  const newItem = {
                    ...learnData,
                    id: "tutor-card-" + Math.random().toString(36).substring(7),
                    createdAt: Date.now()
                  };
                  chrome.storage.local.set({ "nanobot-tutor-archive": [newItem, ...list] });
                }
              });
            }
          }
        } catch (e) {
          console.warn("Failed to auto-archive learn card in useEffect:", e);
        }
      }
    }
  }, [message.id, message.content, message.role]);

  const handleCopy = () => {
    if (copied) return;
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSwitchToSearchTab = (tabId?: number, queryText?: string) => {
    const fallbackUrl = message.sources && message.sources[0]?.url && !message.sources[0].url.startsWith("chrome://")
      ? message.sources[0].url
      : `https://www.google.com/search?q=${encodeURIComponent(queryText || "")}`;

    if (typeof chrome !== "undefined" && chrome.tabs && tabId) {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          chrome.tabs.create({ url: fallbackUrl });
        } else {
          chrome.tabs.update(tabId, { active: true });
          if (tab.windowId) {
            chrome.windows.update(tab.windowId, { focused: true });
          }
        }
      });
    } else {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.create({ url: fallbackUrl });
      } else {
        window.open(fallbackUrl, "_blank");
      }
    }
  };

  const handleSourceClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  const chartRegex = /\[CHART:(bar|line|pie)\]\s*(\{.*?\})/g;
  let cleanContent = message.content;
  if (isUser && cleanContent.startsWith("scraped-direct:")) {
    try {
      const dataStr = cleanContent.substring("scraped-direct:".length);
      const parsed = JSON.parse(dataStr);
      cleanContent = parsed.url || "Web Page URL";
    } catch {
      cleanContent = "Web Page URL";
    }
  }
  const charts: React.ReactNode[] = [];

  let match;
  let chartIndex = 0;
  while ((match = chartRegex.exec(message.content)) !== null) {
    const chartType = match[1];
    const chartJsonStr = match[2];
    try {
      const chartData = JSON.parse(chartJsonStr);
      charts.push(
        <MiniChart key={chartIndex++} type={chartType} data={chartData} theme={theme} isLight={isLight} />
      );
      cleanContent = cleanContent.replace(match[0], "");
    } catch (e) {
      console.warn("Failed to parse chart JSON:", e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // JSON 객체의 중첩 괄호( { } ) 짝을 세어 올바르게 잘라내는 헬퍼 함수
  // ──────────────────────────────────────────────────────────────────────────
  const extractJsonBlock = (content: string, startKey: string, marker: string): { jsonText: string; rawMatchText: string } | null => {
    const keyIndex = content.indexOf(startKey);
    if (keyIndex === -1) return null;
    
    const beforeText = content.substring(0, keyIndex);
    const openBraceIndex = beforeText.lastIndexOf('{');
    if (openBraceIndex === -1) return null;
    
    let braceCount = 0;
    let closeBraceIndex = -1;
    let inString = false;
    let escapeActive = false;
    
    for (let i = openBraceIndex; i < content.length; i++) {
      const char = content[i];
      if (escapeActive) {
        escapeActive = false;
        continue;
      }
      if (char === '\\') {
        escapeActive = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            closeBraceIndex = i;
            break;
          }
        }
      }
    }
    
    if (closeBraceIndex === -1) return null;
    
    const jsonText = content.substring(openBraceIndex, closeBraceIndex + 1);
    
    let matchStartIndex = openBraceIndex;
    let matchEndIndex = closeBraceIndex + 1;
    
    const prefixSnippet = content.substring(Math.max(0, openBraceIndex - 100), openBraceIndex);
    const prefixPattern = new RegExp(`(?:${marker})?\\s*(?:\`\`\`json|\`\`\`)?\\s*$`, 'i');
    const prefixMatch = prefixPattern.exec(prefixSnippet);
    if (prefixMatch) {
      matchStartIndex = openBraceIndex - prefixMatch[0].length;
    }
    
    const suffixSnippet = content.substring(closeBraceIndex + 1, Math.min(content.length, closeBraceIndex + 20));
    const suffixMatch = /^\s*(?:```)/.exec(suffixSnippet);
    if (suffixMatch) {
      matchEndIndex = closeBraceIndex + 1 + suffixMatch[0].length;
    }
    
    const rawMatchText = content.substring(matchStartIndex, matchEndIndex);
    return { jsonText, rawMatchText };
  };

  // 1. 명언 스페셜 카드 파싱
  let quoteCard: React.ReactNode | null = null;
  const quoteBlock = extractJsonBlock(cleanContent, '"text"', '\\[QUOTE\\]');
  if (quoteBlock) {
    try {
      const quoteData = cleanAndParseJson(quoteBlock.jsonText);
      if (quoteData.text && quoteData.author) {
        quoteCard = (
          <div className="my-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden backdrop-blur-md">
            {/* 배경 인용부호 데코레이션 */}
            <div className="absolute -top-4 -left-2 text-[120px] font-serif text-purple-500/10 pointer-events-none select-none leading-none">
              “
            </div>
            
            <div className="relative z-10 flex flex-col gap-3">
              <div className="text-sm font-serif italic text-amber-200/95 leading-relaxed font-bold pr-4">
                "{quoteData.text}"
              </div>
              {quoteData.translation && quoteData.translation !== quoteData.text && (
                <div className="text-xs font-serif italic text-slate-300/80 leading-relaxed -mt-1 pr-4">
                  ({quoteData.translation})
                </div>
              )}
              <div className="text-right text-xs font-serif text-indigo-400 font-bold flex items-center justify-end gap-1.5">
                <span className="w-4 h-[1px] bg-indigo-500/50"></span>
                — {(() => {
                  const author = quoteData.author;
                  if (!author) return t ? t("chatbot.unknownAuthor", "저자 불분명") : "저자 불분명";
                  const lower = author.toLowerCase().trim();
                  if (
                    lower === "unknown" || 
                    lower === "unknown author" || 
                    lower === "anonymous" || 
                    lower === "저자 불분명" || 
                    lower === "작가 미상" || 
                    lower === "著者不明" ||
                    lower === "unknown_author"
                  ) {
                    return t ? t("chatbot.unknownAuthor", "저자 불분명") : "저자 불분명";
                  }
                  return author;
                })()}
              </div>
              {quoteData.explanation && (
                <div className="mt-2 pt-3 border-t border-white/[0.06] text-[11.5px] text-slate-300 leading-relaxed whitespace-pre-line">
                  {quoteData.explanation}
                </div>
              )}
            </div>
          </div>
        );
        cleanContent = cleanContent.replace(quoteBlock.rawMatchText, "").trim();
      }
    } catch (e) {
      console.warn("Failed to parse quote JSON:", e);
    }
    // rawMatchText replace가 실패했을 경우 대비: 마커+JSON 블록을 정규식으로 추가 제거
    cleanContent = cleanContent.replace(/\[QUOTE\]\s*(?:```json\s*)?\{[\s\S]*?\}\s*(?:```)?/g, "").trim();
  }

  // 2. 배움 스페셜 카드 파싱
  let learnCard: React.ReactNode | null = null;
  const learnBlock = extractJsonBlock(cleanContent, '"sentence"', '\\[LEARN_CARD\\]');
  if (learnBlock) {
    try {
      const learnData = cleanAndParseJson(learnBlock.jsonText);
      if (learnData.sentence && learnData.translation) {
        learnCard = (
          <div className="my-4 -mx-3.5 p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-teal-950/40 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden backdrop-blur-md">
            {/* 배경 장식 책 아이콘 */}
            <div className="absolute -top-6 -left-3 text-emerald-500/5 pointer-events-none select-none">
              <BookOpen size={130} strokeWidth={1} />
            </div>
            
            <div className="relative z-10 flex flex-col gap-3.5">
              {/* 문장 및 발음 */}
              <div className="flex flex-col gap-1 pr-2">
                <div className="text-[15px] font-serif font-black text-emerald-200/95 leading-relaxed">
                  <span className="align-middle">{learnData.sentence}</span>
                  <button
                    type="button"
                    onClick={() => handlePlayTTS(learnData.sentence)}
                    className="ml-1.5 p-0.5 rounded text-emerald-400/80 hover:text-emerald-350 hover:bg-emerald-500/10 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center align-middle"
                    title={t ? t("tools.tutor.ttsTitle", "발음 듣기") : "발음 듣기"}
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
                {learnData.pronunciation && (
                  <div className="text-[10px] font-medium text-emerald-400/80 leading-normal">
                    {learnData.pronunciation}
                  </div>
                )}
                <div className="text-xs font-serif font-semibold text-slate-350/90 leading-relaxed mt-1">
                  {learnData.translation}
                </div>
              </div>

              {/* 단어 칩 리스트 */}
              {learnData.vocabulary && learnData.vocabulary.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
                  {learnData.vocabulary.map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/[0.05] bg-white/[0.03] text-[9.5px]">
                      <span className="font-extrabold text-emerald-400 font-mono">{v.word}</span>
                      <span className="w-[1px] h-2 bg-white/10" />
                      <span className="text-slate-350">{v.meaning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 선생님 코멘트 */}
              {learnData.tutor_note && (
                <div className="mt-1.5 p-3 rounded-xl bg-slate-950/40 border border-white/[0.03] text-[11px] text-slate-300 leading-relaxed whitespace-pre-line shadow-inner">
                  {learnData.tutor_note}
                </div>
              )}
            </div>
          </div>
        );
        cleanContent = cleanContent.replace(learnBlock.rawMatchText, "").trim();
      }
    } catch (e) {
      console.warn("Failed to parse learn JSON:", e);
    }
    // rawMatchText replace가 실패했을 경우 대비: 마커+JSON 블록을 정규식으로 추가 제거
    cleanContent = cleanContent.replace(/\[LEARN_CARD\]\s*(?:```json\s*)?\{[\s\S]*?\}\s*(?:```)?/g, "").trim();
  }

  // 최종: 카드 파싱 후 남은 JSON 코드블록(```json...```) 잔여물 일괄 제거
  cleanContent = cleanContent.replace(/```json[\s\S]*?```/g, "").trim();

  const handleSaveToTodo = () => {
    if (todoSaved) return;
    try {
      chrome.storage.local.get(["nanobot-tool-todos"], (result) => {
        const prevTodos = result["nanobot-tool-todos"] || [];
        const newTodo = {
          id: "todo-" + Math.random().toString(36).substring(7),
          text: cleanContent.trim(),
          completed: false,
          createdAt: Date.now()
        };
        chrome.storage.local.set({ "nanobot-tool-todos": [newTodo, ...prevTodos] }, () => {
          setTodoSaved(true);
          setTimeout(() => setTodoSaved(false), 1500);
        });
      });
    } catch (err) {
      console.error("Failed to save to todo:", err);
    }
  };

  const handleSaveToNote = () => {
    if (noteSaved) return;
    try {
      chrome.storage.local.get(["nanobot-tool-notes"], (result) => {
        const prevNotes = result["nanobot-tool-notes"] || [];
        const newNote = {
          id: "note-" + Math.random().toString(36).substring(7),
          title: cleanContent.trim().substring(0, 15) + (cleanContent.trim().length > 15 ? "..." : ""),
          content: cleanContent,
          updatedAt: Date.now()
        };
        chrome.storage.local.set({
          "nanobot-tool-notes": [newNote, ...prevNotes],
          "nanobot-tool-active-note-id": newNote.id
        }, () => {
          setNoteSaved(true);
          setTimeout(() => setNoteSaved(false), 1500);
        });
      });
    } catch (err) {
      console.error("Failed to save to note:", err);
    }
  };

  const handleAnalyzeCurrentSite = () => {
    if (!onQuickQuestion) return;
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      chrome.tabs.query({ active: true }, (tabs) => {
        let activeTab = tabs.find(tab => 
          tab.url && 
          !tab.url.startsWith("chrome-extension://") && 
          !tab.url.startsWith("chrome://") && 
          !tab.url.startsWith("about:")
        );
        if (!activeTab && tabs.length > 0) {
          activeTab = tabs[0];
        }
        if (activeTab && activeTab.id && activeTab.url) {
          const url = activeTab.url;
          if (url.startsWith("chrome-extension://") || url.startsWith("chrome://") || url.startsWith("about:")) {
            const rawMsg = t 
              ? t("session.webAnalyze.invalidUrl", "❌ **올바른 형식의 웹 페이지 주소(URL)를 입력해 주세요.**") 
              : "올바른 형식의 웹 페이지 주소(URL)를 입력해 주세요.";
            const cleanMsg = rawMsg.replace(/\*\*|❌/g, "").trim();
            alert(cleanMsg);
            return;
          }

          // scripting API를 이용해 활성 탭의 innerText를 직접 긁어와 CORS 및 봇 차단을 우회합니다.
          if (chrome.scripting && typeof chrome.scripting.executeScript === "function") {
            chrome.scripting.executeScript(
              {
                target: { tabId: activeTab.id },
                func: () => {
                  return {
                    title: document.title,
                    text: document.body.innerText || document.body.textContent || ""
                  };
                }
              },
              (results) => {
                if (results && results[0] && results[0].result) {
                  const { title, text } = results[0].result;
                  if (text && text.trim().length > 30) {
                    const payload = {
                      title: title || "Web Page",
                      text: text.trim().substring(0, 8000), // Gemini Nano 크기 한계 고려
                      url: url
                    };
                    onQuickQuestion(`scraped-direct:${JSON.stringify(payload)}`);
                    return;
                  }
                }
                // 직접 스크랩 실패 시 기존 방식(URL만 전달하여 서버에서 긁기)으로 fallback
                onQuickQuestion(url);
              }
            );
          } else {
            onQuickQuestion(url);
          }
        } else {
          onQuickQuestion(window.location.href);
        }
      });
    } else {
      onQuickQuestion(window.location.href);
    }
  };

  return (
    <div className={`flex gap-3 w-full ${isUser ? "justify-end" : "justify-start"} group`}>
      {!isUser && (
        <AIAvatar avatarPath={effectiveAIAvatar} size={30} />
      )}

      <div className={`flex flex-col max-w-[90%] gap-1`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 select-none pl-1">
            <span className={`text-[10px] font-bold ${theme.textSub}`}>
              {settings.nano_ai_avatar_name || "Nano AI"}
            </span>

            {!message.isStreaming && cleanContent && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                    isLight
                      ? "hover:bg-slate-200/60 text-slate-400 hover:text-slate-700"
                      : "hover:bg-white/10 text-slate-400 hover:text-white"
                  } ${
                    copied ? "text-emerald-500 hover:text-emerald-600" : ""
                  }`}
                  title={t ? t("common.copy", "복사하기") : "복사하기"}
                >
                  {copied ? (
                    <Check size={10} className="text-emerald-400 animate-in zoom-in duration-200" />
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveToTodo}
                  className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                    isLight
                      ? "hover:bg-slate-200/60 text-slate-400 hover:text-slate-700"
                      : "hover:bg-white/10 text-slate-400 hover:text-white"
                  } ${
                    todoSaved ? "text-emerald-500 hover:text-emerald-600" : ""
                  }`}
                  title="Add to To-Do List"
                >
                  {todoSaved ? (
                    <Check size={10} className="text-emerald-400 animate-in zoom-in duration-200" />
                  ) : (
                    <CheckSquare size={10} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveToNote}
                  className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                    isLight
                      ? "hover:bg-slate-200/60 text-slate-400 hover:text-slate-700"
                      : "hover:bg-white/10 text-slate-400 hover:text-white"
                  } ${
                    noteSaved ? "text-emerald-500 hover:text-emerald-600" : ""
                  }`}
                  title="Add to Memos"
                >
                  {noteSaved ? (
                    <Check size={10} className="text-emerald-400 animate-in zoom-in duration-200" />
                  ) : (
                    <FileText size={10} />
                  )}
                </button>
                {onOpenAlarm && (
                  <button
                    type="button"
                    onClick={() => onOpenAlarm(cleanContent)}
                    className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                      isLight
                        ? "hover:bg-slate-200/60 text-slate-400 hover:text-slate-700"
                        : "hover:bg-white/10 text-slate-400 hover:text-white"
                    }`}
                    title="이 내용을 알람으로 예약"
                  >
                    <Bell size={10} />
                  </button>
                )}
                {onSendToViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = cleanContent.trim();
                      const title = snippet.split("\n")[0].replace(/[#*`_-]/g, "").trim().substring(0, 50) || "AI 답변 문서";
                      onSendToViewer(title, cleanContent);
                    }}
                    className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                      isLight
                        ? "hover:bg-slate-200/60 text-slate-400 hover:text-slate-700"
                        : "hover:bg-white/10 text-slate-400 hover:text-white"
                    }`}
                    title={t ? t("docViewer.sendShort", "뷰어 전송") : "뷰어 전송"}
                  >
                    <Eye size={10} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 leading-relaxed break-words relative overflow-hidden select-text w-full ${
            isUser
              ? `${theme.primary} border ${theme.border} text-white rounded-tr-sm shadow-md`
              : `${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} rounded-tl-sm shadow-sm`
          }`}
          style={{
            fontSize: "var(--nano-chat-font-size, 13px)",
            fontFamily: "var(--nano-chat-font-family, ui-sans-serif, system-ui, sans-serif)",
            ...(message.isStreaming ? { contain: "content", willChange: "contents" } : {})
          }}
        >
          <div className={`prose max-w-none ${
            isUser
              ? "text-white prose-invert"
              : (isLight ? "text-slate-800" : "prose-invert text-slate-200")
          }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw]}
              components={{
                p: ({ children }) => <p className="m-0 mb-1.5 leading-relaxed block">{children}</p>,
                ul: ({ children }) => <ul className="pl-4 m-0 mt-1 mb-2 list-disc space-y-1 block">{children}</ul>,
                ol: ({ children }) => <ol className="pl-4 m-0 mt-1 mb-2 list-decimal space-y-1 block">{children}</ol>,
                li: ({ children }) => <li className={`pl-0.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>{children}</li>,
                strong: ({ children }) => <strong className={`font-extrabold ${theme.textMain}`}>{children}</strong>,
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const isInline = !match && !codeString.includes('\n');
                  
                  if (isInline) {
                    return (
                      <code className={`${theme.bgInput} px-1.5 py-0.5 rounded text-[10px] ${
                        isLight ? "text-rose-600 font-bold" : "text-pink-400"
                      } font-mono font-bold animate-none`}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <CodeBlock code={codeString} language={match ? match[1] : 'text'} theme={theme} isLight={isLight} />
                  );
                },
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      isUser 
                        ? "text-white/90 hover:text-white underline decoration-white/50" 
                        : `${theme.text} ${theme.textHover} font-bold underline`
                    } transition-colors cursor-pointer whitespace-nowrap`}
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className={`overflow-x-auto my-3 w-full border ${theme.borderMuted} rounded-xl shadow-inner ${theme.bgInput}`}>
                    <table className="w-full border-collapse text-left text-[10.5px] leading-normal">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className={`${theme.bgSub} border-b ${theme.borderMuted} ${theme.textMain} font-bold`}>{children}</thead>,
                tbody: ({ children }) => <tbody className={`divide-y ${theme.borderMuted} ${isLight ? "text-slate-700" : "text-slate-350"}`}>{children}</tbody>,
                tr: ({ children }) => <tr className={`${isLight ? "hover:bg-slate-100/50" : "hover:bg-white/[0.015]"} transition-colors`}>{children}</tr>,
                th: ({ children }) => <th className={`px-3 py-2 text-[9.5px] font-extrabold uppercase tracking-wider ${theme.text}`}>{children}</th>,
                td: ({ children }) => <td className={`px-3 py-1.5 align-middle border-r ${theme.borderMuted} last:border-r-0 font-medium font-mono`}>{children}</td>,
              }}
            >
              {cleanContent}
            </ReactMarkdown>
            {message.isStreaming && (
              <span
                className="inline-block w-[2px] h-[1em] align-middle ml-0.5 rounded-sm"
                style={{
                  backgroundColor: "currentColor",
                  opacity: 0.7,
                  animation: "nano-caret-blink 0.9s ease-in-out infinite"
                }}
              />
            )}

            {message.isWebAnalyzeIntro && onQuickQuestion && (
              <div className={`mt-3 pt-2 border-t border-dashed ${isLight ? "border-slate-200" : "border-white/10"} flex justify-start`}>
                <button
                  type="button"
                  onClick={handleAnalyzeCurrentSite}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold ${theme.primary} text-white cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md`}
                >
                  <Globe size={11} />
                  {t ? t("session.webAnalyze.analyzeCurrentSite", "현재 활성화된 사이트 분석 ⚡") : "현재 활성화된 사이트 분석 ⚡"}
                </button>
              </div>
            )}

            {charts.length > 0 && (
              <div className="flex flex-col gap-2.5 w-full">
                {charts}
              </div>
            )}

            {quoteCard}

            {learnCard}

            {message.isMenu && quickMenuItems && quickMenuItems.length > 0 && onQuickQuestion && (
              <div className={`mt-3 pt-2.5 border-t border-dashed ${isLight ? "border-slate-200" : "border-white/10"} grid grid-cols-1 gap-1.5`}>
                {quickMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onQuickQuestion(t ? t(item.promptKey, item.defaultPrompt) : item.defaultPrompt)}
                    className={`text-left py-2 px-3 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-sm
                      ${isLight 
                        ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                        : "bg-slate-900 border-white/[0.06] text-slate-300 hover:bg-purple-950/20 hover:border-purple-500/40 hover:text-purple-400"
                      }`}
                  >
                    {t ? t(item.labelKey, item.defaultLabel) : item.defaultLabel}
                  </button>
                ))}
              </div>
            )}

            {message.isConfirm && onConfirmAction && (
              <div className={`mt-3 pt-2.5 border-t border-dashed ${isLight ? "border-slate-200" : "border-white/10"} flex items-center justify-center gap-3`}>
                <button
                  type="button"
                  onClick={() => onConfirmAction(true)}
                  className={`flex-1 py-1.5 px-4 rounded-lg border text-[10px] font-black transition-all cursor-pointer shadow-sm text-center bg-emerald-600 border-emerald-500/30 hover:bg-emerald-500 text-white`}
                >
                  {t ? t("common.yes", "예") : "예"}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmAction(false)}
                  className={`flex-1 py-1.5 px-4 rounded-lg border text-[10px] font-black transition-all cursor-pointer shadow-sm text-center bg-rose-600 border-rose-500/30 hover:bg-rose-500 text-white`}
                >
                  {t ? t("common.no", "아니오") : "아니오"}
                </button>
              </div>
            )}
          </div>

          {message.isStreaming && !message.content && (
            <div className="flex gap-1 py-1.5 justify-start items-center">
              <span className={`w-1.5 h-1.5 ${isLight ? "bg-slate-400" : "bg-slate-500"} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }}></span>
              <span className={`w-1.5 h-1.5 ${isLight ? "bg-slate-400" : "bg-slate-500"} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }}></span>
              <span className={`w-1.5 h-1.5 ${isLight ? "bg-slate-400" : "bg-slate-500"} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }}></span>
            </div>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 pl-1 w-full animate-in fade-in duration-300">
            <div className={`text-[10px] font-bold ${theme.textSub} flex items-center justify-between select-none`}>
              <div className="flex items-center gap-1">
                <Globe size={10} className="text-emerald-500 animate-pulse" />
                <span>{t ? t("chatbot.sources.title", "참고 출처") : "참고 출처"}</span>
              </div>
              {(message.searchTabId || (message.sources && message.sources[0]?.url)) && (
                <button
                  type="button"
                  onClick={() => handleSwitchToSearchTab(message.searchTabId, message.searchQuery)}
                  className={`flex items-center gap-0.5 text-[9px] hover:underline cursor-pointer font-bold ${
                    isLight ? "text-indigo-600 hover:text-indigo-700" : "text-indigo-400 hover:text-indigo-300"
                  }`}
                >
                  {t ? t("chatbot.sources.switchToTab", "실시간 검색 결과로 이동 ↗") : "실시간 검색 결과로 이동 ↗"}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 w-full">
              {message.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  onClick={(e) => handleSourceClick(e, src.url)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all max-w-[200px] truncate shadow-sm cursor-pointer ${
                    isLight
                      ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-350"
                      : "bg-slate-900 border-white/[0.06] hover:bg-white/[0.04] text-slate-350 hover:border-white/[0.12]"
                  }`}
                  title={`${src.title}\n${src.url}`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-slate-200/50 dark:bg-slate-800/80 flex items-center justify-center text-[8.5px] flex-shrink-0 text-slate-500 font-bold">
                    {i + 1}
                  </span>
                  <span className="truncate">{src.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
