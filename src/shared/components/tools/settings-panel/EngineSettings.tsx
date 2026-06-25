import React from "react";
import { UserSettings } from "../../../chatbot-types";
import { ThemePalette } from "../../../chatbot-constants";
import { motion, AnimatePresence } from "framer-motion";

interface EngineSettingsProps {
  theme: ThemePalette;
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  t: any;
  hideModeSelect?: boolean;
}

export function EngineSettings({
  theme,
  settings,
  updateSettings,
  t,
  hideModeSelect
}: EngineSettingsProps) {
  const isLight = settings.nano_skin_mode === "light";

  return (
    <div className="space-y-3">
      {/* AI 엔진 모드 선택 (hideModeSelect가 아닐 때만 렌더링) */}
      {!hideModeSelect && (
        <div className="space-y-1.5">
          <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px] select-none">
            {t("panel.settings.engine", "AI 실행 엔진 모드")}
          </label>
          <div className={`${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-950/40 border border-white/[0.06]"} p-1 rounded-xl select-none grid grid-cols-2 gap-2`}>
            <button
              type="button"
              onClick={() => updateSettings({ api_mode: "local" })}
              className={`py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all text-[10px] ${
                settings.api_mode === "local"
                  ? `${theme.primary} text-white shadow-md`
                  : isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"
              }`}
            >
              {t("panel.settings.localEngine", "온디바이스 (Local)")}
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ api_mode: "api" })}
              className={`py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all text-[10px] ${
                settings.api_mode === "api"
                  ? `${theme.primary} text-white shadow-md`
                  : isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"
              }`}
            >
              {t("panel.settings.apiEngine", "외부 API (Hybrid)")}
            </button>
          </div>
        </div>
      )}

      {/* API Key / URL / Model 및 하이브리드 폴백 설정 (API 모드 시에만 노출) */}
      {settings.api_mode === "api" && (
        <div className="space-y-3">
          {/* API 설정 박스 */}
          <div className={`${isLight ? "bg-slate-50 border border-slate-200/60" : "bg-slate-900/30 border border-white/[0.04]"} p-3 rounded-xl space-y-2.5`}>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[9px]">API Base URL</label>
              <input
                type="text"
                value={settings.api_url}
                onChange={(e) => updateSettings({ api_url: e.target.value })}
                className={`w-full ${isLight ? "bg-white border border-slate-200 text-slate-800" : "bg-slate-950 border border-white/[0.08] text-white"} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[10px]`}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[9px]">API Key</label>
              <input
                type="password"
                value={settings.api_key || ""}
                onChange={(e) => updateSettings({ api_key: e.target.value })}
                placeholder="sk-..."
                className={`w-full ${isLight ? "bg-white border border-slate-200 text-slate-800" : "bg-slate-950 border border-white/[0.08] text-white"} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[10px]`}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[9px]">Model ID</label>
              <input
                type="text"
                value={settings.api_model || ""}
                onChange={(e) => updateSettings({ api_model: e.target.value })}
                className={`w-full ${isLight ? "bg-white border border-slate-200 text-slate-800" : "bg-slate-950 border border-white/[0.08] text-white"} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[10px]`}
              />
            </div>
          </div>

          {/* 하이브리드 폴백 연동 설정 */}
          <div className={`${isLight ? "bg-slate-50 border border-slate-200/60" : "bg-slate-900/30 border border-white/[0.04]"} p-3 rounded-xl space-y-2.5`}>
            <div className="flex items-center justify-between select-none">
              <div className="space-y-0.5">
                <span className={`font-black text-[9.5px] ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                  {t("panel.settings.fallbackTitle", "온디바이스 폴백 연동")}
                </span>
                <p className="text-[8px] text-slate-500 leading-tight">
                  {t("panel.settings.fallbackDesc", "API 장애 시 로컬 AI 엔진으로 전환")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ nano_fallback_enabled: !settings.nano_fallback_enabled })}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                  settings.nano_fallback_enabled ? theme.primary : isLight ? "bg-slate-200" : "bg-slate-950"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    settings.nano_fallback_enabled ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {settings.nano_fallback_enabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden space-y-2.5 pt-2.5 border-t border-white/[0.04] text-[10px]"
                >
                  {/* 모델 및 용량 선택 */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 text-[8.5px]">
                      {t("panel.settings.fallbackModel", "폴백 엔진 모델 (다운로드 용량)")}
                    </label>
                    <select
                      value={settings.nano_fallback_model}
                      onChange={(e) => updateSettings({ nano_fallback_model: e.target.value })}
                      className={`w-full ${isLight ? "bg-white border border-slate-200 text-slate-800" : "bg-slate-950 border border-white/[0.08] text-white"} rounded-lg px-2.5 py-1.5 outline-none text-[9.5px] font-medium`}
                    >
                      <option value="Llama-3-8B-Web (4.3 GB)">Llama-3-8B-Web (4.3 GB)</option>
                      <option value="Gemma-2B (1.6 GB)">Gemma-2B (1.6 GB)</option>
                      <option value="Qwen-1.5B (1.1 GB)">Qwen-1.5B (1.1 GB)</option>
                      <option value="Phi-3-Mini (2.2 GB)">Phi-3-Mini (2.2 GB)</option>
                    </select>
                  </div>

                  {/* 저장 폴더 경로 */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 text-[8.5px]">
                      {t("panel.settings.fallbackPath", "모델 저장 폴더 경로")}
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={settings.nano_fallback_save_path}
                        onChange={(e) => updateSettings({ nano_fallback_save_path: e.target.value })}
                        placeholder={t("panel.settings.fallbackPathPlaceholder", "예: C:/NanoBot/models")}
                        className={`flex-1 ${isLight ? "bg-white border border-slate-200 text-slate-800" : "bg-slate-950 border border-white/[0.08] text-white"} ${theme.focusBorder} rounded-lg px-2.5 py-1.5 outline-none font-mono text-[9px]`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
