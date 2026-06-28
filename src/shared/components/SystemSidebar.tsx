import React from "react";
import { 
  Activity, 
  HelpCircle, 
  Eraser, 
  RotateCcw, 
  Scroll, 
  Cpu, 
  Link2,
  ChevronRight,
  Settings,
  Home,
  Languages,
  Globe,
  Calculator,
  CheckSquare,
  FileText,
  ListChecks,
  SpellCheck,
  Mail,
  Lightbulb,
  History,
  MessageSquare,
  MessageSquareOff,
  SlidersHorizontal,
  BookOpen
} from "lucide-react";
import { UserSettings, ScenarioType, BuddySettings } from "../chatbot-types";
import { ENABLE_PREMIUM } from "../../premium/premium-config";

export type PanelType = 
  | "none" 
  | "history" 
  | "memo" 
  | "guide" 
  | "translator" 
  | "exchange" 
  | "calculator" 
  | "diagnostics" 
  | "settings" 
  | "bot-settings"
  | "buddy-settings"
  | "buddy-diary";

interface SystemSidebarProps {
  activePanel: PanelType;
  setActivePanel: (tab: PanelType) => void;
  onClearContext: () => void;
  onResetConversation: () => void;
  isSending: boolean;
  isPromptsBarOpen: boolean;
  setIsPromptsBarOpen: (open: boolean) => void;
  isBookmarksBarOpen: boolean;
  setIsBookmarksBarOpen: (open: boolean) => void;
  theme: any;
  setCopiedPrompt: (prompt: string) => void;
  t: any;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  activeMode: "bot" | "buddy";
  onModeChange: (mode: "bot" | "buddy") => void;
  buddySettings: BuddySettings | null;
  onTriggerQuickMenu?: () => void;
  onTriggerQuickQuestion?: (text: string) => void;
}

