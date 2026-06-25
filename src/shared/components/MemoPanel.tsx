import React, { useState } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { useChromeStorage } from "../hooks/useChromeStorage";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export function MemoPanel({ locale, t, theme }: { locale: string; t: any; theme: any }) {
  const [activeTab, setActiveTab] = useState<"memo" | "todo">("memo");
  
  // 메모 상태
  const [notes, setNotes] = useChromeStorage<Note[]>("nanobot-tool-notes", [
    {
      id: "note-1",
      title: t("tools.memo.unnamedMemo", "기본 메모"),
      content: "",
      updatedAt: Date.now()
    }
  ]);
  const [activeNoteId, setActiveNoteId] = useChromeStorage<string | null>("nanobot-tool-active-note-id", "note-1");

  // To-Do 상태
  const [todos, setTodos] = useChromeStorage<TodoItem[]>("nanobot-tool-todos", []);
  const [newTodoText, setNewTodoText] = useState("");

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0] || null;

  // 메모 조작
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

  // To-Do 조작
  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo: TodoItem = {
      id: "todo-" + Math.random().toString(36).substring(7),
      text: newTodoText.trim(),
      completed: false,
      createdAt: Date.now()
    };
    setTodos([newTodo, ...todos]);
    setNewTodoText("");
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev: TodoItem[]) => prev.map((todo: TodoItem) => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev: TodoItem[]) => prev.filter((todo: TodoItem) => todo.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit select-none">
      {/* 상단 헤더 & 탭 제어 */}
      <div className={`flex flex-col border-b ${theme.borderMuted}`}>
        <div className="flex items-center justify-between p-4 pb-2">
          <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
            📝 {t("tools.memo.title", "도구 메모 및 할 일")}
          </span>
        </div>
        
        {/* 탭 인터페이스 */}
        <div className="flex px-4 pb-1 gap-4 select-none font-bold text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("memo")}
            className={`pb-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === "memo"
                ? `${theme.text} ${theme.border}`
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {t("tools.memo.memoTab", "메모장")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className={`pb-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === "todo"
                ? `${theme.text} ${theme.border}`
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {t("tools.memo.todoTab", "할 일 목록")}
          </button>
        </div>
      </div>

      {/* 탭 본문 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "memo" ? (
          <div className="flex flex-1 overflow-hidden">
            {/* 메모 목록 */}
            <div className={`w-1/3 border-r ${theme.borderMuted} overflow-y-auto custom-scrollbar`}>
              <div className="p-2 border-b border-dashed border-white/[0.04] flex justify-end">
                <button
                  onClick={handleAddNote}
                  className={`p-1 rounded ${theme.bgInput} hover:${theme.bgHover} ${theme.textMain} transition cursor-pointer border ${theme.borderMuted}`}
                  title={t("tools.memo.addMemo", "메모 추가")}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              {notes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  className={`w-full text-left p-3 border-b ${theme.borderMuted} transition text-xs truncate cursor-pointer ${
                    activeNoteId === n.id 
                      ? `${theme.bgMuted} ${theme.text} font-semibold` 
                      : `hover:${theme.bgHover} ${theme.textSub}`
                  }`}
                >
                  {n.title || t("tools.memo.unnamedMemo", "기본 메모")}
                </button>
              ))}
            </div>

            {/* 메모 상세 편집 */}
            <div className={`flex-1 flex flex-col p-4 gap-3 ${theme.bgSub}`}>
              {activeNote ? (
                <>
                  <div className="flex justify-between items-center gap-2">
                    <input
                       type="text"
                      value={activeNote.title}
                      onChange={e => handleUpdateTitle(e.target.value)}
                      className={`flex-1 bg-transparent border-b ${theme.borderMuted} text-xs font-bold pb-1 focus:outline-none ${theme.focusBorder} ${theme.textMain}`}
                      placeholder={t("tools.memo.memoTitlePlaceholder", "제목")}
                    />
                    <button
                      onClick={handleDeleteNote}
                      disabled={notes.length <= 1}
                      className={`p-1 rounded ${theme.bgInput} hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed border ${theme.borderMuted} transition cursor-pointer`}
                      title={t("tools.memo.deleteMemo", "메모 삭제")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <textarea
                    value={activeNote.content}
                    onChange={e => handleUpdateContent(e.target.value)}
                    className={`flex-1 bg-transparent resize-none focus:outline-none text-xs leading-relaxed ${theme.textMain} custom-scrollbar`}
                    placeholder={t("tools.memo.memoContentPlaceholder", "여기에 메모를 입력하세요...")}
                  />
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center text-xs ${theme.textSub}`}>
                  {t("tools.memo.emptyActiveMemo", "선택된 메모가 없습니다.")}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 할 일 목록 (To-Do) */
          <div className={`flex-1 flex flex-col p-4 gap-3 ${theme.bgSub} overflow-hidden`}>
            {/* 할 일 입력창 */}
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                placeholder={t("tools.memo.newTodoPlaceholder", "새로운 할 일 등록...")}
                className={`flex-1 bg-transparent border-b ${theme.borderMuted} text-xs pb-1 focus:outline-none ${theme.focusBorder} ${theme.textMain}`}
              />
              <button
                type="submit"
                className={`p-1 px-2 rounded text-[10px] font-bold ${theme.primary} text-white cursor-pointer hover:opacity-90 transition`}
              >
                {t("common.confirm", "확인")}
              </button>
            </form>

            {/* 할 일 목록 나열 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {todos.length === 0 ? (
                <div className={`h-full flex items-center justify-center text-center text-xs ${theme.textSub} leading-relaxed whitespace-pre-line`}>
                  {t("tools.memo.emptyTodo", "등록된 할 일이 없습니다.\n오늘의 미션을 추가해 보세요!")}
                </div>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${theme.borderMuted} ${theme.bgInput} transition`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                    >
                      {todo.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <div className={`w-3.5 h-3.5 border ${theme.borderMuted} rounded shrink-0`} />
                      )}
                      <span className={`text-xs ${todo.completed ? `line-through ${theme.textSub}` : theme.textMain} break-all font-medium`}>
                        {todo.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer ml-2"
                      title={t("common.delete", "삭제")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
