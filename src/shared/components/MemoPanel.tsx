import React, { useState, useMemo } from "react";
import { Plus, Trash2, CheckSquare, ChevronLeft, ChevronRight, CalendarDays, Bell } from "lucide-react";
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
  dueDate?: string; // "YYYY-MM-DD" 형식
}

// ── 날짜 유틸리티 ──
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayStr(): string {
  return toDateStr(new Date());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

// ── 미니 캘린더 컴포넌트 ──
interface MiniCalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  todoDates: Set<string>;   // 할 일이 있는 날짜 집합
  doneDates: Set<string>;   // 모두 완료된 날짜 집합
  theme: any;
  locale: string;
}

function MiniCalendar({ selectedDate, onSelectDate, todoDates, doneDates, theme, locale }: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = getTodayStr();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "ko-KR",
    { year: "numeric", month: "long" }
  );

  const weekDays = locale === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : locale === "en"
    ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    : ["일", "월", "화", "수", "목", "금", "토"];

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={`px-3 pt-2.5 pb-2 border-b ${theme.borderMuted} select-none`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={`p-0.5 rounded hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
        >
          <ChevronLeft size={13} />
        </button>
        <span className={`text-[10px] font-black ${theme.textMain}`}>{monthLabel}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className={`p-0.5 rounded hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-0.5">
        {weekDays.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[8.5px] font-bold pb-0.5 ${
              i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : theme.textSub
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasTodo = todoDates.has(dateStr);
          const isDone = doneDates.has(dateStr);
          const dayOfWeek = (firstDay + day - 1) % 7;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative flex flex-col items-center justify-center py-0.5 rounded-md text-[9.5px] font-bold transition cursor-pointer ${
                isSelected
                  ? `${theme.primary} text-white`
                  : isToday
                  ? `${theme.bgMuted} ${theme.text} ring-1 ${theme.border}`
                  : dayOfWeek === 0
                  ? `text-rose-400 hover:${theme.bgHover}`
                  : dayOfWeek === 6
                  ? `text-blue-400 hover:${theme.bgHover}`
                  : `${theme.textMain} hover:${theme.bgHover}`
              }`}
            >
              {day}
              {hasTodo && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                  isSelected ? "bg-white/70" : isDone ? "bg-emerald-400" : "bg-purple-400"
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* 필터 표시 배너 */}
      {selectedDate && (
        <div className={`mt-1.5 flex items-center justify-between px-1 py-0.5 rounded-md ${theme.bgMuted} ${theme.text}`}>
          <div className="flex items-center gap-1">
            <CalendarDays size={9} />
            <span className="text-[9px] font-black">{selectedDate}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectDate(null)}
            className={`text-[8px] font-bold ${theme.textSub} hover:${theme.textMain} cursor-pointer transition`}
          >
            전체 ✕
          </button>
        </div>
      )}
    </div>
  );
}

export function MemoPanel({ locale, t, theme, onOpenAlarm }: { locale: string; t: any; theme: any; onOpenAlarm?: (title: string) => void }) {
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

  // 캘린더 선택 날짜 (null = 필터 없음)
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayStr());

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0] || null;

  // 할 일이 있는 날짜, 모두 완료된 날짜 계산
  const todoDates = useMemo(() => {
    const s = new Set<string>();
    todos.forEach(t => { if (t.dueDate) s.add(t.dueDate); });
    return s;
  }, [todos]);

  const doneDates = useMemo(() => {
    const byDate: Record<string, { total: number; done: number }> = {};
    todos.forEach(t => {
      if (!t.dueDate) return;
      if (!byDate[t.dueDate]) byDate[t.dueDate] = { total: 0, done: 0 };
      byDate[t.dueDate].total++;
      if (t.completed) byDate[t.dueDate].done++;
    });
    const s = new Set<string>();
    Object.entries(byDate).forEach(([date, { total, done }]) => {
      if (total > 0 && total === done) s.add(date);
    });
    return s;
  }, [todos]);

  // 날짜 필터링된 할 일 목록
  const filteredTodos = useMemo(() => {
    if (!selectedDate) return todos;
    return todos.filter(t => t.dueDate === selectedDate);
  }, [todos, selectedDate]);

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
      createdAt: Date.now(),
      dueDate: selectedDate || undefined,
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
      {/* 상단 헤더 */}
      <div className={`flex items-center justify-between p-4 pb-2 border-b ${theme.borderMuted}`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          📝 {t("tools.memo.title", "도구 메모 및 할 일")}
        </span>
      </div>

      {/* 미니 캘린더 — 탭 위에 삽입 */}
      <MiniCalendar
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          // 날짜 클릭 시 할 일 탭으로 자동 전환
          if (date !== null) setActiveTab("todo");
        }}
        todoDates={todoDates}
        doneDates={doneDates}
        theme={theme}
        locale={locale}
      />

      {/* 탭 인터페이스 */}
      <div className={`flex px-4 py-1.5 gap-4 select-none font-bold text-xs border-b ${theme.borderMuted}`}>
        <button
          type="button"
          onClick={() => setActiveTab("memo")}
          className={`pb-1 border-b-2 cursor-pointer transition-all ${
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
          className={`pb-1 border-b-2 cursor-pointer transition-all ${
            activeTab === "todo"
              ? `${theme.text} ${theme.border}`
              : "text-slate-500 border-transparent hover:text-slate-300"
          }`}
        >
          {t("tools.memo.todoTab", "할 일 목록")}
          {selectedDate && filteredTodos.length > 0 && (
            <span className="ml-1 text-[8px] font-black text-purple-400">
              ({filteredTodos.length})
            </span>
          )}
        </button>
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
                    {onOpenAlarm && activeNote && (
                      <button
                        onClick={() => onOpenAlarm(activeNote.title || activeNote.content)}
                        className={`p-1 rounded ${theme.bgInput} hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border ${theme.borderMuted} transition cursor-pointer`}
                        title="이 메모를 알람으로 예약"
                      >
                        <Bell className="h-3 w-3" />
                      </button>
                    )}
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
                placeholder={
                  selectedDate
                    ? `${selectedDate} ${t("tools.memo.newTodoPlaceholder", "새로운 할 일 등록...")}`
                    : t("tools.memo.newTodoPlaceholder", "새로운 할 일 등록...")
                }
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
              {filteredTodos.length === 0 ? (
                <div className={`h-full flex items-center justify-center text-center text-xs ${theme.textSub} leading-relaxed whitespace-pre-line`}>
                  {selectedDate
                    ? t("tools.memo.emptyTodoDate", "이 날짜에 등록된 할 일이 없어요.\n위 입력창으로 추가해 보세요!")
                    : t("tools.memo.emptyTodo", "등록된 할 일이 없습니다.\n오늘의 미션을 추가해 보세요!")}
                </div>
              ) : (
                filteredTodos.map(todo => (
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
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={`text-xs ${todo.completed ? `line-through ${theme.textSub}` : theme.textMain} break-all font-medium`}>
                          {todo.text}
                        </span>
                        {todo.dueDate && !selectedDate && (
                          <span className="text-[8.5px] text-purple-400 font-bold">{todo.dueDate}</span>
                        )}
                      </div>
                    </button>
                    {onOpenAlarm && (
                      <button
                        type="button"
                        onClick={() => onOpenAlarm(todo.text)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 transition cursor-pointer ml-2"
                        title="이 할 일을 알람으로 예약"
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </button>
                    )}
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
