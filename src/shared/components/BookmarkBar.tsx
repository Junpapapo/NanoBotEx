import React from "react";
import { Link2 } from "lucide-react";

interface UserBookmark {
  id: number;
  iconName: string;
  title: string;
  url: string;
}

interface BookmarkBarProps {
  bookmarks: UserBookmark[];
  onSelectBookmark: (url: string) => void;
  t: any;
}

export function BookmarkBar({ bookmarks, onSelectBookmark, t }: BookmarkBarProps) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 max-h-[150px] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
        <Link2 className="h-3 w-3" />
        <span>{t("menu.bookmarks", "즐겨찾기")}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bookmarks.map((bm) => (
          <button
            key={bm.id}
            onClick={() => onSelectBookmark(bm.url)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/[0.03] hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[10px] text-slate-300 font-semibold transition cursor-pointer"
          >
            <span className="text-[12px]">{bm.iconName.startsWith("emoji:") ? bm.iconName.substring(6) : "⭐"}</span>
            <span>{bm.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
