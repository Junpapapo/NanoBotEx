import React, { useState } from "react";
import { Link2, Plus, Trash2, Edit3, Save, X } from "lucide-react";

export interface UserBookmark {
  id: number;
  iconName: string; // "emoji:📊" 등의 포맷
  title: string;
  url: string;
}

interface BookmarkBarProps {
  bookmarks: UserBookmark[];
  onSelectBookmark: (url: string) => void;
  onSaveBookmark: (bookmark: UserBookmark) => void;
  onDeleteBookmark: (id: number) => void;
  t: any;
}

export function BookmarkBar({
  bookmarks,
  onSelectBookmark,
  onSaveBookmark,
  onDeleteBookmark,
  t
}: BookmarkBarProps) {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [title, setTitle] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("⭐");

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle("");
    setUrl("https://");
    setEmoji("⭐");
    setShowForm(true);
  };

  const handleOpenEdit = (bm: UserBookmark, e: React.MouseEvent) => {
    e.stopPropagation(); // 북마크 이동 차단
    setEditingId(bm.id);
    setTitle(bm.title);
    setUrl(bm.url);
    setEmoji(bm.iconName.startsWith("emoji:") ? bm.iconName.substring(6) : bm.iconName);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title.trim() || !url.trim()) return;
    
    // URL 형식 보완
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    onSaveBookmark({
      id: editingId !== null ? editingId : (bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.id)) + 1 : 1),
      iconName: `emoji:${emoji}`,
      title: title.trim(),
      url: formattedUrl
    });

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteBookmark(id);
    if (editingId === id) {
      setShowForm(false);
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 max-h-[260px] overflow-y-auto custom-scrollbar select-none">
      
      {/* 타이틀 및 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
          <Link2 className="h-3 w-3" />
          <span>{t("menu.bookmarks", "즐겨찾기")}</span>
        </div>
        <button
          onClick={handleOpenAdd}
          className="p-1 rounded hover:bg-white/10 text-emerald-400 hover:text-emerald-300 cursor-pointer border-0 bg-transparent flex items-center justify-center transition"
          title={t("bookmarks.addNew", "새 즐겨찾기 추가")}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* 즐겨찾기 태그 리스트 */}
      <div className="flex flex-wrap gap-1.5">
        {bookmarks.map((bm) => {
          const displayEmoji = bm.iconName.startsWith("emoji:") ? bm.iconName.substring(6) : "⭐";
          return (
            <div
              key={bm.id}
              onClick={() => onSelectBookmark(bm.url)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/[0.03] hover:border-emerald-500/35 hover:bg-emerald-500/5 text-[10px] text-slate-300 font-semibold transition cursor-pointer group relative"
            >
              <span className="text-[12px]">{displayEmoji}</span>
              <span>{bm.title}</span>
              
              {/* 호버 시 나타나는 편집/삭제 조작계 */}
              <div className="hidden group-hover:flex items-center gap-1 ml-1 pl-1 border-l border-white/10">
                <button
                  onClick={(e) => handleOpenEdit(bm, e)}
                  className="text-slate-400 hover:text-indigo-400 cursor-pointer p-0 bg-transparent"
                  title={t("common.edit", "수정")}
                >
                  <Edit3 size={10} />
                </button>
                <button
                  onClick={(e) => handleDelete(bm.id, e)}
                  className="text-slate-400 hover:text-rose-400 cursor-pointer p-0 bg-transparent"
                  title={t("common.delete", "삭제")}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 인라인 추가/수정 폼 */}
      {showForm && (
        <div className="p-2.5 mt-1 bg-slate-950/60 border border-white/5 rounded-lg space-y-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>{editingId !== null ? t("bookmarks.modal.titleEdit", "즐겨찾기 수정") : t("bookmarks.addNew", "즐겨찾기 추가")}</span>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={11} /></button>
          </div>
          
          <div className="grid grid-cols-5 gap-1.5">
            {/* 이모지 입력 */}
            <input
              type="text"
              placeholder="이모지"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="col-span-1 text-center bg-slate-950 border border-white/5 rounded px-1.5 py-1 text-white outline-none focus:border-emerald-500/50"
            />
            {/* 제목 입력 */}
            <input
              type="text"
              placeholder={t("bookmarks.modal.namePlaceholder", "제목")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-4 bg-slate-950 border border-white/5 rounded px-2 py-1 text-white outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* URL 입력 */}
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-emerald-500/50 font-mono"
            />
            <button
              onClick={handleSave}
              disabled={!title.trim() || !url.trim()}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-40"
            >
              <Save size={10} />
              <span>{t("common.save", "저장")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
