import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plus, ChevronRight, ChevronLeft, Settings } from "lucide-react";
import ShortcutIcon from "./ShortcutIcon";
import { UserSettings } from "../chatbot-types";

export interface UserBookmark {
  id: number;
  iconName: string;
  title: string;
  url: string;
}

interface BookmarksSidebarProps {
  bookmarks: UserBookmark[];
  isBookmarksBarOpen: boolean;
  isBookmarksExpanded: boolean;
  setIsBookmarksExpanded: (expanded: boolean) => void;
  setEditingBookmark: (bookmark: UserBookmark | null) => void;
  setShowBookmarkIconPicker: (show: boolean) => void;
  theme: any;
  settings: UserSettings;
  t: any;
}

export function BookmarksSidebar({
  bookmarks,
  isBookmarksBarOpen,
  isBookmarksExpanded,
  setIsBookmarksExpanded,
  setEditingBookmark,
  setShowBookmarkIconPicker,
  theme,
  settings,
  t
}: BookmarksSidebarProps) {
  const isLight = settings.nano_skin_mode === "light";

  const [mounted, setMounted] = useState(false);
  const [hoveredBookmark, setHoveredBookmark] = useState<UserBookmark | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, bookmark: UserBookmark) => {
    setHoveredBookmark(bookmark);
    const btnRect = e.currentTarget.getBoundingClientRect();
    const frame = document.getElementById("nanobot-chat-frame");
    if (frame) {
      const frameRect = frame.getBoundingClientRect();
      setTooltipPos({
        top: btnRect.top - frameRect.top + btnRect.height / 2,
        left: btnRect.left - frameRect.left - 8 // 8px 왼쪽 마진
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredBookmark(null);
    setTooltipPos(null);
  };

  if (!isBookmarksBarOpen) return null;

  const hoverBgClass = theme.primary.replace('bg-', 'hover:bg-');

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isBookmarksExpanded ? 180 : 64, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={`border-l ${
        isLight ? "border-slate-200/80 bg-slate-100/30" : "border-white/[0.06] bg-slate-950/40"
      } flex flex-col items-center py-4 px-1 flex-shrink-0 select-none z-[5] h-full`}
    >
      <div className="text-[8px] font-bold text-slate-500 tracking-wider uppercase mb-1 flex-shrink-0">
        {t("bookmarks.header", "즐겨찾기")}
      </div>
      
      <div className={`flex-1 w-full overflow-y-auto custom-scrollbar pr-0.5 mt-2 transition-all duration-300 ${
        isBookmarksExpanded 
          ? "grid grid-cols-2 gap-x-2 gap-y-3.5 p-1 items-start content-start" 
          : "flex flex-col items-center gap-3.5"
      }`}>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className={`relative group flex flex-col items-center ${isBookmarksExpanded ? "w-full" : ""}`}>
            <button
              onClick={() => window.open(bookmark.url, "_blank")}
              onMouseEnter={(e) => handleMouseEnter(e, bookmark)}
              onMouseLeave={handleMouseLeave}
              className={`w-8 h-8 rounded-xl ${
                isLight 
                  ? "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50" 
                  : "bg-slate-900 border-white/[0.06] text-slate-300 hover:text-white"
              } border flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${theme.bookmarksHover}`}
              title={bookmark.title}
            >
              <ShortcutIcon iconName={bookmark.iconName} size={15} />
            </button>

            {/* 호버 시 나타나는 편집 버튼 */}
            <button
              onClick={() => {
                setEditingBookmark(bookmark);
                setShowBookmarkIconPicker(false);
              }}
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/[0.1] shadow cursor-pointer z-10 ${hoverBgClass}`}
              title={t("bookmarks.edit", "편집")}
            >
              <Settings size={10} />
            </button>

            {isBookmarksExpanded && (
              <span className={`text-[8.5px] ${
                isLight ? "text-slate-600" : "text-slate-400"
              } font-extrabold mt-1 select-none truncate max-w-[76px] text-center leading-normal animate-in fade-in duration-300`}>
                {bookmark.title}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 하단 제어 버튼 영역 */}
      <div className={`mt-auto pt-3 border-t ${
        isLight ? "border-slate-200" : "border-white/[0.06]"
      } flex w-full justify-center shrink-0 ${
        isBookmarksExpanded ? "flex-row gap-2.5 px-1.5" : "flex-col items-center gap-2.5"
      }`}>
        <button
          onClick={() => {
            setEditingBookmark({
              id: bookmarks.length > 0 ? Math.max(...bookmarks.map((b) => b.id)) + 1 : 1,
              iconName: "Sparkles",
              title: "새 즐겨찾기",
              url: "https://",
            });
            setShowBookmarkIconPicker(false);
          }}
          className={`w-8 h-8 rounded-xl ${
            isLight
              ? "bg-white border-slate-300 border-dashed text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              : "bg-slate-900/60 border border-dashed border-slate-700 text-slate-500 hover:text-white"
          } flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${theme.bookmarksHover}`}
          title={t("bookmarks.addNew", "새 즐겨찾기 추가")}
        >
          <Plus size={14} />
        </button>

        <button
          onClick={() => setIsBookmarksExpanded(!isBookmarksExpanded)}
          className={`w-8 h-8 rounded-xl ${
            isLight
              ? "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              : "bg-slate-900 border border-white/[0.06] text-slate-400 hover:text-white"
          } border flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${theme.bookmarksHover}`}
          title={isBookmarksExpanded ? t("bookmarks.collapse", "접기") : t("bookmarks.expand", "펼치기")}
        >
          {isBookmarksExpanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      
      {mounted && hoveredBookmark && tooltipPos && (
        (() => {
          const frame = document.getElementById("nanobot-chat-frame");
          if (!frame) return null;
          return createPortal(
            <div 
              className={`absolute z-[9999] px-2.5 py-1.5 ${
                isLight 
                  ? "bg-white border-slate-200 text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.06)]" 
                  : "bg-[#090d1f]/95 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              } border text-[10px] rounded-lg pointer-events-none transition-all duration-150 whitespace-nowrap font-medium max-w-[240px] ${theme.border}`}
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: "translate(-100%, -50%)"
              }}
            >
              <div className={`font-bold mb-0.5 ${theme.text}`}>{`#${hoveredBookmark.id} ${hoveredBookmark.title}`}</div>
              <div className={`${isLight ? "text-slate-500" : "text-slate-400"} truncate text-[9px] max-w-[180px]`}>{hoveredBookmark.url}</div>
            </div>,
            frame
          );
        })()
      )}
    </motion.div>
  );
}
