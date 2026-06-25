import React, { useState } from "react";
import { Settings } from "lucide-react";
import { UserSettings } from "../../chatbot-types";
import { THEME_PALETTES, getThemePalette } from "../../chatbot-constants";
import { EngineSettings } from "./settings-panel/EngineSettings";
import { PersonaPicker } from "./settings-panel/PersonaPicker";
import { DisplaySettings } from "./settings-panel/DisplaySettings";
import { AvatarPicker } from "./settings-panel/AvatarPicker";
import { DiagnosticsPanel } from "./DiagnosticsPanel";

interface SettingsPanelProps {
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  locale: string;
  setLocale: (l: string) => void;
  t: any;
}

export function SettingsPanel({
  settings,
  updateSettings,
  locale,
  setLocale,
  t
}: SettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ai" | "appearance" | "diagnostics" | "engine">("ai");
  const theme = getThemePalette(settings.nano_theme_color || "indigo", settings.nano_skin_mode || "dark");
  const isLight = settings.nano_skin_mode === "light";

  const languages = {
    ko: "한국어",
    en: "English",
    ja: "日本語"
  };

  const handleModeToggle = (mode: "local" | "api") => {
    updateSettings({ api_mode: mode });
  };

  const handleSkinToggle = (skin: "dark" | "light") => {
    updateSettings({ nano_skin_mode: skin });
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <Settings size={15} className="text-indigo-400" />
          {t("panel.titles.settings", "환경 설정")}
        </span>
      </div>

      {/* 상단 1열 공통 노출 영역 */}
      <div className={`grid grid-cols-2 gap-x-3 gap-y-3.5 ${theme.bgSub} p-3 rounded-xl border ${theme.borderMuted} select-none`}>
        {/* 아바타 이름 */}
        <div className="space-y-1">
          <label className={`text-[9px] ${theme.textSub} font-bold uppercase tracking-wider block`}>
            {t("panel.settings.botName", "봇 이름")}
          </label>
          <input
            type="text"
            value={settings.nano_ai_avatar_name ?? ""}
            onChange={(e) => updateSettings({ nano_ai_avatar_name: e.target.value })}
            className={`w-full ${theme.bgInput} border ${theme.borderMuted} ${theme.focusBorder} rounded-lg px-2 py-1 text-[10px] ${theme.textMain} outline-none font-medium h-[25px]`}
          />
        </div>

        {/* 실행엔진 모드 */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
            {t("panel.settings.engine", "실행 엔진")}
          </label>
          <div className={`grid grid-cols-2 p-0.5 rounded-lg border ${theme.borderMuted} ${theme.bgInput} select-none h-[25px]`}>
            <button
              type="button"
              onClick={() => {
                handleModeToggle("local");
                setActiveSubTab("ai");
              }}
              className={`rounded-md text-center font-extrabold transition-all text-[9px] cursor-pointer flex items-center justify-center h-full ${
                settings.api_mode === "local"
                  ? `${theme.primary} text-white shadow-sm`
                  : `${theme.textSub} hover:${theme.textMain}`
              }`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => {
                handleModeToggle("api");
                setActiveSubTab("ai");
              }}
              className={`rounded-md text-center font-extrabold transition-all text-[9px] cursor-pointer flex items-center justify-center h-full ${
                settings.api_mode === "api"
                  ? `${theme.primary} text-white shadow-sm`
                  : `${theme.textSub} hover:${theme.textMain}`
              }`}
            >
              API
            </button>
          </div>
        </div>

        {/* 화면 모드 (다크/라이트) */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
            {t("panel.settings.skinMode", "화면 모드")}
          </label>
          <div className={`grid grid-cols-2 p-0.5 rounded-lg border ${theme.borderMuted} ${theme.bgInput} select-none h-[25px]`}>
            <button
              type="button"
              onClick={() => handleSkinToggle("dark")}
              className={`rounded-md text-center font-extrabold transition-all text-[8.5px] cursor-pointer flex items-center justify-center gap-1 h-full ${
                settings.nano_skin_mode !== "light"
                  ? `${theme.primary} text-white shadow-sm`
                  : `${theme.textSub} hover:${theme.textMain}`
              }`}
            >
              🌙
            </button>
            <button
              type="button"
              onClick={() => handleSkinToggle("light")}
              className={`rounded-md text-center font-extrabold transition-all text-[8.5px] cursor-pointer flex items-center justify-center gap-1 h-full ${
                settings.nano_skin_mode === "light"
                  ? `${theme.primary} text-white shadow-sm`
                  : `${theme.textSub} hover:${theme.textMain}`
              }`}
            >
              ☀️
            </button>
          </div>
        </div>

        {/* 언어 설정 */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
            {t("settings.language", "언어")}
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className={`w-full text-[9px] font-extrabold px-1.5 rounded-lg border outline-none cursor-pointer transition-colors h-[25px] ${
              isLight
                ? "border-slate-200 bg-white text-slate-700 hover:border-indigo-500/50"
                : "border-white/[0.08] bg-slate-950 text-slate-200 hover:border-indigo-500/50"
            }`}
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code} className={isLight ? "bg-white text-slate-700" : "bg-slate-950 text-slate-350"}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 border-t border-white/[0.04] pt-2.5 mt-0.5">
          <div className="flex items-center gap-2 py-0.5 justify-center">
            {Object.entries(THEME_PALETTES).map(([key, val]) => {
              const isSelected = settings.nano_theme_color === key;
              return (
                <div key={key} className="relative group/color-chip">
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSettings({ nano_theme_color: key })}
                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 border ${
                      isSelected
                        ? (isLight ? "border-slate-800 bg-slate-100 shadow" : "border-white bg-slate-900 shadow")
                        : (isLight ? "border-slate-200 bg-white hover:border-slate-350 shadow-sm" : "border-white/[0.08] bg-slate-950 hover:border-white/[0.2] shadow-sm")
                    }`}
                    title={val.name}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full block shadow-inner" 
                      style={{ backgroundColor: val.colorCode }}
                    />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-slate-950/95 border border-white/[0.08] text-[8px] text-white opacity-0 pointer-events-none group-hover/color-chip:opacity-100 transition-all duration-200 whitespace-nowrap z-[1000] shadow-md font-bold">
                    {val.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 서브 탭 바 */}
      <div className="flex border-b border-white/[0.06] pb-1 gap-4 select-none font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab("ai")}
          className={`text-[10px] font-extrabold pb-1 border-b-2 cursor-pointer transition-all ${
            activeSubTab === "ai"
              ? `${theme.text} ${theme.border}`
              : "text-slate-500 border-transparent hover:text-slate-300"
          }`}
        >
          {t("panel.settings.tabAi", "AI 설정")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("appearance")}
          className={`text-[10px] font-extrabold pb-1 border-b-2 cursor-pointer transition-all ${
            activeSubTab === "appearance"
              ? `${theme.text} ${theme.border}`
              : "text-slate-500 border-transparent hover:text-slate-300"
          }`}
        >
          {t("panel.settings.tabAppearance", "화면 스타일")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("diagnostics")}
          className={`text-[10px] font-extrabold pb-1 border-b-2 cursor-pointer transition-all ${
            activeSubTab === "diagnostics"
              ? `${theme.text} ${theme.border}`
              : "text-slate-500 border-transparent hover:text-slate-300"
          }`}
        >
          {t("panel.settings.tabDiagnostics", "환경 진단")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("engine")}
          className={`text-[10px] font-extrabold pb-1 border-b-2 cursor-pointer transition-all ${
            activeSubTab === "engine"
              ? `${theme.text} ${theme.border}`
              : "text-slate-500 border-transparent hover:text-slate-300"
          }`}
        >
          {t("panel.settings.tabEngine", "엔진 설정")}
        </button>
      </div>

      {/* 서브 탭 콘텐츠 */}
      <div className="space-y-4 flex-1">
        {activeSubTab === "ai" && (
          <div className="space-y-4">
            <EngineSettings theme={theme} settings={settings} updateSettings={updateSettings} t={t} hideModeSelect />
            <div className="h-px bg-white/[0.05]" />
            <PersonaPicker theme={theme} settings={settings} updateSettings={updateSettings} t={t} />
            <div className="h-px bg-white/[0.05]" />
            <DisplaySettings theme={theme} settings={settings} updateSettings={updateSettings} t={t} showTempOnly />
          </div>
        )}

        {activeSubTab === "appearance" && (
          <div className="space-y-4">
            <AvatarPicker theme={theme} settings={settings} updateSettings={updateSettings} t={t} />
            <div className="h-px bg-white/[0.05]" />
            <DisplaySettings theme={theme} settings={settings} updateSettings={updateSettings} t={t} showAppearanceOnly />
          </div>
        )}

        {activeSubTab === "diagnostics" && (
          <DiagnosticsPanel theme={theme} t={t} />
        )}

        {activeSubTab === "engine" && (
          <div className="space-y-4">
            {/* Bypass API Mode 토글 */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} select-none`}>
              <div className="space-y-0.5">
                <span className={`text-[11px] font-black ${theme.textMain}`}>
                  {t("popup.bypassApiMode", "Bypass API Mode (외부 LLM 연결)")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ api_mode: settings.api_mode === "api" ? "local" : "api" })}
                className={`w-10 h-6 rounded-full p-0.5 transition cursor-pointer flex items-center ${
                  settings.api_mode === "api" ? "bg-indigo-650" : "bg-slate-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    settings.api_mode === "api" ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* API Mode 시 API 상세 설정 */}
            {settings.api_mode === "api" && (
              <div className={`p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} space-y-3`}>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block">API URL</label>
                  <input
                    type="text"
                    value={settings.api_url || ""}
                    onChange={(e) => updateSettings({ api_url: e.target.value })}
                    className={`w-full ${theme.bgInput} border ${theme.borderMuted} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[10px] ${theme.textMain}`}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block">API Key</label>
                  <input
                    type="password"
                    value={settings.api_key || ""}
                    onChange={(e) => updateSettings({ api_key: e.target.value })}
                    className={`w-full ${theme.bgInput} border ${theme.borderMuted} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[10px] ${theme.textMain}`}
                    placeholder="sk-..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block">API Model</label>
                  <input
                    type="text"
                    value={settings.api_model || ""}
                    onChange={(e) => updateSettings({ api_model: e.target.value })}
                    className={`w-full ${theme.bgInput} border ${theme.borderMuted} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[10px] ${theme.textMain}`}
                    placeholder="gpt-4o-mini"
                  />
                </div>
              </div>
            )}

            {/* System Persona 설정 */}
            <div className={`p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} space-y-2`}>
              <label className="text-[9px] font-bold text-slate-400 block">
                {t("popup.systemPersona", "System Persona (프롬프트 지침)")}
              </label>
              <textarea
                value={settings.nano_ai_persona || ""}
                onChange={(e) => updateSettings({ nano_ai_persona: e.target.value })}
                rows={4}
                className={`w-full ${theme.bgInput} border ${theme.borderMuted} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none text-[10px] ${theme.textMain} resize-none leading-relaxed custom-scrollbar`}
                placeholder={t("popup.personaPlaceholder", "AI 행동 지침을 작성하세요...")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

