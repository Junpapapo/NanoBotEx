import React, { useState } from "react";
import { useChromeStorage } from "../shared/hooks/useChromeStorage";
import { DEFAULT_SETTINGS, DEFAULT_SKILLS } from "../shared/chatbot-constants";
import { UserSettings, Skill } from "../shared/chatbot-types";
import { I18nProvider, useTranslation } from "../shared/components/i18n/i18n-context";
import { ChatbotView } from "../shared/components/ChatbotView";
import { Sparkles } from "lucide-react";

export function ChatbotWidget() {
  const [settings, setSettings] = useChromeStorage<UserSettings>("user_settings", DEFAULT_SETTINGS);

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      ...newSettings
    }));
  };

  return (
    <I18nProvider settings={settings} updateSettings={handleUpdateSettings}>
      <WidgetContent settings={settings} updateSettings={handleUpdateSettings} />
    </I18nProvider>
  );
}

function WidgetContent({ settings, updateSettings }: { settings: UserSettings, updateSettings: (s: Partial<UserSettings>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [skills] = useChromeStorage<Skill[]>("user_skills", DEFAULT_SKILLS);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  
  const { t, locale } = useTranslation();

  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end gap-3 font-sans select-none text-slate-100">
      {/* 챗봇 대화창 오버레이 */}
      {isOpen && (
        <div 
          className="bg-[#080e21] rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ width: `${settings.nano_chat_width || 420}px`, height: `${settings.nano_chat_height || 580}px` }}
        >
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
      )}

      {/* 플로팅 기동 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all duration-200 cursor-pointer border-0"
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
        </button>
      )}

      {/* 닫기 버튼 */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="w-10 h-10 bg-slate-900/90 text-slate-300 hover:text-white border border-white/5 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-800 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
}
