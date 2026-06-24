import React, { useState } from "react";
import { Message, UserSettings } from "../chatbot-types";
import { AIAvatar } from "./AIAvatar";
import { CodeBlock } from "./CodeBlock";
import { MiniChart } from "./MiniChart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { getThemePalette } from "../chatbot-constants";
import { Check, CheckSquare, FileText } from "lucide-react";

interface ChatMessageItemProps {
  message: Message;
  settings: UserSettings;
  effectiveAIAvatar: string;
}

export function ChatMessageItem({ message, settings, effectiveAIAvatar }: ChatMessageItemProps) {
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");
  const isUser = message.role === "user";
  const isLight = settings.nano_skin_mode === "light";

  const [todoSaved, setTodoSaved] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const chartRegex = /\[CHART:(bar|line|pie)\]\s*(\{.*?\})/g;
  let cleanContent = message.content;
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
    window.dispatchEvent(
      new CustomEvent("nanobot:add-todo", {
        detail: { text: cleanContent }
      })
    );
    setTodoSaved(true);
    setTimeout(() => setTodoSaved(false), 1500);
  };

  const handleSaveToNote = () => {
    if (noteSaved) return;
    window.dispatchEvent(
      new CustomEvent("nanobot:add-note", {
        detail: { text: cleanContent }
      })
    );
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
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
                  className={`p-0.5 rounded hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center text-slate-400 hover:text-white ${
                    todoSaved ? "text-emerald-400 hover:text-emerald-400" : ""
                  }`}
                  title="할 일 목록에 추가"
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
                  className={`p-0.5 rounded hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center text-slate-400 hover:text-white ${
                    noteSaved ? "text-emerald-400 hover:text-emerald-400" : ""
                  }`}
                  title="메모장에 추가"
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
          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words relative overflow-hidden select-text ${
            isUser
              ? `${theme.primary} border ${theme.border} text-white rounded-tr-sm shadow-md`
              : `${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} rounded-tl-sm shadow-sm`
          }`}
        >
          <div className={`prose max-w-none text-xs ${isLight ? "text-slate-800" : "prose-invert text-slate-200"}`}>
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
                    className={`${theme.text} ${theme.textHover} font-bold underline transition-colors cursor-pointer whitespace-nowrap`}
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

            {charts.length > 0 && (
              <div className="flex flex-col gap-2.5 w-full">
                {charts}
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
