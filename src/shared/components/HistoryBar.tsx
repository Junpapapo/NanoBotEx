import React from "react";
import { MessageSquare, Trash } from "lucide-react";
import { ChatSession } from "../chatbot-types";

interface HistoryBarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  t: any;
}

export function HistoryBar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  t
}: HistoryBarProps) {
  return (
    <div className="flex flex-col h-full bg-[#080e21]/95 p-3 overflow-y-auto custom-scrollbar gap-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 pb-2 border-b border-white/5">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{t("menu.history", "대화 기록")}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {sessions.length === 0 ? (
          <div className="text-[10px] text-slate-500 text-center py-6">
            {t("history.empty", "과거 대화 기록이 없습니다.")}
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition group ${
                currentSessionId === s.id
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-semibold"
                  : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <button
                onClick={() => onSelectSession(s.id)}
                className="flex-1 text-[10px] truncate text-left cursor-pointer hover:text-white"
                title={s.title}
              >
                {s.title}
              </button>
              <button
                onClick={() => onDeleteSession(s.id)}
                className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-rose-400 cursor-pointer shrink-0 ml-1.5"
                title={t("common.delete", "삭제")}
              >
                <Trash className="h-2.5 w-2.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
