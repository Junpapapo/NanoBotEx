import React from "react";
import { UserSettings } from "../../../chatbot-types";
import { ThemePalette, THEME_PALETTES } from "../../../chatbot-constants";

interface DisplaySettingsProps {
  theme: ThemePalette;
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  t: any;
  isSupported?: boolean;
  showTempOnly?: boolean;
  showAppearanceOnly?: boolean;
}

export function DisplaySettings({
  theme,
  settings,
  updateSettings,
  t,
  isSupported = true,
  showTempOnly,
  showAppearanceOnly
}: DisplaySettingsProps) {
  const isLight = settings.nano_skin_mode === "light";

  const getTempLabel = (temp: number) => {
    if (temp <= 0.3) return t("settings.tempConservative", "보수적");
    if (temp <= 0.7) return t("settings.tempBalanced", "균형적");
    return t("settings.tempCreative", "창의적");
  };

  return (
    <div className="space-y-4">
      {/* 1. AI 탭용: 창의성 */}
      {showTempOnly && (
        <div className="space-y-4">
          <div className="space-y-2 select-none">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                {t("settings.temperature", "답변 창의성 (TEMPERATURE: {temp})").replace("{temp}", settings.nano_ai_temperature.toFixed(1))}
              </label>
              <span className={`text-[10px] font-extrabold ${theme.text}`}>
                {getTempLabel(settings.nano_ai_temperature)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={settings.nano_ai_temperature}
                onChange={(e) => updateSettings({ nano_ai_temperature: parseFloat(e.target.value) })}
                className={`flex-1 h-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. 외관 탭용: 환경 강제 활성화 */}
      {showAppearanceOnly && !isSupported && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl select-none">
            <div>
              <h6 className="font-bold text-amber-400 text-[10px]">{t("settings.bypassTitle", "환경 강제 활성화")}</h6>
              <p className="text-[8.5px] text-slate-400 mt-0.5">{t("settings.bypassDesc", "내장 AI 검출 실패 시에도 위젯을 강제 기동합니다.")}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.nano_ai_bypass}
              onChange={(e) => updateSettings({ nano_ai_bypass: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
