import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { ThemePalette } from "../../../chatbot-constants";
import { UserSettings } from "../../../chatbot-types";
import { ALL_AVATARS, AvatarEntry } from "./avatar-list";

interface AvatarPickerProps {
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  theme: ThemePalette;
  t: any;
}

function DefaultBotSvg() {
  return (
    <svg width="60%" height="60%" viewBox="0 0 64 64" fill="none" className="text-indigo-400">
      <rect x="17" y="22" width="30" height="24" rx="9" fill="#0f172a" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="28" cy="31.5" r="2.5" fill="#38bdf8" />
      <circle cx="36" cy="31.5" r="2.5" fill="#38bdf8" />
    </svg>
  );
}

export function AvatarPicker({ settings, updateSettings, theme, t }: AvatarPickerProps) {
  const isLight = settings.nano_skin_mode === "light";
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const handleSelect = (path: string) => {
    updateSettings({ nano_ai_avatar: path });
  };

  const handleRandomToggle = () => {
    updateSettings({ nano_ai_random_avatar: !settings.nano_ai_random_avatar });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px] select-none">
          {t("settings.avatarTitle", "🤖 나노봇 아바타 선택")}
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRandomToggle}
            title={t("settings.randomTitle", "매 기동마다 랜덤 아바타")}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold transition-all cursor-pointer ${
              settings.nano_ai_random_avatar
                ? `${theme.bgMuted} ${theme.text} ${theme.border}`
                : isLight
                  ? "bg-white border-slate-200 text-slate-500 hover:text-slate-850 shadow-sm"
                  : "bg-slate-900 border-white/[0.06] text-slate-500 hover:text-slate-300"
            }`}
          >
            <Shuffle size={9} />
            {t("settings.random", "랜덤")}
          </button>
        </div>
      </div>

      <div className="relative group/slider">
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 ${
            isLight ? "bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850 shadow" : "bg-slate-950/95 hover:bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white"
          } border rounded flex items-center justify-center transition opacity-0 group-hover/slider:opacity-100 shadow-md cursor-pointer`}
        >
          <ChevronLeft size={13} />
        </button>

        <div
          ref={scrollRef}
          className={`grid grid-rows-2 grid-flow-col gap-2 ${
            isLight ? "bg-slate-150/50 border-slate-200/80" : "bg-slate-950/40 border-white/[0.04]"
          } p-2.5 rounded-xl border overflow-x-auto scroll-smooth`}
          style={{ maxHeight: "140px", scrollbarWidth: "none" }}
        >


          {ALL_AVATARS.map((av) => {
            const isSel = settings.nano_ai_avatar === av.path;
            return (
              <button
                key={av.path || "__svg__"}
                type="button"
                onClick={() => handleSelect(av.path)}
                className="flex flex-col items-center gap-1 p-1 rounded-lg transition outline-none shrink-0 cursor-pointer"
              >
                <div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                    isLight ? "bg-white" : "bg-slate-900"
                  } border overflow-hidden transition ${
                    isSel
                      ? `border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] scale-105`
                      : `${isLight ? "border-slate-200 hover:border-slate-350" : "border-white/[0.08] hover:border-white/[0.2]"} hover:scale-105`
                  }`}
                >
                  {av.path ? (
                    <img src={av.path} alt={av.name} className="w-full h-full object-cover" />
                  ) : (
                    <DefaultBotSvg />
                  )}
                  {isSel && (
                    <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                  )}
                </div>
                <span className={`text-[8px] font-bold truncate max-w-[42px] ${isSel ? `${theme.text}` : "text-slate-500"}`}>
                  {av.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleScroll("right")}
          className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 ${
            isLight ? "bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850 shadow" : "bg-slate-950/95 hover:bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white"
          } border rounded flex items-center justify-center transition opacity-0 group-hover/slider:opacity-100 shadow-md cursor-pointer`}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
