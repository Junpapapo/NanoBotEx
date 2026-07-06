import React from "react";
import { GraduationCap } from "lucide-react";
import { UserSettings } from "../../chatbot-types";
import { getThemePalette } from "../../chatbot-constants";

interface TutorPanelProps {
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  onTriggerQuickQuestion: (text: string) => void;
  theme: any;
  t: any;
}

export function TutorPanel({
  settings,
  updateSettings,
  onTriggerQuickQuestion,
  theme,
  t
}: TutorPanelProps) {
  const isLight = settings.nano_skin_mode === "light";
  
  const learningLanguages = [
    { code: "en", name: t("tools.tutor.lang.en", "영어 (English)") },
    { code: "ko", name: t("tools.tutor.lang.ko", "한국어 (Korean)") },
    { code: "ja", name: t("tools.tutor.lang.ja", "일본어 (Japanese)") },
    { code: "zh", name: t("tools.tutor.lang.zh", "중국어 (Chinese)") },
    { code: "es", name: t("tools.tutor.lang.es", "스페인어 (Spanish)") },
    { code: "fr", name: t("tools.tutor.lang.fr", "프랑스어 (French)") },
    { code: "de", name: t("tools.tutor.lang.de", "독일어 (German)") },
    { code: "vi", name: t("tools.tutor.lang.vi", "베트남어 (Vietnamese)") }
  ];

  const levels = [
    { id: "kids", label: t("tools.tutor.level.kids", "어린이 (Kids)"), desc: t("tools.tutor.level.kidsDesc", "동화 느낌, 쉬운 단어, 친근한 이모지") },
    { id: "teens", label: t("tools.tutor.level.teens", "청소년 (Teens)"), desc: t("tools.tutor.level.teensDesc", "트렌디한 슬랭, 일상 취미 소통") },
    { id: "adult", label: t("tools.tutor.level.adult", "성인/비즈니스 (Business)"), desc: t("tools.tutor.level.adultDesc", "격식 회화, 격려와 지적 통찰력") }
  ];

  const currentLang = settings.tutor_lang || "en";
  const currentLevel = settings.tutor_level || "adult";
  const currentDiff = settings.tutor_difficulty || "intermediate";

  const difficulties = [
    { id: "beginner", label: t("tools.tutor.difficulty.beginner", "하 (Beginner)") },
    { id: "intermediate", label: t("tools.tutor.difficulty.intermediate", "중 (Intermediate)") },
    { id: "advanced", label: t("tools.tutor.difficulty.advanced", "상 (Advanced)") }
  ];

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <GraduationCap size={16} className="text-emerald-400" />
          {t("tools.tutor.title", "배움 튜터 (Lingo Tutor)")}
        </span>
      </div>

      <p className={`text-[10px] ${theme.textSub} leading-relaxed select-none`}>
        {t("tools.tutor.desc", "배우고 싶은 타겟 언어와 연령대를 설정하세요. AI 선생님이 친근한 어조로 수준에 딱 맞는 예문과 설명 카드를 매일 배달합니다.")}
      </p>

      {/* 설정 폼 블록 */}
      <div className={`flex flex-col gap-4 ${theme.bgSub} p-4 rounded-xl border ${theme.borderMuted}`}>
        {/* 언어 설정 */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[9px] ${theme.textSub} font-black uppercase tracking-wider block select-none`}>
            {t("tools.tutor.selectLang", "배우고 싶은 언어")}
          </label>
          <select
            value={currentLang}
            onChange={(e) => updateSettings({ tutor_lang: e.target.value })}
            className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg border focus:outline-none transition-all cursor-pointer ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 focus:border-emerald-400"
                : "bg-slate-900 border-white/[0.06] text-slate-200 focus:border-emerald-500"
            }`}
          >
            {learningLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* 수준/연령 설정 */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[9px] ${theme.textSub} font-black uppercase tracking-wider block select-none`}>
            {t("tools.tutor.selectLevel", "학습 연령 및 수준")}
          </label>
          <div className="flex flex-col gap-2">
            {levels.map((lvl) => {
              const active = currentLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => updateSettings({ tutor_level: lvl.id })}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    active
                      ? isLight
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold shadow-sm"
                        : "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-extrabold shadow-md"
                      : isLight
                        ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        : "bg-slate-900 border-white/[0.04] text-slate-400 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    {lvl.label}
                    {active && <span className="text-[10px] text-emerald-400">✓</span>}
                  </div>
                  <div className={`text-[9.5px] mt-0.5 font-medium ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    {lvl.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 난이도 설정 (상/중/하 세그먼트 버튼) */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[9px] ${theme.textSub} font-black uppercase tracking-wider block select-none`}>
            {t("tools.tutor.selectDifficulty", "학습 난이도")}
          </label>
          <div className={`grid grid-cols-3 gap-1 p-1 rounded-lg border ${
            isLight ? "bg-slate-100/80 border-slate-200" : "bg-slate-900 border-white/[0.04]"
          }`}>
            {difficulties.map((diff) => {
              const active = currentDiff === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => updateSettings({ tutor_difficulty: diff.id as any })}
                  className={`text-center py-1.5 px-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer select-none ${
                    active
                      ? isLight
                        ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                        : "bg-slate-850 text-emerald-400 shadow border border-emerald-500/20"
                      : isLight
                        ? "text-slate-500 hover:text-slate-700"
                        : "text-slate-400 hover:text-slate-350"
                  }`}
                >
                  {diff.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 배움 호출 버튼 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => onTriggerQuickQuestion("__LEARN_TODAY_REQUEST__")}
          className="w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-98
            bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 active:brightness-95
            flex items-center justify-center gap-1.5 border border-emerald-500/10"
        >
          <GraduationCap size={15} />
          {t("tools.tutor.requestButton", "오늘의 배움 한마디 받기 🎓")}
        </button>
      </div>
    </div>
  );
}
