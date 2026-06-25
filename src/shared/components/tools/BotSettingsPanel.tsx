import React, { useState, useEffect } from "react";
import { Scroll, Save } from "lucide-react";

interface BotSettingsPanelProps {
  t: any;
  theme: any;
}

export function BotSettingsPanel({ t, theme }: BotSettingsPanelProps) {
  const [globalRules, setGlobalRules] = useState<string>("");
  const [generalRules, setGeneralRules] = useState<string>("");
  const [activeRuleTab, setActiveRuleTab] = useState<"global" | "general">("global");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // 로컬스토리지 규칙 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGlobal = localStorage.getItem("nano-ai-global-rules");
      const savedGeneral = localStorage.getItem("nano-ai-general-rules");
      
      const defaultGlobal = 
        "- Always use a polite and friendly tone in all replies.\n" +
        "- Do not distort or make up facts regarding real-time numbers or news data provided.\n" +
        "- When displaying money or numerical information, always use thousand separators (,) for better readability.";
      const defaultGeneral = 
        "- When answering general conversation or questions, communicate friendly but prioritize concise and clear answers.\n" +
        "- When answering about investment decisions or trading techniques, add a risk reminder message: \"Since investment responsibility lies with oneself, careful decision-making is required.\"\n" +
        "- When difficult financial/macroeconomic terms appear, mix in intuitive analogies to explain them easily.";

      let finalGlobal = savedGlobal !== null ? savedGlobal : defaultGlobal;
      if (savedGlobal !== null) {
        const isOldKoreanGlobal = 
          savedGlobal.includes("한국어") || 
          savedGlobal.includes("정중하고 친절한") || 
          savedGlobal.includes("팩트 정보를 왜곡");
        if (isOldKoreanGlobal) {
          finalGlobal = defaultGlobal;
          localStorage.setItem("nano-ai-global-rules", defaultGlobal);
        }
      } else {
        localStorage.setItem("nano-ai-global-rules", defaultGlobal);
      }

      let finalGeneral = savedGeneral !== null ? savedGeneral : defaultGeneral;
      if (savedGeneral !== null) {
        const isOldKoreanGeneral = 
          savedGeneral.includes("일반 대화나 질문") || 
          savedGeneral.includes("투자 판단이나 매매") || 
          savedGeneral.includes("리스크 환기");
        if (isOldKoreanGeneral) {
          finalGeneral = defaultGeneral;
          localStorage.setItem("nano-ai-general-rules", defaultGeneral);
        }
      } else {
        localStorage.setItem("nano-ai-general-rules", defaultGeneral);
      }

      setGlobalRules(finalGlobal);
      setGeneralRules(finalGeneral);
    }
  }, []);

  const handleSaveRules = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nano-ai-global-rules", globalRules);
      localStorage.setItem("nano-ai-general-rules", generalRules);
      
      // 즉시 세션 갱신을 위해 커스텀 이벤트 디스패치
      window.dispatchEvent(new CustomEvent("sync-bot-rules"));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <Scroll size={15} className="text-indigo-400" />
          {t("panel.titles.botSettings", "봇 지침 규칙 설정")}
        </span>
      </div>

      {/* 룰 선택 탭 헤더 */}
      <div className={`flex border-b ${theme.borderMuted} pb-1.5 gap-4 select-none font-bold`}>
        <button
          type="button"
          onClick={() => setActiveRuleTab("global")}
          className={`text-xs uppercase pb-1 border-b-2 cursor-pointer transition-all ${
            activeRuleTab === "global"
              ? `${theme.text} ${theme.border}`
              : `${theme.textSub} border-transparent hover:${theme.textMain}`
          }`}
        >
          {t("panel.botSettings.tabGlobal", "글로벌 지침")}
        </button>
        <button
          type="button"
          onClick={() => setActiveRuleTab("general")}
          className={`text-xs uppercase pb-1 border-b-2 cursor-pointer transition-all ${
            activeRuleTab === "general"
              ? `${theme.text} ${theme.border}`
              : `${theme.textSub} border-transparent hover:${theme.textMain}`
          }`}
        >
          {t("panel.botSettings.tabGeneral", "일반 대화 규칙")}
        </button>
      </div>

      {/* 입력 폼 영역 */}
      <div className="flex-1 min-h-[220px] flex flex-col">
        {activeRuleTab === "global" ? (
          <div className="flex-1 flex flex-col space-y-1.5 h-full">
            <label className={`text-[10px] font-bold ${theme.textSub} uppercase tracking-wider select-none`}>
              {t("panel.botSettings.globalLabel", "글로벌 AI 행동 지침")}
            </label>
            <textarea
              value={globalRules}
              onChange={(e) => setGlobalRules(e.target.value)}
              className={`flex-1 w-full ${theme.bgInput} border ${theme.borderMuted} text-xs ${theme.textMain} rounded-lg py-2.5 px-3 outline-none resize-none font-medium leading-relaxed custom-scrollbar min-h-[180px] ${theme.focusBorder}`}
              placeholder={t("panel.botSettings.globalPlaceholder", "모든 시나리오에서 반드시 준수해야 하는 공통 규칙입니다...")}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-1.5 h-full">
            <label className={`text-[10px] font-bold ${theme.textSub} uppercase tracking-wider select-none`}>
              {t("panel.botSettings.generalLabel", "일반 대화 지침")}
            </label>
            <textarea
              value={generalRules}
              onChange={(e) => setGeneralRules(e.target.value)}
              className={`flex-1 w-full ${theme.bgInput} border ${theme.borderMuted} text-xs ${theme.textMain} rounded-lg py-2.5 px-3 outline-none resize-none font-medium leading-relaxed custom-scrollbar min-h-[180px] ${theme.focusBorder}`}
              placeholder={t("panel.botSettings.generalPlaceholder", "RAG나 주식 시나리오가 아닐 때 적용할 소통 가이드라인입니다...")}
            />
          </div>
        )}
      </div>

      {/* 저장 버튼 및 피드백 */}
      <div className={`pt-3 border-t ${theme.borderMuted} flex items-center justify-between gap-3 shrink-0`}>
        {saveSuccess && (
          <span className="text-emerald-400 font-bold text-[10px] animate-pulse">
            {t("panel.botSettings.saveSynced", "규칙이 실시간 적용되었습니다!")}
          </span>
        )}
        <button
          type="button"
          onClick={handleSaveRules}
          className={`flex-1 py-2 rounded-lg ${theme.primary} text-white hover:opacity-95 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${theme.shadow}`}
        >
          <Save size={13} />
          {t("panel.botSettings.saveBtn", "저장 및 세션 적용")}
        </button>
      </div>
    </div>
  );
}
