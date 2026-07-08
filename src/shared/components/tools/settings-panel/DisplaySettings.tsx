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
  const [isDangerZoneOpen, setIsDangerZoneOpen] = React.useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);

  const handleResetAllData = () => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.clear(() => {
        if (chrome.runtime && typeof chrome.runtime.reload === "function") {
          chrome.runtime.reload();
        } else {
          window.location.reload();
        }
      });
    } else {
      localStorage.clear();
      window.location.reload();
    }
  };

  const getTempLabel = (temp: number) => {
    if (temp <= 0.3) return t("settings.tempConservative", "보수적");
    if (temp <= 0.7) return t("settings.tempBalanced", "균형적");
    return t("settings.tempCreative", "창의적");
  };

  return (
    <div className="space-y-4">
      {/* 1. AI 탭용: 창의성 슬라이더 */}
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

          {/* 세션 자동 만료 시간 슬라이더 */}
          {(() => {
            const TIMEOUT_STEPS = [0, 15, 30, 60, 120];
            const currentTimeout = settings.nano_session_timeout_minutes ?? 60;
            const stepIdx = TIMEOUT_STEPS.indexOf(currentTimeout) !== -1
              ? TIMEOUT_STEPS.indexOf(currentTimeout)
              : 3;
            const timeoutLabel = currentTimeout === 0
              ? t("session.timeoutOff", "끔")
              : `${currentTimeout}${t("session.timeoutMinSuffix", "분")}`;
            return (
              <div className="space-y-2 select-none">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    {t("session.timeoutLabel", "세션 자동 만료")}
                  </label>
                  <span className={`text-[10px] font-extrabold ${theme.text}`}>
                    {timeoutLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] ${isLight ? "text-slate-400" : "text-slate-500"} font-bold shrink-0`}>
                    {t("session.timeoutOff", "끔")}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={stepIdx}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      updateSettings({ nano_session_timeout_minutes: TIMEOUT_STEPS[idx] });
                    }}
                    className={`flex-1 h-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
                  />
                  <span className={`text-[9px] ${isLight ? "text-slate-400" : "text-slate-500"} font-bold shrink-0`}>
                    2h
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Danger Zone (위험존) - 평소 접힌 상태 */}
          <div className="border-t border-red-500/10 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
              className="w-full flex items-center justify-between py-1.5 px-2 bg-red-950/10 hover:bg-red-950/20 border border-red-500/15 hover:border-red-500/25 rounded-lg transition-all text-red-400 font-bold text-[10px] uppercase tracking-wider select-none cursor-pointer"
            >
              <span>🔥 Danger Zone</span>
              <span className="text-[8px]">{isDangerZoneOpen ? "▼" : "▲"}</span>
            </button>

            {isDangerZoneOpen && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-950/15 border border-red-500/20 space-y-3 select-none">
                <p className="text-[8.5px] leading-relaxed text-red-300 font-medium text-left">
                  This action will completely wipe all local storage data, including general settings, chat history, bookmarks, and all encrypted Buddy data (passwords, diaries, and memories). This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full py-1.5 rounded-lg text-[9px] font-black bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer shadow-md shadow-red-950/50"
                >
                  Reset All Data
                </button>
              </div>
            )}
          </div>

          {/* 커스텀 확인 모달 */}
          {isConfirmModalOpen && (
            <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-[280px] bg-slate-900 border border-red-500/25 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.2)] text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                </div>
                
                <h3 className="text-white text-xs font-black tracking-wide mb-1.5">
                  Danger! Reset All Data
                </h3>
                <p className="text-[9px] text-slate-400 leading-relaxed mb-5 px-1">
                  Are you absolutely sure you want to delete all application data? All settings, chat histories, bookmarks, and Buddy's encrypted diaries/memories will be permanently deleted. This cannot be undone.
                </p>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetAllData}
                    className="w-full py-2 rounded-lg text-[9.5px] font-black bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="w-full py-2 rounded-lg text-[9.5px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer border border-white/[0.05]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
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
