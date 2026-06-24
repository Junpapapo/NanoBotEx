import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useChromeStorage } from "../hooks/useChromeStorage";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export function MemoPanel({ locale, t }: { locale: string; t: any }) {
  const [notes, setNotes] = useChromeStorage<Note[]>("nanobot-tool-notes", [
    {
      id: "note-1",
      title: t("tools.memo.unnamedMemo", "기본 메모"),
      content: "",
      updatedAt: Date.now()
    }
  ]);
  const [activeNoteId, setActiveNoteId] = useChromeStorage<string | null>("nanobot-tool-active-note-id", "note-1");

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0] || null;

  const handleAddNote = () => {
    const newId = Math.random().toString(36).substring(7);
    const newNote: Note = {
      id: newId,
      title: `${t("tools.memo.newMemoTitle", "새 메모")} ${notes.length + 1}`,
      content: "",
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newId);
  };

  const handleDeleteNote = () => {
    if (!activeNoteId || notes.length <= 1) return;
    const remaining = notes.filter(n => n.id !== activeNoteId);
    setNotes(remaining);
    setActiveNoteId(remaining[0]?.id || null);
  };

  const handleUpdateContent = (text: string) => {
    if (!activeNoteId) return;
    setNotes((prev: Note[]) => prev.map((n: Note) => n.id === activeNoteId ? { ...n, content: text, updatedAt: Date.now() } : n));
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeNoteId) return;
    setNotes((prev: Note[]) => prev.map((n: Note) => n.id === activeNoteId ? { ...n, title, updatedAt: Date.now() } : n));
  };

  return (
    <div className="flex flex-col h-full bg-[#080e21]/95 text-slate-100 border-l border-white/5">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <span className="text-sm font-bold flex items-center gap-1.5">
          📝 {t("menu.memo", "메모장")}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={handleAddNote}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
            title={t("tools.memo.addMemo", "메모 추가")}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={handleDeleteNote}
            disabled={notes.length <= 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title={t("tools.memo.deleteMemo", "메모 삭제")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 메모 목록 */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar">
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => setActiveNoteId(n.id)}
              className={`w-full text-left p-3 border-b border-white/[0.03] transition text-xs truncate ${
                activeNoteId === n.id ? "bg-indigo-500/10 text-indigo-400 font-semibold" : "hover:bg-white/[0.02] text-slate-400"
              }`}
            >
              {n.title || t("tools.memo.unnamedMemo", "기본 메모")}
            </button>
          ))}
        </div>

        {/* 메모 상세 편집 */}
        <div className="flex-1 flex flex-col p-4 gap-3 bg-[#060a18]/95">
          {activeNote ? (
            <>
              <input
                type="text"
                value={activeNote.title}
                onChange={e => handleUpdateTitle(e.target.value)}
                className="bg-transparent border-b border-white/5 text-sm font-bold pb-2 focus:outline-none focus:border-indigo-500/50 text-white"
                placeholder={t("tools.memo.memoTitlePlaceholder", "제목")}
              />
              <textarea
                value={activeNote.content}
                onChange={e => handleUpdateContent(e.target.value)}
                className="flex-1 bg-transparent resize-none focus:outline-none text-xs leading-relaxed text-slate-300 custom-scrollbar"
                placeholder={t("tools.memo.memoContentPlaceholder", "여기에 메모를 입력하세요...")}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              {t("tools.memo.emptyActiveMemo", "선택된 메모가 없습니다.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
