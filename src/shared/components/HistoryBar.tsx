import React from "react";
import { MessageSquare, Trash } from "lucide-react";
import { ChatSession } from "../chatbot-types";

interface HistoryBarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  t: any;
  theme: any;
}

export function HistoryBar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllSessions,
  t,
  theme
}: HistoryBarProps) {
  const handleClearAll = () => {
    onClearAllSessions();
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-3 overflow-y-auto custom-scrollbar gap-2.5 text-inherit">
      <div className={`flex items-center justify-between pb-2 border-b ${theme.borderMuted} pr-16`}>
        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${theme.textSub}`}>
          <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
          <span>{t("history.header", "대화 기록")}</span>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={handleClearAll}
            className={`transition hover:text-rose-400 cursor-pointer p-1 hover:${theme.bgHover} rounded-md`}
            title={t("history.clearAll", "모든 기록 지우기")}
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {sessions.length === 0 ? (
          <div className={`text-[10px] ${theme.textSub} text-center py-6`}>
            {t("history.empty", "과거 대화 기록이 없습니다.")}
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition group ${
                currentSessionId === s.id
                  ? `${theme.bgMuted} ${theme.border} ${theme.text} font-semibold`
                  : `${theme.bgInput} ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover}`
              }`}
            >
              <button
                onClick={() => onSelectSession(s.id)}
                className={`flex-1 text-[10px] truncate text-left cursor-pointer hover:${theme.text}`}
                title={s.title}
              >
                {s.title}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(s.id);
                }}
                className={`opacity-0 group-hover:opacity-100 transition p-1.5 hover:text-rose-400 cursor-pointer shrink-0 ml-1.5 hover:${theme.bgHover} rounded-md`}
                title={t("common.delete", "삭제")}
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
