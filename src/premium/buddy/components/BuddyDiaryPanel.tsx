import React, { useState, useEffect } from "react";
import { BookOpen, ChevronLeft, ChevronRight, MessageSquare, Calendar } from "lucide-react";
import { BUDDY_PERSONALITIES } from "../data/buddy-presets";

interface BuddyDiaryEntry {
  date: string;
  content: string;
  preset: string;
}

interface BuddyDiaryPanelProps {
  theme: any;
  t: (key: string, def: string) => string;
  onClose: () => void;
  onTriggerQuickQuestion?: (text: string) => void;
}

export function BuddyDiaryPanel({
  theme,
  t,
  onClose,
  onTriggerQuickQuestion
}: BuddyDiaryPanelProps) {
  const [diaries, setDiaries] = useState<BuddyDiaryEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toLocaleDateString("sv-SE")
  );

  // 로컬 스토리지에서 일기장 목록 로드
  useEffect(() => {
    chrome.storage.local.get(["buddy_diaries"], (res) => {
      setDiaries(res.buddy_diaries || []);
    });
  }, []);

  // 연도/월 계산
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 이전달/다음달 전환
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 달력 격자 일자 생성
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= lastDay; i++) {
    daysArray.push(i);
  }

  // 선택 날짜에 해당하는 일기
  const selectedDiary = diaries.find(d => d.date === selectedDateStr);

  // 감정(성격) 비율 집계 계산
  const getEmotionBreakdown = () => {
    if (diaries.length === 0) return [];
    const counts: Record<string, number> = {};
    diaries.forEach(d => {
      counts[d.preset] = (counts[d.preset] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([presetId, count]) => {
        const found = BUDDY_PERSONALITIES.find(p => p.id === presetId);
        const percent = Math.round((count / diaries.length) * 100);
        return {
          id: presetId,
          name: found ? t(found.nameKey, found.id) : presetId,
          emoji: found ? found.emoji : "📝",
          color: getPresetColor(presetId),
          percent,
          count
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  const getPresetColor = (preset: string) => {
    switch (preset) {
      case "motivator": return "bg-red-500";
      case "tsundere": return "bg-amber-500";
      case "genz": return "bg-pink-500";
      case "grandma": return "bg-green-500";
      case "conspiracy": return "bg-purple-500";
      case "zencat": return "bg-emerald-500";
      case "corporate": return "bg-indigo-500";
      case "aristocrat": return "bg-blue-500";
      case "bard": return "bg-yellow-500";
      default: return "bg-slate-500";
    }
  };

  const breakdown = getEmotionBreakdown();

  return (
    <div className={`flex flex-col h-full ${theme.bgSub || "bg-slate-950/40"} ${theme.textMain} p-4 overflow-y-auto custom-scrollbar space-y-4`}>
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <BookOpen size={15} className="text-purple-400" />
          Buddy's Diary
        </span>
      </div>

      {/* 1. 감정 분포 차트 영역 */}
      {diaries.length > 0 ? (
        <div className={`${theme.bgInput} border ${theme.borderMuted} p-3 rounded-xl select-none space-y-2`}>
          <div className="flex justify-between items-center">
            <span className={`text-[9px] font-bold ${theme.textSub} uppercase tracking-wider`}>Emotion Stats</span>
            <span className="text-[8.5px] font-black text-purple-400">{diaries.length} Diaries</span>
          </div>
          
          {/* 가로형 스택 차트 바 */}
          <div className={`w-full h-2.5 rounded-full ${theme.bgInput} flex overflow-hidden border ${theme.borderMuted}`}>
            {breakdown.map((item) => (
              <div
                key={item.id}
                className={`h-full ${item.color} transition-all`}
                style={{ width: `${item.percent}%` }}
                title={`${item.name}: ${item.percent}%`}
              />
            ))}
          </div>

          {/* 범례 리스트 */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
            {breakdown.slice(0, 4).map((item) => (
              <div key={item.id} className={`flex items-center gap-1 text-[8.5px] font-bold ${theme.textSub}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${item.color} shrink-0`} />
                <span className="truncate">{item.emoji} {item.name}</span>
                <span className="text-purple-400 font-extrabold ml-auto">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`${theme.bgInput} border border-dashed ${theme.borderMuted} p-4 rounded-xl text-center py-6 select-none`}>
          <Calendar size={20} className={`${theme.textSub} opacity-60 mx-auto mb-2`} />
          <p className={`text-[9px] ${theme.textSub} font-bold leading-normal`}>
            No diary entries found.<br />Talk to Buddy and request a diary entry!
          </p>
        </div>
      )}

      {/* 2. 미니 캘린더 */}
      <div className={`${theme.bgInput} border ${theme.borderMuted} p-3 rounded-xl select-none space-y-2`}>
        <div className="flex justify-between items-center">
          <span className={`text-[9.5px] font-black ${theme.textMain}`}>
            {year}. {(month + 1).toString().padStart(2, "0")}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              className={`p-1 rounded hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={handleNextMonth}
              className={`p-1 rounded hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* 요일 행 */}
        <div className={`grid grid-cols-7 gap-1 text-center text-[8px] font-bold ${theme.textSub} border-b ${theme.borderMuted} pb-1`}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* 일 격자 */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            const isToday = new Date().toLocaleDateString("sv-SE") === dateStr;
            const isSelected = selectedDateStr === dateStr;
            const diaryEntry = diaries.find(d => d.date === dateStr);

            // 해당 일지가 있을 경우 성격의 이모지를 대표 마커로 사용
            const matchedPersona = diaryEntry
              ? BUDDY_PERSONALITIES.find(p => p.id === diaryEntry.preset)
              : null;
            const markerEmoji = matchedPersona ? matchedPersona.emoji : null;

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all border text-[9px] ${
                  isSelected
                    ? "bg-purple-600/30 border-purple-500 text-purple-400 font-extrabold"
                    : isToday
                      ? `bg-purple-500/10 border-purple-500/50 ${theme.textMain} font-extrabold`
                      : `${theme.bgInput} ${theme.borderMuted} ${theme.textSub} hover:${theme.bgHover} hover:${theme.textMain}`
                }`}
              >
                <span>{day}</span>
                {markerEmoji && (
                  <span className="absolute bottom-0 text-[7.5px] leading-none mb-0.5">{markerEmoji}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 선택된 일기 상세 카드 */}
      <div className="space-y-2">
        <label className={`text-[9px] font-bold ${theme.textSub} uppercase tracking-wider block select-none`}>
          Selected Entry ({selectedDateStr})
        </label>
        {selectedDiary ? (
          <div className={`bg-gradient-to-br ${theme.bgInput} border ${theme.borderMuted} p-3 rounded-xl shadow-md space-y-2 text-left relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] select-none pointer-events-none">
              <BookOpen size={60} className={theme.textMain} />
            </div>
            
            <div className={`flex items-center gap-1.5 border-b ${theme.borderMuted} pb-1.5`}>
              <span className="text-[12px] leading-none">
                {BUDDY_PERSONALITIES.find(p => p.id === selectedDiary.preset)?.emoji || "📝"}
              </span>
              <span className={`text-[9.5px] font-black ${theme.textMain}`}>
                {BUDDY_PERSONALITIES.find(p => p.id === selectedDiary.preset)
                  ? t(BUDDY_PERSONALITIES.find(p => p.id === selectedDiary.preset)!.nameKey, selectedDiary.preset)
                  : selectedDiary.preset}
              </span>
              <span className={`text-[8.5px] font-bold ${theme.textSub} ml-auto`}>
                {selectedDiary.date}
              </span>
            </div>

            <p className={`text-[9.5px] ${theme.textMain} leading-relaxed whitespace-pre-wrap font-medium`}>
              {selectedDiary.content}
            </p>
          </div>
        ) : (
          <div className={`${theme.bgInput} border ${theme.borderMuted} p-4 rounded-xl text-center py-6 select-none`}>
            <MessageSquare size={16} className={`${theme.textSub} opacity-50 mx-auto mb-1.5`} />
            <p className={`text-[9px] ${theme.textSub} font-bold`}>
              No diary entry written for this day.
            </p>
          </div>
        )}
      </div>

      {/* 4. 오늘 일기 쓰기 요청 단축 버튼 */}
      <div className="pt-2 select-none">
        <button
          type="button"
          onClick={() => {
            onTriggerQuickQuestion?.("/buddy/write_diary");
            onClose();
          }}
          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black tracking-wide shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <BookOpen size={12} />
          Request Today's Diary
        </button>
      </div>
    </div>
  );
}
