import React, { useState } from "react";
import { hashPassword } from "../utils/buddy-crypto";
import { ShieldAlert, X } from "lucide-react";

interface BuddyPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPasswordHash: string;
  isFirstSetup: boolean; // 최초 비밀번호 등록 모드 여부
  onSetupPassword: (hash: string, recoveryHash?: string) => void;
  theme: any;
  t: (key: string, def: string) => string;
}

export function BuddyPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  currentPasswordHash,
  isFirstSetup,
  onSetupPassword,
  theme,
  t,
}: BuddyPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 일회용 복구 키 상태
  const [showRecoveryScreen, setShowRecoveryScreen] = useState(false);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password.trim()) {
      setErrorMsg(t("buddy.pwd.empty", "비밀번호를 입력해 주세요."));
      return;
    }

    setIsLoading(true);
    try {
      if (isFirstSetup) {
        // 최초 설정
        if (password !== confirmPassword) {
          setErrorMsg(t("buddy.pwd.mismatch", "비밀번호가 서로 일치하지 않습니다."));
          setIsLoading(false);
          return;
        }

        // 복구 키 생성
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let key = "NANO-RCV-";
        for (let i = 0; i < 8; i++) {
          if (i === 4) key += "-";
          key += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setGeneratedRecoveryKey(key);
        setShowRecoveryScreen(true);
      } else {
        // 초기화 시 검증
        const hashed = await hashPassword(password);
        if (hashed === currentPasswordHash) {
          onSuccess();
        } else {
          setErrorMsg(t("buddy.pwd.wrong", "비밀번호가 올바르지 않습니다."));
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t("buddy.pwd.error", "비밀번호 처리 중 오류가 발생했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(6px)",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
      }}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border ${theme.borderMuted} ${theme.bgSub} p-6 flex flex-col gap-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 (복구 키 노출 중에는 강제 닫기를 불허하여 저장을 유도하거나, 혹은 닫을 수 있게 하되 경고) */}
        {!showRecoveryScreen && (
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1 rounded-lg ${theme.textSub} hover:${theme.textMain} hover:${theme.bgHover} transition`}
          >
            <X size={16} />
          </button>
        )}

        {showRecoveryScreen ? (
          /* 복구 키 화면 (영문으로 통일) */
          <div className="flex flex-col gap-4 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Save Your Recovery Key</h2>
                <p className="text-[9.5px] text-slate-400 mt-0.5">
                  This key is required to reset your password if you ever forget it.
                </p>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/20 py-3.5 px-4 rounded-xl text-center shadow-inner">
              <span className="text-purple-400 font-black tracking-widest text-[13.5px] select-text">
                {generatedRecoveryKey}
              </span>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed text-left">
              This is a **one-time recovery key** and cannot be shown again. Please copy and store it in a secure location.
            </p>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedRecoveryKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2 rounded-xl text-[10px] font-black border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer bg-slate-950/40"
              >
                {copied ? "Copied!" : "Copy Key"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const pwdHashed = await hashPassword(password);
                  const recoveryHashed = await hashPassword(generatedRecoveryKey);
                  onSetupPassword(pwdHashed, recoveryHashed);
                  onSuccess();
                }}
                className="flex-1 py-2 rounded-xl text-[10px] font-black bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md"
              >
                I Saved the Key
              </button>
            </div>
          </div>
        ) : (
          /* 기존 비밀번호 폼 */
          <>
            {/* 헤더 */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black">
                  {isFirstSetup
                    ? t("buddy.pwd.titleSetup", "버디 초기화 비밀번호 설정")
                    : t("buddy.pwd.titleConfirm", "초기화 비밀번호 확인")}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isFirstSetup
                    ? t("buddy.pwd.descSetup", "버디를 삭제/초기화할 때 사용할 마스터 비밀번호를 등록합니다.")
                    : t("buddy.pwd.descConfirm", "버디의 모든 데이터를 초기화하려면 비밀번호를 입력해야 합니다.")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("buddy.pwd.labelPassword", "비밀번호")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full text-xs bg-slate-950 border border-white/[0.08] text-white rounded-lg py-2 px-3 focus:outline-none ${theme.focusBorder}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {isFirstSetup && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("buddy.pwd.labelConfirm", "비밀번호 확인")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full text-xs bg-slate-950 border border-white/[0.08] text-white rounded-lg py-2 px-3 focus:outline-none ${theme.focusBorder}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              )}

              {errorMsg && (
                <span className="text-[10px] font-semibold text-rose-400">
                  ⚠️ {errorMsg}
                </span>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-extrabold ${theme.primary} text-white transition hover:opacity-90 disabled:opacity-50 mt-1`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : isFirstSetup ? (
                  t("common.save", "저장")
                ) : (
                  t("common.confirm", "확인 및 초기화")
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
