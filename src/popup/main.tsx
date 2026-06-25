import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { useChromeStorage } from "../shared/hooks/useChromeStorage";
import {
  DEFAULT_SETTINGS,
  THEME_PALETTES,
  getThemePalette,
} from "../shared/chatbot-constants";
import { ALL_AVATARS } from "../shared/components/tools/settings-panel/avatar-list";
import { UserSettings } from "../shared/chatbot-types";
import {
  Sparkles,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Shuffle,
  Settings as SettingsIcon,
  Bug,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  I18nProvider,
  useTranslation,
} from "../shared/components/i18n/i18n-context";
import { useAISession } from "../shared/hooks/useAISession";
import "../index.css";

function DefaultBotSvg() {
  return (
    <svg
      width="60%"
      height="60%"
      viewBox="0 0 64 64"
      fill="none"
      className="text-indigo-400"
    >
      <rect
        x="17"
        y="22"
        width="30"
        height="24"
        rx="9"
        fill="#0f172a"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <circle cx="28" cy="31.5" r="2.5" fill="#38bdf8" />
      <circle cx="36" cy="31.5" r="2.5" fill="#38bdf8" />
    </svg>
  );
}

function PopupContent({
  settings,
  setSettings,
}: {
  settings: UserSettings;
  setSettings: (
    val: UserSettings | ((prev: UserSettings) => UserSettings),
  ) => void;
}) {
  const { t } = useTranslation();
  const { isSupported } = useAISession();
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "fail"
  >("idle");
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showShieldModal, setShowShieldModal] = useState<boolean>(false);

  const theme = getThemePalette(
    settings.nano_theme_color || "indigo",
    settings.nano_skin_mode || "dark",
  );
  const isLight = settings.nano_skin_mode === "light";

  // 아바타 선택 인덱스 구하기
  const currentAvatarIndex = ALL_AVATARS.findIndex(
    (av) => av.path === settings.nano_ai_avatar,
  );
  const avatarIndex = currentAvatarIndex !== -1 ? currentAvatarIndex : 0;

  const handlePrevAvatar = () => {
    const nextIdx = (avatarIndex - 1 + ALL_AVATARS.length) % ALL_AVATARS.length;
    updateSettingField("nano_ai_avatar", ALL_AVATARS[nextIdx].path);
  };

  const handleNextAvatar = () => {
    const nextIdx = (avatarIndex + 1) % ALL_AVATARS.length;
    updateSettingField("nano_ai_avatar", ALL_AVATARS[nextIdx].path);
  };

  const handleShuffleAvatar = () => {
    const randomIndex = Math.floor(Math.random() * ALL_AVATARS.length);
    updateSettingField("nano_ai_avatar", ALL_AVATARS[randomIndex].path);
  };

  const handleTestAI = async () => {
    if (testStatus === "testing") return;
    setTestStatus("testing");
    try {
      const glob = (
        typeof window !== "undefined"
          ? window
          : typeof self !== "undefined"
            ? self
            : globalThis
      ) as any;
      let lm = glob.ai?.languageModel;
      if (!lm && glob.chrome?.ai?.languageModel) {
        lm = glob.chrome.ai.languageModel;
      }
      if (!lm && glob.chrome?.aiOriginTrial?.languageModel) {
        lm = glob.chrome.aiOriginTrial.languageModel;
      }
      if (!lm && typeof glob.LanguageModel !== "undefined") {
        lm = glob.LanguageModel;
      }

      if (!lm || typeof lm.create !== "function") {
        throw new Error("Language Model API가 감지되지 않습니다.");
      }

      const session = await lm.create({
        systemPrompt: "Reply with OK only.",
      });

      let response = "";
      if (session && typeof session.prompt === "function") {
        response = await session.prompt("ping");
        if (typeof session.destroy === "function") {
          session.destroy();
        }
      } else {
        throw new Error("생성된 세션에 prompt 메소드가 없습니다.");
      }

      if (response && response.trim().length > 0) {
        setTestStatus("success");
        setTimeout(() => setTestStatus("idle"), 2000);
      } else {
        throw new Error("AI가 응답을 반환하지 않았습니다.");
      }
    } catch (err: any) {
      console.error("Manual AI test failed:", err);
      setTestStatus("fail");
      alert(`로컬 AI 테스트 실패: ${err?.message || err}`);
      setTimeout(() => setTestStatus("idle"), 2000);
    }
  };

  const handleOpenSidePanel = () => {
    chrome.runtime.sendMessage({ action: "open_sidepanel" }, (res) => {
      if (res?.success) window.close();
    });
  };

  const updateSettingField = <K extends keyof UserSettings>(
    key: K,
    val: UserSettings[K],
  ) => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      [key]: val,
    }));
  };

  return (
    <div
      className={`w-[350px] ${theme.bgSub} ${theme.textMain} p-4 font-sans border ${theme.borderMuted} shadow-2xl rounded-xl transition-all duration-200 relative`}
    >
      {/* Security & Privacy 모달 오버레이 */}
      {showShieldModal && (
        <div
          className="absolute inset-0 z-[200] flex items-center justify-center rounded-xl"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.65)" }}
          onClick={() => setShowShieldModal(false)}
        >
          <div
            className={`relative mx-4 rounded-2xl border ${theme.borderMuted} ${theme.bgSub} p-6 flex flex-col items-center gap-3 shadow-2xl text-center`}
            onClick={(e) => e.stopPropagation()}
          >

            {/* 방패 아이콘 */}
            <div className={`w-12 h-12 rounded-full ${theme.primary} flex items-center justify-center shadow-lg`}>
              <ShieldCheck size={24} className="text-white" />
            </div>

            {/* 제목 */}
            <h2 className={`text-sm font-black ${theme.textMain}`}>Security & Privacy First</h2>

            {/* 설명 */}
            <div className={`text-[10.5px] leading-relaxed ${theme.textSub} space-y-2`}>
              <p>
                <span className="font-bold text-emerald-400">🔒 All data stays on your device.</span>{" "}
                NanoBot never transmits your conversations, bookmarks, or memos to external servers.
                Everything is stored exclusively in your browser's local storage.
              </p>
              <p>
                <span className="font-bold text-indigo-400">🤖 On-device AI only.</span>{" "}
                Responses are generated locally using Gemini Nano running entirely inside your browser.
                No cloud calls, no data leaks.
              </p>
              <p>
                <span className="font-bold text-amber-400">🛡️ Dual-Pass Safety Guardrails.</span>{" "}
                Every message is pre-screened by a dedicated safety classifier before reaching the main AI.
                Sexual, violent, illegal, or jailbreak content is blocked immediately.
              </p>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowShieldModal(false)}
              className={`mt-1 w-full py-2 rounded-xl text-[10.5px] font-extrabold ${theme.primary} text-white transition-all hover:opacity-90 cursor-pointer`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* 팝업 상단 타이틀 */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${theme.borderMuted} mb-3 relative`}
      >
        <span
          className={`text-sm font-black flex items-center gap-2 ${theme.text}`}
        >
          <img
            src={
              typeof chrome !== "undefined" && chrome.runtime?.getURL
                ? chrome.runtime.getURL("icons/icon32.png")
                : "/icons/icon32.png"
            }
            alt="NanoBot Logo"
            className="h-7.5 w-7.5 rounded-lg object-contain shadow-sm"
          />
          NanoBot AI
        </span>
        <div className="flex items-center gap-1.5 z-[100]">
          {settings.api_mode !== "api" && isSupported && (
            <button
              onClick={handleTestAI}
              disabled={testStatus === "testing"}
              className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase flex items-center gap-1 select-none transition-all duration-200 cursor-pointer ${
                testStatus === "testing"
                  ? "bg-indigo-950/80 text-indigo-350 border border-indigo-500/30 animate-pulse"
                  : testStatus === "success"
                    ? "bg-emerald-950/80 text-emerald-350 border border-emerald-500/40"
                    : testStatus === "fail"
                      ? "bg-rose-950/80 text-rose-350 border border-rose-500/40"
                      : "bg-purple-950/80 text-purple-300 border border-purple-500/30 hover:bg-purple-900"
              }`}
              title="클릭하여 로컬 AI 엔진 수동 테스트"
            >
              {testStatus === "testing" ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  TESTING
                </>
              ) : testStatus === "success" ? (
                "TEST OK"
              ) : testStatus === "fail" ? (
                "TEST FAIL"
              ) : (
                <>
                  <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                  AI ON
                </>
              )}
            </button>
          )}

          {/* Shield 보안 안내 아이콘 */}
          <button
            type="button"
            onClick={() => setShowShieldModal(true)}
            className={`p-1 rounded hover:${theme.bgHover} text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center justify-center`}
            title="Security & Privacy"
          >
            <ShieldCheck size={13} />
          </button>

          {/* 설정 메뉴 아이콘 및 드롭다운 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1 rounded hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer flex items-center justify-center`}
              title="Support Options"
            >
              <SettingsIcon size={13} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className={`absolute right-0 mt-1.5 w-[210px] rounded-lg border ${theme.borderMuted} ${theme.bgSub} py-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150`}
                >
                  <a
                    href="https://github.com/Junpapapo/NanoBotEx/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center justify-between px-3 py-2 text-[10.5px] font-bold ${theme.textSub} hover:${theme.textMain} hover:${theme.bgHover} transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <Bug size={12} className="text-rose-400" />
                      <span>Report Bug / Feature Request</span>
                    </div>
                    <ExternalLink size={10} className="opacity-50" />
                  </a>
                  <a
                    href="https://github.com/Junpapapo/NanoBotEx/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center justify-between px-3 py-2 text-[10.5px] font-bold ${theme.textSub} hover:${theme.textMain} hover:${theme.bgHover} transition-colors border-t ${isLight ? "border-slate-100" : "border-white/[0.04]"}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-indigo-400" />
                      <span>Quick Feedback</span>
                    </div>
                    <ExternalLink size={10} className="opacity-50" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2열 그리드 구조 */}
      <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/[0.04]">
        {/* 왼쪽 열: 아바타 설정 & 봇 이름 입력 */}
        <div
          className={`flex flex-col items-center justify-between p-3 rounded-xl border ${theme.borderMuted} ${theme.bgInput} space-y-2`}
        >
          <div className="flex justify-between items-center w-full px-0.5 select-none">
            <span
              className={`text-[9px] font-black ${theme.textSub} uppercase tracking-wider block`}
            >
              NAME
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[8.5px] text-slate-500 font-extrabold">
                {t("settings.random", "랜덤")}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateSettingField(
                    "nano_ai_random_avatar",
                    !settings.nano_ai_random_avatar,
                  )
                }
                className={`w-7 h-4 rounded-full p-0.5 transition-all duration-200 focus:outline-none cursor-pointer ${
                  settings.nano_ai_random_avatar
                    ? theme.primary
                    : isLight
                      ? "bg-slate-200 border border-slate-300"
                      : "bg-slate-950 border border-white/[0.08]"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 ${
                    settings.nano_ai_random_avatar
                      ? "translate-x-3.5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {/* 아바타 선택 카루셀 */}
          <div className="flex items-center justify-between w-full select-none">
            <button
              type="button"
              onClick={handlePrevAvatar}
              className={`p-1.5 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
            >
              <ChevronLeft size={16} />
            </button>
            <div
              className={`relative w-[60px] h-[60px] rounded-xl flex items-center justify-center ${isLight ? "bg-white border-slate-200" : "bg-slate-950 border-white/[0.08]"} border overflow-hidden`}
            >
              {settings.nano_ai_avatar ? (
                <img
                  src={settings.nano_ai_avatar}
                  alt="Bot Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultBotSvg />
              )}
            </div>
            <button
              type="button"
              onClick={handleNextAvatar}
              className={`p-1.5 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {/* 봇 이름 입력 및 랜덤 셔플 버튼 */}
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={settings.nano_ai_avatar_name || ""}
              onChange={(e) =>
                updateSettingField("nano_ai_avatar_name", e.target.value)
              }
              className={`w-0 flex-1 text-[10px] text-center ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-950 border-white/[0.08] text-white"} border rounded-lg py-1.5 px-2 focus:outline-none ${theme.focusBorder} font-bold`}
              placeholder="Name"
            />
            <button
              type="button"
              onClick={handleShuffleAvatar}
              className={`p-1.5 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer border ${isLight ? "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800" : "border-white/[0.08] bg-slate-950 text-slate-400 hover:text-white"} flex items-center justify-center shrink-0 h-[29px] w-[29px]`}
              title="아바타 무작위 선택"
            >
              <Shuffle size={12} />
            </button>
          </div>
        </div>

        {/* 오른쪽 열: 사이드패널 실행 버튼 */}
        <div
          className={`flex flex-col items-center justify-center p-3 rounded-xl border ${theme.borderMuted} ${theme.bgInput}`}
        >
          <button
            type="button"
            onClick={handleOpenSidePanel}
            className={`w-full h-full min-h-[108px] rounded-xl ${theme.primary} text-white font-bold text-[11px] flex flex-col items-center justify-center gap-2 transition cursor-pointer ${theme.shadow} border border-white/[0.06] hover:scale-[1.02] active:scale-[0.98]`}
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span className="text-center px-1">
              {t("popup.openSidepanel", "사이드패널 열기 (Open Sidepanel)")}
            </span>
          </button>
        </div>
      </div>

      {/* 하단 Preferences 세팅 슬롯 */}
      <div className="flex flex-col gap-2.5 pt-2">
        {/* 1. 언어 선택 */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={`text-[10px] font-bold ${theme.textSub} uppercase tracking-wider select-none`}
          >
            {t("settings.language", "언어")}
          </span>
          <select
            value={settings.nano_locale || "ko"}
            onChange={(e) => updateSettingField("nano_locale", e.target.value)}
            className={`text-[10px] font-extrabold ${isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-950 border border-white/[0.08] text-slate-200"} rounded-lg px-2.5 py-1.5 outline-none cursor-pointer`}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* 2. 화면 스타일 모드 (다크/라이트) */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={`text-[10px] font-bold ${theme.textSub} uppercase tracking-wider select-none`}
          >
            {t("panel.settings.skinMode", "화면 모드")}
          </span>
          <div
            className={`flex ${isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border border-white/[0.08]"} p-0.5 rounded-lg border select-none`}
          >
            <button
              type="button"
              onClick={() => updateSettingField("nano_skin_mode", "dark")}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                settings.nano_skin_mode !== "light"
                  ? `${theme.primary} text-white shadow-sm`
                  : `${theme.textSub} hover:${theme.textMain}`
              }`}
            >
              <Moon size={9.5} />
              Dark
            </button>
            <button
              type="button"
              onClick={() => updateSettingField("nano_skin_mode", "light")}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                settings.nano_skin_mode === "light"
                  ? `${theme.primary} text-white shadow-sm`
                  : `${theme.textSub} hover:${theme.textMain}`
              }`}
            >
              <Sun size={9.5} />
              Light
            </button>
          </div>
        </div>

        {/* 3. 테마 컬러 칩 */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={`text-[10px] font-bold ${theme.textSub} uppercase tracking-wider select-none`}
          >
            {t("panel.settings.theme", "테마 설정")}
          </span>
          <div className="flex items-center gap-2">
            {Object.entries(THEME_PALETTES).map(([key, val]) => {
              const isSelected = settings.nano_theme_color === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateSettingField("nano_theme_color", key)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 border ${
                    isSelected
                      ? isLight
                        ? "border-slate-800 bg-slate-100 shadow-md"
                        : "border-white bg-slate-900 shadow-md"
                      : isLight
                        ? "border-slate-200 bg-white hover:border-slate-350"
                        : "border-white/[0.08] bg-slate-950 hover:border-white/[0.2]"
                  }`}
                  title={val.name}
                >
                  <span
                    className="w-4.5 h-4.5 rounded-md block shadow-inner"
                    style={{ backgroundColor: val.colorCode }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PopupApp() {
  const [settings, setSettings, isSettingsLoaded] =
    useChromeStorage<UserSettings>("user_settings", DEFAULT_SETTINGS);

  return (
    <I18nProvider
      settings={settings}
      updateSettings={(newSettings) =>
        setSettings((prev: UserSettings) => ({ ...prev, ...newSettings }))
      }
      isSettingsLoaded={isSettingsLoaded}
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
    </React.StrictMode>,
  );
}
