import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Calendar, Clock } from "lucide-react";

interface AlarmDialogProps {
  isOpen: boolean;
  defaultTitle: string;
  onClose: () => void;
  onSave: (title: string, timeISO: string) => void;
  t: any;
  locale: string;
}

export function AlarmDialog({
  isOpen,
  defaultTitle,
  onClose,
  onSave,
  t,
  locale
}: AlarmDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      // 30자 이내로 문자열을 깔끔하게 자름
      const truncatedTitle = defaultTitle.trim().slice(0, 30) + (defaultTitle.length > 30 ? "..." : "");
      setTitle(truncatedTitle || "알람 알림");
      
      // 로컬 타임존 기반 현재 날짜/시간을 디폴트로 지정
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      setDate(dateStr);
      setTime(timeStr);
      setErrorMsg("");
    }
  }, [isOpen, defaultTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg(t("premium.alarm.dialog.errorTitle", "알람 제목을 입력해 주세요."));
      return;
    }

    if (!date || !time) {
      setErrorMsg(t("premium.alarm.addForm.errorDateTime", "날짜와 시간을 지정해주세요."));
      return;
    }

    const alarmDateTime = new Date(`${date}T${time}`);
    if (isNaN(alarmDateTime.getTime())) {
      setErrorMsg(t("premium.alarm.addForm.errorFormat", "잘못된 날짜/시간 형식입니다."));
      return;
    }

    if (alarmDateTime.getTime() <= Date.now()) {
      setErrorMsg(t("premium.alarm.addForm.errorPast", "알람 시간은 현재 시각보다 미래여야 합니다."));
      return;
    }

    onSave(title, alarmDateTime.toISOString());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0c122c]/95 p-5 shadow-2xl relative"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-indigo-400">
              <Bell className="h-4 w-4" />
              <h3 className="text-sm font-bold text-white">{t("premium.alarm.dialog.title", "알람 예약 설정")}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t("premium.alarm.dialog.labelContent", "알람 내용")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder={t("premium.alarm.addForm.placeholder", "알람 메시지를 입력하세요")}
                className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-indigo-400" />
                  {t("premium.alarm.dialog.labelDate", "날짜")}
                </label>
                <input
                  type="date"
                  lang={locale}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-2 py-1.5 text-[10px] bg-slate-900 border border-white/10 rounded-lg text-white hover:border-indigo-500/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  {t("premium.alarm.dialog.labelTime", "시간")}
                </label>
                <input
                  type="time"
                  lang={locale}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-2 py-1.5 text-[10px] bg-slate-900 border border-white/10 rounded-lg text-white hover:border-indigo-500/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
            )}

            {/* 버튼 */}
            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                {t("premium.alarm.addForm.cancel", "취소")}
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                {t("premium.alarm.dialog.btnSave", "알람 설정")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