export function SystemSidebar({
  activePanel,
  setActivePanel,
  onClearContext,
  onResetConversation,
  isSending,
  isPromptsBarOpen,
  setIsPromptsBarOpen,
  isBookmarksBarOpen,
  setIsBookmarksBarOpen,
  theme,
  setCopiedPrompt,
  t,
  settings,
  updateSettings,
  activeMode,
  onModeChange,
  buddySettings,
  onTriggerQuickMenu,
  onTriggerQuickQuestion
}: SystemSidebarProps) {
  const isLight = settings.nano_skin_mode === "light";

  const btnMutedClass = isLight
    ? `bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm ${theme.bookmarksHover}`
    : `bg-slate-900 border-white/[0.06] text-slate-400 hover:text-white hover:bg-slate-800 ${theme.bookmarksHover}`;

  const handleTabToggle = (tab: PanelType) => {
    setActivePanel(activePanel === tab ? "none" : tab);
  };



  return (
    <div className={`w-[80px] h-full ${theme.bgSub} flex flex-col items-center py-4 select-none overflow-x-hidden overflow-y-auto custom-scrollbar border-l ${theme.borderMuted} flex-shrink-0 relative z-[10]`}>
      
      {/* 1. SYSTEM 섹션 */}
      <div className="flex items-center gap-1.5 w-full px-2 mt-1 mb-2.5 shrink-0">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-500/20" />
        <span className="text-[8px] font-black text-slate-400/90 tracking-widest uppercase select-none">SYSTEM</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-500/20" />
      </div>
      
      <div className="grid grid-cols-2 gap-2 w-full px-2 justify-items-center shrink-0">
        {/* 환경 진단 */}
        <button
          type="button"
          onClick={() => handleTabToggle("diagnostics")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
            activePanel === "diagnostics"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.diagnostics", "환경 진단")}
        >
          <Activity size={12} />
        </button>

        {/* 가이드 */}
        <button
          type="button"
          onClick={() => handleTabToggle("guide")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
            activePanel === "guide"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.guide", "사용 가이드")}
        >
          <HelpCircle size={12} />
        </button>

        {/* 기억 클리어 */}
        <button
          type="button"
          onClick={onClearContext}
          disabled={isSending || activeMode === "buddy"}
          className={`w-7 h-7 rounded-lg border ${btnMutedClass} text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed`}
          title={activeMode === "buddy" ? t("sidebar.tooltips.clearContextDisabled", "버디 모드에서는 메인 봇 기억 클리어가 제한됩니다") : t("sidebar.tooltips.clearContext", "기억 클리어")}
        >
          <Eraser size={12} />
        </button>

        {/* 전체 리셋 */}
        <button
          type="button"
          onClick={onResetConversation}
          disabled={isSending || activeMode === "buddy"}
          className={`w-7 h-7 rounded-lg border ${
            isLight
              ? "bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
              : "bg-slate-950 border border-white/[0.06] hover:border-rose-500/50 hover:bg-slate-800 text-slate-400 hover:text-rose-400"
          } flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed`}
          title={activeMode === "buddy" ? t("sidebar.tooltips.resetChatDisabled", "버디 모드에서는 메인 봇 대화 리셋이 제한됩니다") : t("sidebar.tooltips.resetChat", "대화 리셋")}
        >
          <RotateCcw size={12} />
        </button>

        {/* 봇 지침 규칙 설정 */}
        <button
          type="button"
          onClick={() => handleTabToggle("bot-settings")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
            activePanel === "bot-settings"
              ? `${theme.scrollGlow || "bg-indigo-500/20 text-indigo-400 border-indigo-500/35"} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.botSettings", "지침 규칙 설정")}
        >
          <Scroll size={12} />
        </button>

        {/* 시스템 세팅 */}
        <button
          type="button"
          onClick={() => handleTabToggle("settings")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
            activePanel === "settings"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.settings", "환경 설정")}
        >
          <Settings size={12} />
        </button>


      </div>



      {/* 4. TOOL 섹션 */}
      <div className="flex items-center gap-1.5 w-full px-2 mt-4 mb-2.5 shrink-0">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-500/20" />
        <span className="text-[8px] font-black text-slate-400/90 tracking-widest uppercase select-none">TOOL</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-500/20" />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 w-full px-2 justify-items-center shrink-0">
        
        {/* 번역기 */}
        <button
          type="button"
          onClick={() => handleTabToggle("translator")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${
            activePanel === "translator"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.translator", "AI 번역기")}
        >
          <Languages size={12} />
        </button>

        {/* 환율 계산 */}
        <button
          type="button"
          onClick={() => handleTabToggle("exchange")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${
            activePanel === "exchange"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.exchange", "실시간 환율")}
        >
          <Globe size={12} />
        </button>

        {/* 계산기 */}
        <button
          type="button"
          onClick={() => handleTabToggle("calculator")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${
            activePanel === "calculator"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.calculator", "스마트 계산기")}
        >
          <Calculator size={12} />
        </button>

        {/* 메모장 */}
        <button
          type="button"
          onClick={() => handleTabToggle("memo")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${
            activePanel === "memo"
              ? `${theme.bgMuted} ${theme.text} ${theme.border} ${theme.shadow}`
              : btnMutedClass
          }`}
          title={t("sidebar.tooltips.memo", "메모장")}
        >
          <CheckSquare size={12} />
        </button>
      </div>

      {/* 5. PROMPT 섹션 */}
      <div className="flex items-center gap-1.5 w-full px-2 mt-4 mb-2.5 shrink-0">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-500/20" />
        <span className="text-[8px] font-black text-slate-400/90 tracking-widest uppercase select-none">PROMPT</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-500/20" />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 w-full px-2 justify-items-center shrink-0">
        {/* 프롬프트 스킬 카피 버튼 6종 */}
        <button
          type="button"
          onClick={() => setCopiedPrompt("[Summarize] Please summarize the following text to make it easy to read at a glance:\n\n")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${btnMutedClass}`}
          title={t("sidebar.tooltips.textSummary", "텍스트 요약")}
        >
          <FileText size={11} />
        </button>

        <button
          type="button"
          onClick={() => setCopiedPrompt("[Key Points] Please summarize the key 3 points of the following text:\n\n")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${btnMutedClass}`}
          title={t("sidebar.tooltips.keyPoints", "핵심요약")}
        >
          <ListChecks size={11} />
        </button>

        <button
          type="button"
          onClick={() => setCopiedPrompt("[Grammar Correction] Please correct any spelling, spacing, and grammatical errors in the following text:\n\n")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${btnMutedClass}`}
          title={t("sidebar.tooltips.grammarCheck", "맞춤법 교정")}
        >
          <SpellCheck size={11} />
        </button>

        <button
          type="button"
          onClick={() => setCopiedPrompt("[Business Tone] Please rewrite the following text into a formal and polite business email/message tone:\n\n")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${btnMutedClass}`}
          title={t("sidebar.tooltips.businessTone", "비즈니스 어조")}
        >
          <Mail size={11} />
        </button>

        <button
          type="button"
          onClick={() => setCopiedPrompt("[Explain Details] Please explain the meaning and detailed operation process of the following text or code in a friendly manner:\n\n")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${btnMutedClass}`}
          title={t("sidebar.tooltips.detailedExplain", "상세 설명")}
        >
          <HelpCircle size={11} />
        </button>

        <button
          type="button"
          onClick={() => setCopiedPrompt("[Brainstorming] Please brainstorm 5 creative and useful ideas for the following topic:\n\n")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm cursor-pointer transition-all ${btnMutedClass}`}
          title={t("sidebar.tooltips.brainstorming", "아이디어 발상")}
        >
          <Lightbulb size={11} />
        </button>
      </div>

      {/* 맨 밑 토글바 버튼 영역 */}
      <div className="flex flex-col items-center gap-2 w-full px-2 shrink-0 mt-auto pb-2 pt-4">
        {/* 프리미엄 봇/버디 스위치 */}
        {ENABLE_PREMIUM && buddySettings?.buddy_initialized && (
          <div className="flex flex-col gap-3.5 items-center w-full px-1.5 mb-3.5 shrink-0 select-none">
            {/* 1. 메인 봇 아바타 */}
            <div className="flex flex-col items-center gap-0.5 w-full">
              <button
                onClick={() => onModeChange("bot")}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activeMode === "bot"
                    ? "border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] scale-105"
                    : "border-transparent opacity-50 hover:opacity-90"
                }`}
                title={t("sidebar.switch.bot", "일반 나노봇 모드")}
              >
                <img src={settings.nano_ai_avatar} className="w-full h-full object-cover" />
              </button>
              <span
                className={`text-[8.5px] font-black text-center truncate max-w-[68px] ${
                  activeMode === "bot" ? "text-indigo-400" : "text-slate-500"
                }`}
              >
                {settings.nano_ai_avatar_name || "NanoBot"}
              </span>
            </div>
            
            {/* 2. 버디 아바타 */}
            <div className="flex flex-col items-center gap-0.5 w-full">
              <button
                onClick={() => onModeChange("buddy")}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activeMode === "buddy"
                    ? "border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] scale-105"
                    : "border-transparent opacity-50 hover:opacity-90"
                }`}
                title={t("sidebar.switch.buddy", "프라이빗 버디 모드")}
              >
                <img src={buddySettings.buddy_avatar} className="w-full h-full object-cover" />
              </button>
              <span
                className={`text-[8.5px] font-black text-center truncate max-w-[68px] ${
                  activeMode === "buddy" ? "text-purple-400" : "text-slate-500"
                }`}
              >
                {buddySettings.buddy_name || "Buddy"}
              </span>
              {activeMode === "buddy" && onTriggerQuickMenu && (
                <button
                  type="button"
                  onClick={onTriggerQuickMenu}
                  className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-sm w-12 text-center"
                >
                  Quick
                </button>
              )}
              {/* Quick 아래 2그리드: 왜쪽 빈 플레이스홀더, 오른쪽 버디 세부설정 */}
              {activeMode === "buddy" && (
                <div className="grid grid-cols-2 gap-1.5 w-full justify-items-center shrink-0 mt-1.5">
                  {/* 왼쪽: 버디 일기장 아이콘 */}
                  <button
                    type="button"
                    onClick={() => setActivePanel(activePanel === "buddy-diary" ? "none" : "buddy-diary")}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm border ${btnMutedClass}`}
                    title="버디 일기장"
                  >
                    <BookOpen size={10} />
                  </button>
                  {/* 오른쪽: 버디 세부설정 아이콘 */}
                  <button
                    type="button"
                    onClick={() => handleTabToggle("buddy-settings")}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
                      activePanel === "buddy-settings"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/35"
                        : btnMutedClass
                    }`}
                    title="버디 세부 설정"
                  >
                    <SlidersHorizontal size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 답변 길이 조절 3단 슬라이더 */}
        <div className="w-full flex flex-col items-center gap-1 mb-2 shrink-0">
          <span className="text-[7.5px] font-bold text-slate-500 tracking-wider">
            {t("common.sidebarLength", "답변 길이")} ({settings.nano_ai_context_level === "minimal" ? "S" : settings.nano_ai_context_level === "detailed" ? "L" : "M"})
          </span>
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={
              settings.nano_ai_context_level === "minimal" 
                ? 0 
                : settings.nano_ai_context_level === "detailed" 
                  ? 2 
                  : 1
            }
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              const levels: ("minimal" | "standard" | "detailed")[] = ["minimal", "standard", "detailed"];
              updateSettings({ nano_ai_context_level: levels[idx] });
            }}
            className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500"
            style={{ outline: "none" }}
          />
        </div>

        <div className="flex gap-2 w-full justify-center">
          {/* 스킬 목록 토글 */}
          <button 
            type="button" 
            onClick={() => setIsPromptsBarOpen(!isPromptsBarOpen)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm cursor-pointer transition-all border ${
              isPromptsBarOpen
                ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_8px_rgba(244,63,94,0.65)]"
                : isLight
                  ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 hover:border-rose-300"
                  : "bg-rose-950/20 border border-rose-500/40 text-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.35)] hover:bg-rose-950/40 hover:border-rose-400"
            }`}
            title={t("sidebar.tooltips.toggleSkills", "스킬바 토글")}
          >
            <Link2 size={12} />
          </button>

          {/* 북마크 바 토글 */}
          <button 
            type="button" 
            onClick={() => setIsBookmarksBarOpen(!isBookmarksBarOpen)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm cursor-pointer transition-all border ${
              isBookmarksBarOpen
                ? `${theme.primary} ${theme.border} text-white ${theme.shadow}`
                : `${theme.bgMuted} ${theme.border} ${theme.text} ${theme.shadow} ${theme.bgHover} ${theme.bookmarksHover}`
            }`}
            title={t("sidebar.tooltips.toggleBookmarks", "북마크바 토글")}
          >
            <Home size={12} />
          </button>
        </div>

        {/* 히스토리 바 토글 */}
        <button 
          type="button" 
          onClick={() => handleTabToggle("history")}
          className={`w-[60px] h-7 rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-all border text-[9.5px] font-black ${
            activePanel === "history"
              ? "bg-indigo-650 border-indigo-400 text-white shadow-[0_0_8px_rgba(99,102,241,0.65)]"
              : isLight
                ? `bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 ${theme.bookmarksHover}`
                : `bg-indigo-950/20 border border-indigo-500/40 text-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.35)] hover:bg-indigo-950/40 hover:border-indigo-400 ${theme.bookmarksHover}`
          }`}
          title={t("sidebar.tooltips.toggleHistory", "대화 기록 토글")}
        >
          <History size={11} />
          <span>History</span>
        </button>
      </div>
    </div>
  );
}
