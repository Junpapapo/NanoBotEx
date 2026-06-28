import React, { useState, useRef } from "react";
import { useChromeStorage } from "../../../shared/hooks/useChromeStorage";
import { BuddySettings, BuddyPersonalityPreset } from "../../../shared/chatbot-types";
import { BUDDY_AVATAR_LIST } from "./buddy-avatar-list";
import { ChevronLeft, ChevronRight, Shuffle, Smile, AlignLeft, Heart, Volume2, Lock } from "lucide-react";
import { DEFAULT_BUDDY_SETTINGS } from "./BuddySettingsPanel";
import { BUDDY_PERSONALITIES } from "../data/buddy-presets";

const getPresetPromptText = (preset: string, customText: string) => {
  if (preset === "custom") {
    return customText || "A close, reliable friend who talks casually like a real best friend.";
  }
  const found = BUDDY_PERSONALITIES.find((p) => p.id === preset);
  if (found) {
    return found.displayExamples.join("\n");
  }
  return "A close, warm friend who always talks casually and naturally in informal Korean.";
};

interface BuddySettingsViewProps {
  theme: any;
  t: (key: string, def: string) => string;
}

type TabType = "personality" | "detail";

export function BuddySettingsView({ theme, t }: BuddySettingsViewProps) {
  const [buddySettings, setBuddySettings] = useChromeStorage<BuddySettings>(
    "buddy_settings",
    DEFAULT_BUDDY_SETTINGS
  );
  const [activeTab, setActiveTab] = useState<TabType>("personality");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentPreset = BUDDY_PERSONALITIES.find(p => p.id === buddySettings.buddy_personality_preset);
  const baseAvatars = BUDDY_AVATAR_LIST.filter(av => !failedImages.has(av.path));
  const validAvatars = [...baseAvatars];
  if (currentPreset && !failedImages.has(currentPreset.defaultAvatar)) {
    if (!validAvatars.some(av => av.path === currentPreset.defaultAvatar)) {
      const rawName = t(currentPreset.nameKey, currentPreset.id);
      const name = rawName.split(" ")[0] || "Preset";
      validAvatars.unshift({
        path: currentPreset.defaultAvatar,
        name
      });
    }
  }

  const handleScroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const handleImageError = (path: string) => {
    setFailedImages(prev => new Set([...prev, path]));
  };

  const updateField = <K extends keyof BuddySettings>(key: K, val: BuddySettings[K]) => {
    setBuddySettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateFields = (fields: Partial<BuddySettings>) => {
    setBuddySettings((prev) => ({ ...prev, ...fields }));
  };

  const currentAvatarIndex = BUDDY_AVATAR_LIST.findIndex(
    (av) => av.path === buddySettings.buddy_avatar
  );
  const avatarIndex = currentAvatarIndex !== -1 ? currentAvatarIndex : 0;

  const handleShuffleAvatar = () => {
    const randomIndex = Math.floor(Math.random() * BUDDY_AVATAR_LIST.length);
    updateField("buddy_avatar", BUDDY_AVATAR_LIST[randomIndex].path);
  };

  const tabBtnBase = "flex-1 py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all cursor-pointer";
  const tabActive = "bg-purple-600 text-white shadow-sm";
  const tabInactive = `${theme.textSub} hover:${theme.textMain}`;

  const sliderLabels = {
    emoji: [
      t("buddy.detail.emoji.none", "없음"),
      t("buddy.detail.emoji.some", "적당"),
      t("buddy.detail.emoji.lots", "많음"),
    ],
    length: [
      t("buddy.detail.length.short", "짧게"),
      t("buddy.detail.length.medium", "보통"),
      t("buddy.detail.length.long", "길게"),
    ],
    empathy: [
      t("buddy.detail.empathy.cool", "쿨하게"),
      t("buddy.detail.empathy.medium", "보통"),
      t("buddy.detail.empathy.warm", "따뜻하게"),
    ],
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className={`px-4 pt-4 pb-3 border-b ${theme.borderMuted} shrink-0`}>
        <div className="flex items-center gap-2">
          <img
            src={buddySettings.buddy_avatar}
            alt="buddy"
            className="w-8 h-8 rounded-lg object-cover border border-purple-500/40"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-black text-purple-400 leading-tight">
                {buddySettings.buddy_name || "My Buddy"}
              </p>
              <span className="text-[7.5px] px-1 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold tracking-wider leading-none select-none shrink-0">
                PREMIUM
              </span>
            </div>
            <p className={`text-[9px] ${theme.textSub} mt-0.5`}>
              {t("buddy.settings.title", "버디 세부 설정")}
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className={`flex gap-1.5 mt-3 p-1 rounded-xl ${theme.bgInput} border ${theme.borderMuted}`}>
          <button
            className={`${tabBtnBase} ${activeTab === "personality" ? tabActive : tabInactive}`}
            onClick={() => setActiveTab("personality")}
          >
            🎭 {t("buddy.settings.tab.personality", "성격")}
          </button>
          <button
            className={`${tabBtnBase} ${activeTab === "detail" ? tabActive : tabInactive}`}
            onClick={() => setActiveTab("detail")}
          >
            ⚙️ {t("buddy.settings.tab.detail", "세부설정")}
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">

        {/* ── 성격 탭 ── */}
        {activeTab === "personality" && (
          <div className="flex flex-col gap-3">
            {/* 이름 + 셔플 */}
            <div className="flex items-center gap-1.5 mb-1">
              <input
                type="text"
                value={buddySettings.buddy_name || ""}
                onChange={(e) => updateField("buddy_name", e.target.value)}
                className="w-0 flex-1 text-[10px] text-center bg-slate-950 border border-white/[0.08] text-white rounded-lg py-1.5 px-2 focus:outline-none font-bold"
                placeholder="Buddy Name"
              />
              <button
                type="button"
                onClick={handleShuffleAvatar}
                className={`p-1.5 rounded-lg ${theme.textSub} hover:${theme.textMain} transition cursor-pointer border border-white/[0.08] bg-slate-950 flex items-center justify-center shrink-0 h-[29px] w-[29px]`}
                title={t("buddy.tooltip.shuffleAvatar", "아바타 무작위 선택")}
              >
                <Shuffle size={12} />
              </button>
            </div>

            {/* 아바타 그리드 (나노봇 AvatarPicker 방식) */}
            <div className="flex flex-col gap-1">
              <label className={`text-[9px] font-bold ${theme.textSub} uppercase tracking-wider`}>
                {t("buddy.settings.avatar", "아바타 선택")}
              </label>
              <div className="relative group/slider">
                {/* 왼쪽 화살표 */}
                <button
                  type="button"
                  onClick={() => handleScroll("left")}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-slate-950/95 hover:bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white rounded flex items-center justify-center transition opacity-0 group-hover/slider:opacity-100 shadow-md cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>

                {/* 그리드 */}
                <div
                  ref={scrollRef}
                  className="grid grid-rows-2 grid-flow-col gap-2 bg-slate-950/40 border border-white/[0.04] p-2.5 rounded-xl overflow-x-auto scroll-smooth"
                  style={{ maxHeight: "140px", scrollbarWidth: "none" }}
                >
                  {validAvatars.map((av) => {
                    const isSelected = buddySettings.buddy_avatar === av.path;
                    return (
                      <button
                        key={av.path}
                        type="button"
                        onClick={() => updateField("buddy_avatar", av.path)}
                        className="flex flex-col items-center gap-1 p-1 rounded-lg transition outline-none shrink-0 cursor-pointer"
                      >
                        <div
                          className={`relative w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 border overflow-hidden transition ${
                            isSelected
                              ? "border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.45)] scale-105"
                              : "border-white/[0.08] hover:border-white/[0.2] hover:scale-105"
                          }`}
                        >
                          <img
                            src={av.path}
                            alt={av.name}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(av.path)}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[8px] font-bold truncate max-w-[42px] ${
                          isSelected ? "text-purple-400" : "text-slate-500"
                        }`}>
                          {av.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 오른쪽 화살표 */}
                <button
                  type="button"
                  onClick={() => handleScroll("right")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-slate-950/95 hover:bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white rounded flex items-center justify-center transition opacity-0 group-hover/slider:opacity-100 shadow-md cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* 성격 프리셋 */}
            <div className="flex flex-col gap-1">
              <label className={`text-[9px] font-bold ${theme.textSub} uppercase tracking-wider`}>
                {t("buddy.settings.personality", "성격 프리셋")}
              </label>
              <select
                value={buddySettings.buddy_personality_preset}
                onChange={(e) => {
                  const val = e.target.value as BuddyPersonalityPreset;
                  const updates: Partial<BuddySettings> = { buddy_personality_preset: val };
                  if (val !== "custom") {
                    const found = BUDDY_PERSONALITIES.find(p => p.id === val);
                    if (found) {
                      updates.buddy_avatar = found.defaultAvatar;
                      updates.buddy_tts_rate = found.defaultTtsRate ?? 1.0;
                      updates.buddy_tts_pitch = found.defaultTtsPitch ?? 1.0;
                    }
                  }
                  updateFields(updates);
                }}
                className="w-full text-[10px] font-extrabold bg-slate-950 border border-white/[0.08] text-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
              >
                {BUDDY_PERSONALITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {t(p.nameKey, p.id)}
                  </option>
                ))}
                <option value="custom">✏️ {t("buddy.personality.custom.name", "Custom Personality")}</option>
              </select>

              {/* 현재 선택된 성격 설명 */}
              {buddySettings.buddy_personality_preset !== "custom" && (() => {
                const found = BUDDY_PERSONALITIES.find((p) => p.id === buddySettings.buddy_personality_preset);
                return found ? (
                  <p className={`text-[9px] leading-relaxed ${theme.textSub} px-0.5`}>
                    {t(found.descKey, "")}
                  </p>
                ) : null;
              })()}

              {/* 현재 성격 지침 영역 */}
              <div className="flex flex-col w-full bg-slate-950/40 border border-white/[0.04] rounded-lg p-2 gap-1 text-slate-400 select-none mt-2">
                <span className="text-[8px] font-black uppercase text-purple-400">
                  {t("buddy.settings.currentPrompt", "현재 설정된 성격 지침")}
                </span>
                <div className="text-[8px] leading-relaxed whitespace-pre-line max-h-[80px] overflow-y-auto custom-scrollbar font-medium">
                  {getPresetPromptText(
                    buddySettings.buddy_personality_preset,
                    buddySettings.buddy_personality_custom
                  )}
                </div>
              </div>
            </div>

            {/* 커스텀 성격 */}
            {buddySettings.buddy_personality_preset === "custom" && (
              <textarea
                value={buddySettings.buddy_personality_custom || ""}
                onChange={(e) => updateField("buddy_personality_custom", e.target.value)}
                className="w-full text-[9.5px] bg-slate-950 border border-white/[0.08] text-white rounded-lg p-2 focus:outline-none font-medium resize-none h-[72px] custom-scrollbar"
                placeholder={t("buddy.placeholder.custom", "커스텀 성격을 입력하세요...")}
              />
            )}
          </div>
        )}

        {/* ── 세부설정 탭 ── */}
        {activeTab === "detail" && (
          <div className="flex flex-col gap-6 pt-1">
            <SliderRow
              icon={<Smile size={13} className="text-yellow-400" />}
              label={t("buddy.detail.emoji.label", "이모지 빈도")}
              value={buddySettings.buddy_emoji_level ?? 1}
              labels={sliderLabels.emoji}
              onChange={(v) => updateField("buddy_emoji_level", v)}
              theme={theme}
            />
            <SliderRow
              icon={<AlignLeft size={13} className="text-blue-400" />}
              label={t("buddy.detail.length.label", "답변 길이")}
              value={buddySettings.buddy_response_length ?? 1}
              labels={sliderLabels.length}
              onChange={(v) => updateField("buddy_response_length", v)}
              theme={theme}
            />
            <SliderRow
              icon={<Heart size={13} className="text-rose-400" />}
              label={t("buddy.detail.empathy.label", "감성/공감도")}
              value={buddySettings.buddy_empathy_level ?? 1}
              labels={sliderLabels.empathy}
              onChange={(v) => updateField("buddy_empathy_level", v)}
              theme={theme}
            />
            
            {/* 추가 토글 설정 */}
            <div className={`flex flex-col gap-4 border-t ${theme.borderMuted} pt-5 mt-2`}>
              {/* TTS 토글 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Volume2 size={13} className="text-purple-400" />
                    <span className={`text-[10.5px] font-bold ${theme.textMain}`}>{t("buddy.detail.tts.label", "답변 읽어주기 (TTS)")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("buddy_tts_enabled", !buddySettings.buddy_tts_enabled)}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer outline-none ${
                      buddySettings.buddy_tts_enabled ? "bg-purple-600" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        buddySettings.buddy_tts_enabled ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* TTS 세부 속도 및 피치 조절 슬라이더 */}
                {buddySettings.buddy_tts_enabled && (
                  <div className="flex flex-col gap-3.5 pl-4 pr-1 py-2 border-l-2 border-purple-500/30 bg-purple-500/[0.01] rounded-r-lg mt-1 select-none">
                    {/* TTS 속도 */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400">⚡ {t("buddy.detail.tts.rate.label", "말하기 속도")}</span>
                        <span className="text-[8.5px] font-black text-purple-400">x{(buddySettings.buddy_tts_rate ?? 1.0).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={2.0}
                        step={0.05}
                        value={buddySettings.buddy_tts_rate ?? 1.0}
                        onChange={(e) => updateField("buddy_tts_rate", parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                        style={{ outline: "none" }}
                      />
                    </div>

                    {/* TTS 높낮이 */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400">🎵 {t("buddy.detail.tts.pitch.label", "음성 높낮이 (Pitch)")}</span>
                        <span className="text-[8.5px] font-black text-purple-400">x{(buddySettings.buddy_tts_pitch ?? 1.0).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={2.0}
                        step={0.05}
                        value={buddySettings.buddy_tts_pitch ?? 1.0}
                        onChange={(e) => updateField("buddy_tts_pitch", parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                        style={{ outline: "none" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lock 토글 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock size={13} className="text-red-400" />
                  <span className={`text-[10.5px] font-bold ${theme.textMain}`}>{t("buddy.detail.lock.label", "사생활 보호 잠금 활성화")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("buddy_lock_enabled", !buddySettings.buddy_lock_enabled)}
                  className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer outline-none ${
                    buddySettings.buddy_lock_enabled ? "bg-purple-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      buddySettings.buddy_lock_enabled ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 슬라이더 행 공통 컴포넌트 ──
interface SliderRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  labels: string[];
  onChange: (v: number) => void;
  theme: any;
}

function SliderRow({ icon, label, value, labels, onChange, theme }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-[10.5px] font-bold ${theme.textMain}`}>{label}</span>
        </div>
        <span className="text-[9.5px] font-black text-purple-400">{labels[value]}</span>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-purple-500
          [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5
          [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-purple-500"
        style={{ outline: "none" }}
      />
      <div className="flex justify-between px-0.5">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`text-[8.5px] font-bold transition-colors ${
              value === i ? "text-purple-400" : theme.textSub
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
