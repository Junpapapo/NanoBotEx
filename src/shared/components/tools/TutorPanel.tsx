import React, { useState, useEffect } from "react";
import { GraduationCap, Volume2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  
  const [archiveList, setArchiveList] = useState<any[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // 스토리지에서 저장된 아카이브 목록 로드
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const loadArchive = () => {
        chrome.storage.local.get(["nanobot-tutor-archive"], (result) => {
          setArchiveList(result["nanobot-tutor-archive"] || []);
        });
      };
      
      loadArchive();
      
      // 스토리지 변경 감지하여 실시간 업데이트
      const listener = (changes: any, areaName: string) => {
        if (areaName === "local" && changes["nanobot-tutor-archive"]) {
          setArchiveList(changes["nanobot-tutor-archive"].newValue || []);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => {
        chrome.storage.onChanged.removeListener(listener);
      };
    }
  }, []);

  // 발음 재생 (TTS)
  const handlePlayTTS = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = settings.tutor_lang || "en";
    const langCodeMap: Record<string, string> = {
      en: "en-US",
      ko: "ko-KR",
      ja: "ja-JP",
      zh: "zh-CN",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      vi: "vi-VN"
    };
    utterance.lang = langCodeMap[lang] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // 아카이브 카드 개별 삭제
  const handleDeleteCard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const newList = archiveList.filter((item) => item.id !== id);
      chrome.storage.local.set({ "nanobot-tutor-archive": newList }, () => {
        setArchiveList(newList);
        if (expandedCardId === id) {
          setExpandedCardId(null);
        }
      });
    }
  };

  // 아코디언 토글
  const toggleExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };
  
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
  const currentTopic = settings.tutor_topic || "general";

  const topics = [
    { id: "general", label: t("tools.tutor.topic.general", "일상 회화 (Daily)") },
    { id: "travel", label: t("tools.tutor.topic.travel", "여행 및 생활 (Travel)") },
    { id: "business", label: t("tools.tutor.topic.business", "비즈니스 (Business)") },
    { id: "slang", label: t("tools.tutor.topic.slang", "슬랭 및 표현 (Slang)") },
    { id: "grammar", label: t("tools.tutor.topic.grammar", "패턴 및 문법 (Grammar)") }
  ];

  const difficulties = [
    { id: "beginner", label: t("tools.tutor.difficulty.beginner", "하 (Beginner)") },
    { id: "intermediate", label: t("tools.tutor.difficulty.intermediate", "중 (Intermediate)") },
    { id: "advanced", label: t("tools.tutor.difficulty.advanced", "상 (Advanced)") }
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent text-inherit p-4 min-h-0">
      {/* 헤더 (상단 고정) */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16 shrink-0`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <GraduationCap size={16} className="text-emerald-400" />
          {t("tools.tutor.title", "배움 튜터 (Lingo Tutor)")}
        </span>
      </div>

      {/* 스크롤 가능한 바디 컨테이너 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mt-3 space-y-4 pr-1 min-h-0 flex flex-col">
        <p className={`text-[10px] ${theme.textSub} leading-relaxed select-none shrink-0`}>
          {t("tools.tutor.desc", "배우고 싶은 타겟 언어와 연령대를 설정하세요. AI 선생님이 친근한 어조로 수준에 딱 맞는 예문과 설명 카드를 매일 배달합니다.")}
        </p>

        {/* 설정 폼 블록 (접이식 디자인 적용) */}
        <div className={`flex flex-col rounded-xl border ${theme.borderMuted} overflow-hidden shrink-0`}>
          {/* 접기/펴기 토글 헤더 */}
          <div 
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={`flex justify-between items-center p-3 cursor-pointer select-none border-b transition-all ${
              isLight 
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-emerald-800 font-bold" 
                : "bg-emerald-950/20 hover:bg-emerald-950/45 border-emerald-500/20 text-emerald-300 font-bold"
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider ${theme.textMain}`}>
              {t("tools.tutor.settingsTitle", "학습 조건 설정")}
            </span>
            <div className={theme.textSub}>
              {settingsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </div>

          {/* 바디 (접힘 상태 연동) */}
          {settingsExpanded && (
            <div className={`flex flex-col gap-4 p-4 ${isLight ? "bg-white" : "bg-slate-900/10"}`}>
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

              {/* 학습 주제 설정 */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[9px] ${theme.textSub} font-black uppercase tracking-wider block select-none`}>
                  {t("tools.tutor.selectTopic", "학습 주제")}
                </label>
                <select
                  value={currentTopic}
                  onChange={(e) => updateSettings({ tutor_topic: e.target.value })}
                  className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                    isLight
                      ? "bg-white border-slate-200 text-slate-700 focus:border-emerald-400"
                      : "bg-slate-900 border-white/[0.06] text-slate-200 focus:border-emerald-500"
                  }`}
                >
                  {topics.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.label}
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
          )}
        </div>

        {/* 배움 호출 버튼 */}
        <div className="pt-1 shrink-0">
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

        {/* 내 단어장 (Saved Expressions) 아카이브 영역 (남은 높이를 유동적으로 차지) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04] flex-1 min-h-[180px] pb-2">
          <div className="flex justify-between items-center px-1 select-none">
            <span className={`text-[10px] font-black uppercase tracking-wider ${theme.textSub}`}>
              {t("tools.tutor.archiveTitle", "내 단어장")} ({archiveList.length})
            </span>
          </div>

          {archiveList.length === 0 ? (
            <div className={`text-center py-6 border border-dashed rounded-xl ${theme.borderMuted} ${theme.textMuted} text-[10px] select-none flex-1 flex items-center justify-center`}>
              {t("tools.tutor.archiveEmpty", "저장된 배움 표현이 없습니다.")}
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
              {archiveList.map((item) => {
                const isExpanded = expandedCardId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleExpand(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col gap-2
                      ${isExpanded
                        ? isLight
                          ? "bg-slate-50 border-emerald-300 shadow-sm"
                          : "bg-slate-900/60 border-emerald-500/30 shadow-md"
                        : isLight
                          ? "bg-white border-slate-200 hover:bg-slate-50"
                          : "bg-slate-900/30 border-white/[0.04] hover:bg-white/[0.01]"
                      }`}
                  >
                    {/* 단어 요약 헤더 */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11.5px] font-serif font-black text-emerald-300 leading-snug break-words">
                          {item.sentence}
                        </span>
                        {!isExpanded && (
                          <span className={`text-[10px] ${theme.textSub} truncate`}>
                            {item.translation}
                          </span>
                        )}
                      </div>
                      
                      {/* 우측 퀵 버튼군 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handlePlayTTS(e, item.sentence)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all"
                          title={t("tools.tutor.ttsTitle", "발음 듣기")}
                        >
                          <Volume2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCard(e, item.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
                          title={t("tools.tutor.deleteBtn", "삭제")}
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="text-slate-500">
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                      </div>
                    </div>

                    {/* 아코디언 확장 영역 */}
                    {isExpanded && (
                      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-white/[0.04] text-[10px] text-slate-300 leading-relaxed">
                        {/* 발음 및 뜻 */}
                        <div className="flex flex-col gap-1">
                          {item.pronunciation && (
                            <div className="text-emerald-400 font-medium">
                              {item.pronunciation}
                            </div>
                          )}
                          <div className="font-semibold text-slate-350">
                            {item.translation}
                          </div>
                        </div>

                        {/* 단어 사전 */}
                        {item.vocabulary && item.vocabulary.length > 0 && (
                          <div className="flex flex-col gap-1 bg-black/10 p-2 rounded-lg border border-white/[0.02]">
                            {item.vocabulary.map((v: any, idx: number) => (
                              <div key={idx} className="flex gap-1.5 items-start">
                                <span className="font-bold text-emerald-400 font-mono shrink-0">{v.word}</span>
                                <span className="text-slate-450 shrink-0">:</span>
                                <span className="text-slate-400">{v.meaning}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 튜터의 세부 노트 */}
                        {item.tutor_note && (
                          <div className="p-2 rounded bg-slate-950/20 text-[9.5px] text-slate-400 whitespace-pre-line border border-white/[0.01]">
                            {item.tutor_note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
