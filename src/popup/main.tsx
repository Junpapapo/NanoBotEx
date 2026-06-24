import React from "react";
import ReactDOM from "react-dom/client";
import { useChromeStorage } from "../shared/hooks/useChromeStorage";
import { DEFAULT_SETTINGS } from "../shared/chatbot-constants";
import { UserSettings } from "../shared/chatbot-types";
import { Settings, Sparkles, MessageSquare } from "lucide-react";
import { I18nProvider, useTranslation } from "../shared/components/i18n/i18n-context";
import "../index.css";

function PopupContent({
  settings,
  setSettings
}: {
  settings: UserSettings;
  setSettings: (val: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
}) {
  const { t } = useTranslation();

  const handleOpenSidePanel = () => {
    chrome.runtime.sendMessage({ action: "open_sidepanel" }, (res) => {
      if (res?.success) window.close();
    });
  };

  const updateSettingField = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="w-[360px] bg-[#080e21] text-slate-100 p-5 font-sans border border-indigo-500/20 shadow-2xl rounded-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
        <span className="text-sm font-black flex items-center gap-2 text-indigo-400">
          <Sparkles className="h-4 w-4 animate-pulse" />
          NanoBot Control Panel
        </span>
      </div>

      {/* 기동 제어부 */}
      <div className="flex flex-col gap-2.5 mb-5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Launch Options</span>
        <button
          onClick={handleOpenSidePanel}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <MessageSquare className="h-4 w-4" />
          {t("popup.openSidepanel", "사이드패널 열기 (Open Sidepanel)")}
        </button>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.03]">
          <span className="text-xs font-semibold text-slate-300">
            {t("popup.floatingWidget", "웹페이지 플로팅 봇 기동")}
          </span>
          <button
            onClick={() => updateSettingField("nano_launcher_mode", settings.nano_launcher_mode === "widget" ? "sidepanel" : "widget")}
            className={`w-10 h-6 rounded-full p-1 transition cursor-pointer ${
              settings.nano_launcher_mode === "widget" ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 ${
                settings.nano_launcher_mode === "widget" ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 환경설정 제어부 */}
      <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5" /> Engine Settings
        </span>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-350">
            {t("popup.bypassApiMode", "Bypass API Mode (외부 LLM 연결)")}
          </span>
          <button
            onClick={() => updateSettingField("api_mode", settings.api_mode === "api" ? "local" : "api")}
            className={`w-10 h-6 rounded-full p-1 transition cursor-pointer ${
              settings.api_mode === "api" ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 ${
                settings.api_mode === "api" ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {settings.api_mode === "api" && (
          <div className="space-y-2.5 animate-in fade-in duration-300">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">API URL</label>
              <input
                type="text"
                value={settings.api_url}
                onChange={(e) => updateSettingField("api_url", e.target.value)}
                className="w-full bg-slate-950/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-500/50 text-white"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">API Key</label>
              <input
                type="password"
                value={settings.api_key || ""}
                onChange={(e) => updateSettingField("api_key", e.target.value)}
                className="w-full bg-slate-950/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-500/50 text-white"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">API Model</label>
              <input
                type="text"
                value={settings.api_model}
                onChange={(e) => updateSettingField("api_model", e.target.value)}
                className="w-full bg-slate-950/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-500/50 text-white"
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            {t("popup.systemPersona", "System Persona (프롬프트 지침)")}
          </label>
          <textarea
            value={settings.nano_ai_persona}
            onChange={(e) => updateSettingField("nano_ai_persona", e.target.value)}
            rows={3}
            className="w-full bg-slate-950/80 border border-white/5 rounded-lg py-1.5 px-3 text-[10px] focus:outline-none focus:border-indigo-500/50 text-white resize-none leading-relaxed custom-scrollbar"
            placeholder={t("popup.personaPlaceholder", "AI 행동 지침을 작성하세요...")}
          />
        </div>
      </div>
    </div>
  );
}

function PopupApp() {
  const [settings, setSettings] = useChromeStorage<UserSettings>("user_settings", DEFAULT_SETTINGS);

  return (
    <I18nProvider
      settings={settings}
      updateSettings={(newSettings) => setSettings((prev: UserSettings) => ({ ...prev, ...newSettings }))}
    >
      <PopupContent settings={settings} setSettings={setSettings} />
    </I18nProvider>
  );
}

const rootEl = document.getElementById("popup-root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <PopupApp />
    </React.StrictMode>
  );
}
