import React, { useState } from "react";
import { hashPassword } from "../utils/buddy-crypto";
import { ShieldAlert, X } from "lucide-react";

interface BuddyPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPasswordHash: string;
  isFirstSetup: boolean; // 최초 비밀번호 등록 모드 여부
  onSetupPassword: (hash: string) => void;
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
      const hashed = await hashPassword(password);

      if (isFirstSetup) {
        // 최초 설정
        if (password !== confirmPassword) {
          setErrorMsg(t("buddy.pwd.mismatch", "비밀번호가 서로 일치하지 않습니다."));
          setIsLoading(false);
          return;
        }
        onSetupPassword(hashed);
        onSuccess();
      } else {
        // 초기화 시 검증
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
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-lg ${theme.textSub} hover:${theme.textMain} hover:${theme.bgHover} transition`}
        >
          <X size={16} />
        </button>

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

        {/* 폼 */}
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
      </div>
    </div>
  );
}
