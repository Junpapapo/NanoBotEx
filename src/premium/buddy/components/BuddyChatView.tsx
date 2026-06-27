import React, { useState, useEffect } from "react";
import { Message, BuddySettings } from "../../../shared/chatbot-types";
import { ChatMessageList } from "../../../shared/components/ChatMessageList";
import { ChatInput } from "../../../shared/components/ChatInput";
import { Key, Brain, ShieldCheck, Lock, Unlock } from "lucide-react";
import { BUDDY_QUICK_MENU_ITEMS } from "../buddy-constants";
import { hashPassword } from "../utils/buddy-crypto";
import { BuddyPasswordModal } from "./BuddyPasswordModal";

interface BuddyChatViewProps {
  messages: Message[];
  memoriesCount: number;
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  buddySettings: BuddySettings;
  theme: any;
  t: (key: string, def: string) => string;
  onOpenGuideSection?: (section: string) => void;
  onConfirmAction?: (confirmed: boolean) => void;
  buddySaveState?: "idle" | "waiting_input" | "confirming_save";
}

export function BuddyChatView({
  messages,
  memoriesCount,
  isSending,
  sendMessage,
  stopGeneration,
  buddySettings,
  theme,
  t,
  onOpenGuideSection,
  onConfirmAction,
  buddySaveState = "idle"
}: BuddyChatViewProps) {
  const [isLocked, setIsLocked] = useState(
    !!(buddySettings.buddy_lock_enabled && buddySettings.buddy_initialized)
  );
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // 복구 모드 & 리셋 모달 관련 상태 (영문 통일)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (!buddySettings.buddy_lock_enabled || !buddySettings.buddy_initialized) {
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }
  }, [buddySettings.buddy_lock_enabled, buddySettings.buddy_initialized]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");

    if (!unlockPassword.trim()) {
      setUnlockError(t("buddy.pwd.empty", "비밀번호를 입력해 주세요."));
      return;
    }

    try {
      const hashed = await hashPassword(unlockPassword);
      if (hashed === buddySettings.buddy_password_hash) {
        setIsLocked(false);
        setUnlockPassword("");
        setUnlockError("");
      } else {
        setUnlockError(t("buddy.pwd.wrong", "비밀번호가 올바르지 않습니다."));
      }
    } catch (err) {
      setUnlockError("잠금 해제 중 오류가 발생했습니다.");
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");

    if (!recoveryKey.trim()) {
      setUnlockError("Please enter your recovery key.");
      return;
    }

    try {
      const hashed = await hashPassword(recoveryKey.trim());
      if (hashed === buddySettings.buddy_recovery_hash) {
        setIsLocked(false);
        setIsRecoveryMode(false);
        setRecoveryKey("");
        setUnlockError("");
        // 복구 성공 -> 즉시 새 비밀번호 설정 모달 팝업 가동
        setIsResetModalOpen(true);
      } else {
        setUnlockError("Invalid recovery key. Please check and try again.");
      }
    } catch (err) {
      setUnlockError("Recovery verification failed.");
    }
  };

  const handleResetPasswordSuccess = (newHash: string, newRecoveryHash?: string) => {
    const updatedSettings = {
      ...buddySettings,
      buddy_password_hash: newHash,
      buddy_recovery_hash: newRecoveryHash || "",
      buddy_initialized: true,
    };
    chrome.storage.local.set({ buddy_settings: updatedSettings }, () => {
      setIsResetModalOpen(false);
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* 프라이버시 & 메모리 알림 상단 바 */}
      <div
        className={`px-4 py-2 text-[10.5px] border-b ${theme.borderMuted} ${theme.bgInput} flex items-center justify-between z-[5] select-none`}
      >
        <div className="flex items-center gap-2">
          <div className="relative group flex items-center cursor-help">
            <div className="flex items-center gap-1 text-purple-400 font-black transition-opacity hover:opacity-85">
              <ShieldCheck size={12} />
              <Key size={12} className="text-amber-400" />
            </div>
            {/* 커스텀 툴팁 */}
            <div className="absolute left-0 top-6 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 origin-top-left flex items-center bg-slate-950/95 border border-white/[0.08] text-white text-[9.5px] py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-2xl z-[60]">
              <span>{t("buddy.chat.secure", "프라이빗 종단간 암호화 적용됨")}</span>
            </div>
          </div>

          {/* 잠금 단축 아이콘 (설정 켜졌을 때만 노출) */}
          {buddySettings.buddy_lock_enabled && buddySettings.buddy_initialized && (
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center h-5 w-5"
              title={t("buddy.tooltip.lock", "즉시 대화창 잠금")}
            >
              <Lock size={11} className="text-red-400 hover:text-red-300" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 font-extrabold text-[10px]">
          <Brain size={11} className="text-purple-400" />
          <span>
            {t("buddy.chat.memories", "버디 기억")}: {memoriesCount}/50
          </span>
        </div>
      </div>

      {/* 잠금 화면 덮어씌우기 */}
      {isLocked ? (
        <div className="absolute inset-0 top-[33px] bg-slate-950/80 backdrop-blur-md z-[50] flex flex-col items-center justify-center p-6 text-center select-none">
          {isRecoveryMode ? (
            /* 복구 키 입력 모드 (영문 통일) */
            <>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-3.5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Key size={20} />
              </div>
              <h2 className="text-white text-xs font-black tracking-wide mb-1">
                Forgot Password?
              </h2>
              <p className="text-[9.5px] text-slate-400 leading-relaxed mb-4 max-w-[190px]">
                Enter your 12-character recovery key to unlock and reset your password.
              </p>

              <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-2 w-full max-w-[200px]">
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  placeholder="NANO-RCV-XXXX-XXXX"
                  className="w-full text-xs text-center bg-slate-950 border border-white/[0.08] text-white rounded-lg py-1.5 focus:outline-none focus:border-purple-500/60 font-bold uppercase"
                  autoFocus
                />
                {unlockError && (
                  <span className="text-[8.5px] text-rose-400 font-semibold">{unlockError}</span>
                )}
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg text-[9.5px] font-black bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md mt-1"
                >
                  Verify & Unlock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false);
                    setUnlockError("");
                  }}
                  className="text-[9px] text-slate-500 hover:text-purple-400 font-bold transition cursor-pointer select-none mt-2 block mx-auto underline"
                >
                  Back to Password
                </button>
              </form>
            </>
          ) : (
            /* 기존 비밀번호 입력 모드 */
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mb-3.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <Lock size={20} />
              </div>
              <h2 className="text-white text-xs font-black tracking-wide mb-1">
                {t("buddy.lock.title", "사생활 보호 잠금 모드")}
              </h2>
              <p className="text-[9.5px] text-slate-400 leading-relaxed mb-4 max-w-[190px]">
                {t("buddy.lock.desc", "버디와의 안전한 비밀 대화를 지키기 위해 잠금 해제 비밀번호를 입력해 주세요.")}
              </p>

              <form onSubmit={handleUnlockSubmit} className="flex flex-col gap-2 w-full max-w-[200px]">
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full text-xs text-center bg-slate-950 border border-white/[0.08] text-white rounded-lg py-1.5 focus:outline-none focus:border-purple-500/60 font-black tracking-widest"
                  autoFocus
                />
                {unlockError && (
                  <span className="text-[8.5px] text-rose-400 font-semibold">{unlockError}</span>
                )}
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg text-[9.5px] font-black bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md mt-1"
                >
                  {t("buddy.lock.unlock", "잠금 해제")}
                </button>
                {buddySettings.buddy_recovery_hash && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setUnlockError("");
                    }}
                    className="text-[9px] text-slate-500 hover:text-purple-400 font-bold transition cursor-pointer select-none mt-2 block mx-auto underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      ) : (
        <>
          {/* 메시지 리스트 */}
          <ChatMessageList
            messages={messages}
            buddySettings={buddySettings}
            settings={
              {
                nano_ai_avatar: buddySettings.buddy_avatar,
                nano_ai_avatar_name: buddySettings.buddy_name,
                nano_chat_font: "sans",
                nano_chat_font_size: "medium",
              } as any
            }
            isSupported={true}
            effectiveAIAvatar={buddySettings.buddy_avatar}
            onQuickQuestion={(text) => sendMessage(text)}
            onOpenGuideSection={onOpenGuideSection}
            t={t}
            isBuddy={true}
            quickMenuItems={BUDDY_QUICK_MENU_ITEMS}
            onConfirmAction={onConfirmAction}
          />

          {/* 입력기 */}
          <ChatInput
            onSendMessage={sendMessage}
            isSending={isSending || buddySaveState === "confirming_save"}
            onStop={stopGeneration}
            settings={
              {
                nano_chat_font: "sans",
                nano_chat_font_size: "medium",
              } as any
            }
            t={t}
            externalText=""
            onClearExternalText={() => {}}
          />
        </>
      )}

      {/* 비밀번호 재설정 모달 (복구 키 성공 시 실행, 영문으로 구성됨) */}
      <BuddyPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => setIsResetModalOpen(false)}
        currentPasswordHash=""
        isFirstSetup={true}
        onSetupPassword={handleResetPasswordSuccess}
        theme={theme}
        t={t}
      />
    </div>
  );
}
