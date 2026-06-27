import React, { useState } from "react";
import { useChromeStorage } from "../../../shared/hooks/useChromeStorage";
import { BuddySettings, BuddyPersonalityPreset } from "../../../shared/chatbot-types";
import { BUDDY_AVATAR_LIST } from "./buddy-avatar-list";
import { BuddyPasswordModal } from "./BuddyPasswordModal";
import { ChevronLeft, ChevronRight, Trash2, ShieldCheck, Shuffle } from "lucide-react";
import { BUDDY_PERSONALITIES } from "../data/buddy-presets";

export const DEFAULT_BUDDY_SETTINGS: BuddySettings = {
  buddy_avatar: "/buddies/buddy-preset-01.webp",
  buddy_name: "My Buddy",
  buddy_personality_preset: "motivator",
  buddy_personality_custom: "",
  buddy_password_hash: "",
  buddy_initialized: false,
  buddy_emoji_level: 1,
  buddy_response_length: 1,
  buddy_empathy_level: 1,
};



interface BuddySettingsPanelProps {
  theme: any;
  t: (key: string, def: string) => string;
}

export function BuddySettingsPanel({ theme, t }: BuddySettingsPanelProps) {
  const [buddySettings, setBuddySettings, isLoaded] = useChromeStorage<BuddySettings>(
    "buddy_settings",
    DEFAULT_BUDDY_SETTINGS
  );

  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdSetupMode, setPwdSetupMode] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[160px]">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const updateField = <K extends keyof BuddySettings>(key: K, val: BuddySettings[K]) => {
    setBuddySettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const updateFields = (fields: Partial<BuddySettings>) => {
    setBuddySettings((prev) => ({
      ...prev,
      ...fields,
    }));
  };

  // 아바타 변경 핸들러
  const currentPreset = BUDDY_PERSONALITIES.find(p => p.id === buddySettings.buddy_personality_preset);
  const avatarList = [...BUDDY_AVATAR_LIST];
  if (currentPreset) {
    if (!avatarList.some(av => av.path === currentPreset.defaultAvatar)) {
      const rawName = t(currentPreset.nameKey, currentPreset.id);
      const name = rawName.split(" ")[0] || "Preset";
      avatarList.unshift({
        path: currentPreset.defaultAvatar,
        name
      });
    }
  }

  const currentAvatarIndex = avatarList.findIndex(
    (av) => av.path === buddySettings.buddy_avatar
  );
  const avatarIndex = currentAvatarIndex !== -1 ? currentAvatarIndex : 0;

  const handlePrevAvatar = () => {
    const nextIdx = (avatarIndex - 1 + avatarList.length) % avatarList.length;
    updateField("buddy_avatar", avatarList[nextIdx].path);
  };

  const handleNextAvatar = () => {
    const nextIdx = (avatarIndex + 1) % avatarList.length;
    updateField("buddy_avatar", avatarList[nextIdx].path);
  };

  const handleShuffleBuddyAvatar = () => {
    const randomIndex = Math.floor(Math.random() * BUDDY_AVATAR_LIST.length);
    updateField("buddy_avatar", BUDDY_AVATAR_LIST[randomIndex].path);
  };

  // 비밀번호 완료 콜백 (최초 설정)
  const handleSetupPassword = (hash: string, recoveryHash?: string) => {
    setBuddySettings((prev) => ({
      ...prev,
      buddy_password_hash: hash,
      buddy_recovery_hash: recoveryHash || "",
      buddy_initialized: true,
    }));
    setIsPwdModalOpen(false);
  };

  // 데이터 전체 초기화 콜백 (삭제 승인 후)
  const handleResetConfirm = async () => {
    setIsPwdModalOpen(false);
    // 버디 설정 초기화
    setBuddySettings(DEFAULT_BUDDY_SETTINGS);

    // 암호화된 채팅 데이터, 암호화 키, 일기장 데이터도 스토리지에서 완전 삭제
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.remove(["buddy_chat_data", "buddy_encryption_key", "buddy_diaries"], () => {
        console.log("Buddy chat data, key and diaries cleared.");
      });
    }
  };

  // 버디 미활성화 상태 UI
  if (!buddySettings.buddy_initialized) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 rounded-xl border ${theme.borderMuted} ${theme.bgInput} min-h-[160px] text-center gap-2 relative overflow-hidden`}
      >
        <div className="absolute top-2 right-2 text-purple-400 opacity-60">
          <ShieldCheck size={14} />
        </div>
        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
          NanoBot Buddy
        </span>
        <p className="text-[9.5px] leading-relaxed text-slate-400">
          {t(
            "buddy.setup.desc",
            "대화를 기억하고 암호화로 보호되는 나만의 비밀 버디를 활성화합니다."
          )}
        </p>
        <button
          onClick={() => {
            setPwdSetupMode(true);
            setIsPwdModalOpen(true);
          }}
          className={`mt-1.5 px-3 py-1.5 rounded-lg text-[9.5px] font-extrabold ${theme.primary} text-white hover:opacity-95 transition cursor-pointer`}
        >
          {t("buddy.setup.activate", "비밀번호 설정 및 활성화")}
        </button>

        <BuddyPasswordModal
          isOpen={isPwdModalOpen}
          onClose={() => setIsPwdModalOpen(false)}
          onSuccess={() => {
            // Setup onSuccess는 모달 내부에서 호출하는 함수에 바인딩
          }}
          currentPasswordHash=""
          isFirstSetup={true}
          onSetupPassword={handleSetupPassword}
          theme={theme}
          t={t}
        />
      </div>
    );
  }

  // 버디 활성화 상태 UI
  return (
    <div
      className={`flex flex-col p-3 rounded-xl border ${theme.borderMuted} ${theme.bgInput} space-y-2 relative`}
    >
      {/* 타이틀 및 초기화 🗑 아이콘 */}
      <div className="flex justify-between items-center w-full select-none">
        <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider">
          Buddy Settings
        </span>
        <button
          onClick={() => {
            setPwdSetupMode(false);
            setIsPwdModalOpen(true);
          }}
          className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
          title={t("buddy.tooltip.reset", "버디 전체 데이터 초기화")}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 아바타 선택 캐러셀 */}
      <div className="flex items-center justify-between w-full select-none">
        <button
          type="button"
          onClick={handlePrevAvatar}
          className={`p-1 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
        >
          <ChevronLeft size={14} />
        </button>
        <div
          className="relative w-[48px] h-[48px] rounded-lg flex items-center justify-center bg-slate-950 border border-white/[0.08] overflow-hidden"
        >
          <img
            src={buddySettings.buddy_avatar}
            alt="Buddy Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={handleNextAvatar}
          className={`p-1 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 버디 이름 입력 및 성격 프리셋 설정 */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-1.5 w-full pb-1">
          <input
            type="text"
            value={buddySettings.buddy_name || ""}
            onChange={(e) => updateField("buddy_name", e.target.value)}
            className="w-0 flex-1 text-[9.5px] text-center bg-slate-950 border border-white/[0.08] text-white rounded-lg py-1.5 px-2 focus:outline-none theme.focusBorder font-bold"
            placeholder="Buddy Name"
          />
          <button
            type="button"
            onClick={handleShuffleBuddyAvatar}
            className={`p-1.5 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition cursor-pointer border border-white/[0.08] bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center shrink-0 h-[29px] w-[29px]`}
            title={t("buddy.tooltip.shuffleAvatar", "버디 아바타 무작위 선택")}
          >
            <Shuffle size={12} />
          </button>
        </div>

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
          className="w-full text-[9px] font-extrabold bg-slate-950 border border-white/[0.08] text-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
        >
          {BUDDY_PERSONALITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {t(p.nameKey, p.id)}
            </option>
          ))}
          <option value="custom">✏️ {t("buddy.personality.custom.name", "Custom Personality")}</option>
        </select>

        {buddySettings.buddy_personality_preset === "custom" && (
          <textarea
            value={buddySettings.buddy_personality_custom || ""}
            onChange={(e) => updateField("buddy_personality_custom", e.target.value)}
            className="w-full text-[9px] bg-slate-950 border border-white/[0.08] text-white rounded-lg p-1.5 focus:outline-none theme.focusBorder font-medium resize-none h-[42px] custom-scrollbar"
            placeholder={t("buddy.placeholder.custom", "커스텀 성격을 입력하세요...")}
          />
        )}

        {buddySettings.buddy_personality_preset !== "custom" && (() => {
          const found = BUDDY_PERSONALITIES.find((p) => p.id === buddySettings.buddy_personality_preset);
          return found ? (
            <p className="text-[9px] leading-relaxed text-slate-400 px-0.5 mt-1 select-none">
              {t(found.descKey, "")}
            </p>
          ) : null;
        })()}
      </div>

      {/* 비밀번호 확인용 모달 */}
      <BuddyPasswordModal
        isOpen={isPwdModalOpen}
        onClose={() => setIsPwdModalOpen(false)}
        onSuccess={pwdSetupMode ? () => {} : handleResetConfirm}
        currentPasswordHash={buddySettings.buddy_password_hash}
        isFirstSetup={false}
        onSetupPassword={() => {}}
        theme={theme}
        t={t}
      />
    </div>
  );
}
