import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { useChromeStorage } from "../shared/hooks/useChromeStorage";
import { DEFAULT_SETTINGS, DEFAULT_SKILLS } from "../shared/chatbot-constants";
import { UserSettings, Skill } from "../shared/chatbot-types";
import { I18nProvider, useTranslation } from "../shared/components/i18n/i18n-context";
import { ChatbotView } from "../shared/components/ChatbotView";
import "../index.css";

function SidepanelApp({ 
  settings, 
  updateSettings, 
  isSettingsLoaded 
}: { 
  settings: UserSettings; 
  updateSettings: (s: Partial<UserSettings>) => void; 
  isSettingsLoaded: boolean; 
}) {
  const [skills] = useChromeStorage<Skill[]>("user_skills", DEFAULT_SKILLS);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const { t, locale } = useTranslation();

  return (
    <div className="w-full h-full overflow-hidden">
      <ChatbotView
        settings={settings}
        updateSettings={updateSettings}
        skills={skills}
        activeSkill={activeSkill}
        setActiveSkill={setActiveSkill}
        isSupported={true}
        effectiveAIAvatar={settings.nano_ai_avatar || "/nanobots/bot-default.png"}
        layoutMode="sidepanel"
        t={t}
        locale={locale}
        isSettingsLoaded={isSettingsLoaded}
      />
    </div>
  );
}

function Main() {
  const [settings, setSettings, isSettingsLoaded] = useChromeStorage<UserSettings>("user_settings", DEFAULT_SETTINGS);
  
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      ...newSettings
    }));
  };

  if (!isSettingsLoaded || !settings) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-screen bg-[#070b19]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <I18nProvider settings={settings} updateSettings={handleUpdateSettings} isSettingsLoaded={isSettingsLoaded}>
      <SidepanelApp 
        settings={settings} 
        updateSettings={handleUpdateSettings} 
        isSettingsLoaded={isSettingsLoaded} 
      />
    </I18nProvider>
  );
}

const rootEl = document.getElementById("sidepanel-root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <Main />
    </React.StrictMode>
  );
}
