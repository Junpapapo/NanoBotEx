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

const FONT_OPTIONS: { key: NonNullable<UserSettings["nano_chat_font"]>; label: string; sample: string; family: string }[] = [
  { key: "sans",  label: "Sans",  sample: "Aa",  family: "ui-sans-serif, system-ui, sans-serif" },
  { key: "inter", label: "Inter", sample: "Aa",  family: "'Inter', sans-serif" },
  { key: "noto",  label: "Noto",  sample: "나",  family: "'Noto Sans KR', sans-serif" },
  { key: "mono",  label: "Mono",  sample: "</>", family: "'JetBrains Mono', 'Fira Code', monospace" },
];

const FONT_SIZE_LEVELS: NonNullable<UserSettings["nano_chat_font_size"]>[] = ["small", "medium", "large"];
const FONT_SIZE_INDEX: Record<string, number> = { small: 0, medium: 1, large: 2 };

export function DisplaySettings({
  theme,
  settings,
  updateSettings,
  t,
  isSupported = true,
  showTempOnly,
  showAppearanceOnly,
}: DisplaySettingsProps) {
  const isLight = settings.nano_skin_mode === "light";

  const getTempLabel = (temp: number) => {
    if (temp <= 0.3) return t("settings.tempConservative", "보수적");
    if (temp <= 0.7) return t("settings.tempBalanced", "균형적");
    return t("settings.tempCreative", "창의적");
  };

  return (
    <div className="space-y-4">
      {/* 1. AI 탭용: 창의성 슬라이더 */}
      {showTempOnly && (
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
      )}

      {/* 2. 외관 탭용: 글자 크기 + 폰트 + 환경 강제 활성화 */}
      {showAppearanceOnly && (
        <div className="space-y-4">

          {/* 글자 크기 슬라이더 */}
          <div className="space-y-2 select-none">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                {t("settings.chatFontSize", "채팅 글자 크기")}
              </label>
              <span className={`text-[10px] font-extrabold ${theme.text}`}>
                {settings.nano_chat_font_size === "small"
                  ? t("settings.fontSizeSmall", "작게")
                  : settings.nano_chat_font_size === "large"
                    ? t("settings.fontSizeLarge", "크게")
                    : t("settings.fontSizeMedium", "기본")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] ${isLight ? "text-slate-400" : "text-slate-500"} font-bold w-4 shrink-0`}>S</span>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={FONT_SIZE_INDEX[settings.nano_chat_font_size ?? "medium"]}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  updateSettings({ nano_chat_font_size: FONT_SIZE_LEVELS[idx] });
                }}
                className={`flex-1 h-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
              />
              <span className={`text-[9px] ${isLight ? "text-slate-400" : "text-slate-500"} font-bold w-4 shrink-0 text-right`}>L</span>
            </div>
          </div>

          {/* 폰트 선택 버튼 */}
          <div className="space-y-2 select-none">
            <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">
              {t("settings.chatFont", "채팅 폰트")}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {FONT_OPTIONS.map(({ key, label, sample, family }) => {
                const isActive = (settings.nano_chat_font ?? "sans") === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSettings({ nano_chat_font: key })}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? `${theme.primary} border-transparent text-white shadow-sm`
                        : isLight
                          ? "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                          : "bg-slate-800 border-white/[0.07] text-slate-400 hover:border-white/[0.15]"
                    }`}
                    title={family}
                  >
                    <span className="text-[13px] font-bold leading-none" style={{ fontFamily: family }}>{sample}</span>
                    <span className="text-[8px] font-extrabold tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 환경 강제 활성화 (온디바이스 AI 미지원 시) */}
          {!isSupported && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl select-none">
              <div>
                <h6 className="font-bold text-amber-400 text-[10px]">{t("settings.bypassTitle", "환경 강제 활성화")}</h6>
                <p className="text-[8.5px] text-slate-400 mt-0.5">{t("settings.bypassDesc", "내장 AI 검출 실패 시에도 챗봇을 강제 활성화합니다.")}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.nano_ai_bypass}
                onChange={(e) => updateSettings({ nano_ai_bypass: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
