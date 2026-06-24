import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { useChromeStorage } from "../shared/hooks/useChromeStorage";
import { DEFAULT_SETTINGS, DEFAULT_SKILLS } from "../shared/chatbot-constants";
import { UserSettings, Skill } from "../shared/chatbot-types";
import { I18nProvider, useTranslation } from "../shared/components/i18n/i18n-context";
import { ChatbotView } from "../shared/components/ChatbotView";
import "../index.css";

function SidepanelApp({ settings, updateSettings }: { settings: UserSettings, updateSettings: (s: Partial<UserSettings>) => void }) {
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
        effectiveAIAvatar="public/nanobots/bot-default.png"
        t={t}
        locale={locale}
      />
    </div>
  );
}

function Main() {
  const [settings, setSettings] = useChromeStorage<UserSettings>("user_settings", DEFAULT_SETTINGS);
  
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      ...newSettings
    }));
  };

  return (
    <I18nProvider settings={settings} updateSettings={handleUpdateSettings}>
      <SidepanelApp settings={settings} updateSettings={handleUpdateSettings} />
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
