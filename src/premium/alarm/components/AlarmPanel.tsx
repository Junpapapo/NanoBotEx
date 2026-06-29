import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Trash2, Clock, Calendar, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { AlarmData } from "../types";

interface AlarmPanelProps {
  alarms: AlarmData[];
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onAddManualAlarm: (title: string, timeISO: string) => void;
  theme: any;
  t: any;
}

export function AlarmPanel({
  alarms,
  onToggleActive,
  onDelete,
  onAddManualAlarm,
  theme,
  t
}: AlarmPanelProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formatAlarmTime = (timeStr: string) => {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${date} ${hours}:${minutes}`;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "memo":
        return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 rounded">{t("premium.alarm.source.memo", "메모")}</span>;
      case "chat":
        return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 rounded">{t("premium.alarm.source.chat", "채팅")}</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 rounded">{t("premium.alarm.source.manual", "수동")}</span>;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newTitle.trim()) {
      setErrorMsg(t("premium.alarm.addForm.errorEmpty", "알람 내용을 입력해주세요."));
      return;
    }
    if (!newDate || !newTime) {
      setErrorMsg(t("premium.alarm.addForm.errorDateTime", "날짜와 시간을 지정해주세요."));
      return;
    }

    const alarmDate = new Date(`${newDate}T${newTime}`);
    if (isNaN(alarmDate.getTime())) {
      setErrorMsg(t("premium.alarm.addForm.errorFormat", "잘못된 날짜/시간 형식입니다."));
      return;
    }

    if (alarmDate.getTime() <= Date.now()) {
      setErrorMsg(t("premium.alarm.addForm.errorPast", "미래의 시간으로 설정해야 합니다."));
      return;
    }

    onAddManualAlarm(newTitle, alarmDate.toISOString());
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setShowAddForm(false);
  };

  const activeAlarms = alarms.filter(a => !a.triggered);
  const historyAlarms = alarms.filter(a => a.triggered);

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs pl-5 pr-4 pt-7 pb-4">
      {/* 타이틀 영역 - absolute 닫기 단추와 겹치지 않게 여백 조정 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0 mb-3 pr-8">
        <div className="flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-indigo-400" />
          <span className="font-bold text-white text-sm">{t("premium.alarm.title", "알람 알리미")}</span>
          <span className="text-[10px] text-slate-400 font-normal">({activeAlarms.length})</span>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {/* 예정된 알람 */}
        <div>
          <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-2">{t("premium.alarm.active", "예정된 알람")}</div>
          {activeAlarms.length === 0 ? (
            <div className="py-6 text-center text-slate-500 border border-dashed border-white/[0.04] rounded-lg">
              {t("premium.alarm.empty", "예정된 알람이 없습니다.")}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {activeAlarms.map((alarm) => (
                  <motion.div
                    key={alarm.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-3 rounded-lg border flex items-start justify-between gap-3 transition-all ${
                      alarm.isActive 
                        ? "bg-white/[0.02] border-white/[0.08]" 
                        : "bg-black/10 border-white/[0.04] opacity-60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {getSourceBadge(alarm.source)}
                        <span className={`text-[11px] font-bold truncate ${alarm.isActive ? "text-white" : "text-slate-400"}`}>
                          {alarm.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3 text-indigo-400/80" />
                        <span>{formatAlarmTime(alarm.time)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-center shrink-0">
                      {/* On/Off Switch */}
                      <button
                        onClick={() => onToggleActive(alarm.id)}
                        className={`w-7 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                          alarm.isActive ? "bg-indigo-600" : "bg-white/10"
                        }`}
                      >
                        <span
                          className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                            alarm.isActive ? "translate-x-3" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {/* 삭제 */}
                      <button
                        onClick={() => onDelete(alarm.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title="알람 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 지난 알람 이력 */}
        {historyAlarms.length > 0 && (
          <div>
            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-2">{t("premium.alarm.history", "알림 완료 이력")}</div>
            <div className="space-y-2 opacity-50">
              {historyAlarms.slice(0, 5).map((alarm) => (
                <div
                  key={alarm.id}
                  className="p-2.5 rounded-lg border border-white/[0.04] bg-black/10 flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-400 line-through truncate">{alarm.title}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{formatAlarmTime(alarm.time)}</span>
                  </div>
                  <button
                    onClick={() => onDelete(alarm.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 새 알람 추가 버튼 및 폼 영역 */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] shrink-0">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2 rounded-lg border border-dashed border-indigo-500/35 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("premium.alarm.addBtn", "새 알람 추가")}
          </button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddSubmit}
            className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg space-y-3"
          >
            <div>
              <input
                type="text"
                placeholder={t("premium.alarm.addForm.placeholder", "알람 메모 입력...")}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-md text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-white text-[11px] focus:outline-none"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-white text-[11px] focus:outline-none"
              />
            </div>
            {errorMsg && <p className="text-[10px] text-rose-400">{errorMsg}</p>}
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 rounded bg-white/5 text-slate-300 hover:bg-white/10 text-[10px] transition cursor-pointer"
              >
                {t("premium.alarm.addForm.cancel", "취소")}
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] transition cursor-pointer"
              >
                {t("premium.alarm.addForm.add", "추가")}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
