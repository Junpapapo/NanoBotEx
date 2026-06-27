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
import { Check, CheckSquare, FileText, Globe } from "lucide-react";

interface ChatMessageItemProps {
  message: Message;
  settings: UserSettings;
  effectiveAIAvatar: string;
  onQuickQuestion?: (text: string) => void;
  t?: any;
  quickMenuItems?: QuickMenuItem[];
  onConfirmAction?: (confirmed: boolean) => void;
}

export function ChatMessageItem({ message, settings, effectiveAIAvatar, onQuickQuestion, t, quickMenuItems, onConfirmAction }: ChatMessageItemProps) {
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");
  const isUser = message.role === "user";
  const isLight = settings.nano_skin_mode === "light";

  const [todoSaved, setTodoSaved] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

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

      <div className={`flex flex-col max-w-[80%] gap-1`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 select-none pl-1">
            <span className={`text-[10px] font-bold ${theme.textSub}`}>
              {settings.nano_ai_avatar_name || "Nano AI"}
            </span>

            {!message.isStreaming && cleanContent && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
      </div>
    </div>
  );
}
