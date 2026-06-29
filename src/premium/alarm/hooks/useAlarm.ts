import { useState, useEffect } from "react";
import { AlarmData } from "../types";

export function useAlarm() {
  const [alarms, setAlarms] = useState<AlarmData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 로컬 스토리지에서 알람 목록 로드
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["nano_alarms"], (result) => {
        if (result.nano_alarms) {
          setAlarms(result.nano_alarms);
        }
        setIsLoaded(true);
      });
    } else {
      // Chrome API 미지원 환경 대비 (로컬 개발 서버 등)
      const local = localStorage.getItem("nano_alarms");
      if (local) {
        setAlarms(JSON.parse(local));
      }
      setIsLoaded(true);
    }
  }, []);

  // 상태 변경 시 스토리지에 자동 저장
  const saveAlarms = (newAlarms: AlarmData[]) => {
    setAlarms(newAlarms);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ nano_alarms: newAlarms });
    } else {
      localStorage.setItem("nano_alarms", JSON.stringify(newAlarms));
    }
  };

  // 알람 등록 helper (chrome.alarms)
  const scheduleChromeAlarm = (alarm: AlarmData) => {
    if (typeof chrome !== "undefined" && chrome.alarms) {
      const targetTime = new Date(alarm.time).getTime();
      const now = Date.now();
      
      // 이미 지난 시각이면 백그라운드 등록 안 함
      if (targetTime <= now) return;

      chrome.alarms.create(alarm.id, {
        when: targetTime
      });
    }
  };

  // 알람 해제 helper (chrome.alarms)
  const cancelChromeAlarm = (id: string) => {
    if (typeof chrome !== "undefined" && chrome.alarms) {
      chrome.alarms.clear(id);
    }
  };

  // 알람 추가
  const addAlarm = (title: string, timeISO: string, source: "memo" | "chat" | "manual" = "manual") => {
    const newAlarm: AlarmData = {
      id: "alarm_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      title,
      time: timeISO,
      createdAt: new Date().toISOString(),
      isActive: true,
      source,
      triggered: false
    };

    const updated = [newAlarm, ...alarms];
    saveAlarms(updated);

    // 미래 시각일 경우 크롬 알람 예약
    scheduleChromeAlarm(newAlarm);
    return newAlarm;
  };

  // 알람 삭제
  const deleteAlarm = (id: string) => {
    cancelChromeAlarm(id);
    const updated = alarms.filter(a => a.id !== id);
    saveAlarms(updated);
  };

  // 알람 활성화/비활성화 토글
  const toggleAlarmActive = (id: string) => {
    const updated = alarms.map(alarm => {
      if (alarm.id === id) {
        const nextActive = !alarm.isActive;
        if (nextActive && !alarm.triggered) {
          scheduleChromeAlarm({ ...alarm, isActive: nextActive });
        } else {
          cancelChromeAlarm(id);
        }
        return { ...alarm, isActive: nextActive };
      }
      return alarm;
    });
    saveAlarms(updated);
  };

  // 알람 발생 처리 (인앱 트리거 확인용)
  const markAsTriggered = (id: string) => {
    const updated = alarms.map(alarm => {
      if (alarm.id === id) {
        return { ...alarm, triggered: true, isActive: false };
      }
      return alarm;
    });
    saveAlarms(updated);
  };

  return {
    alarms,
    isLoaded,
    addAlarm,
    deleteAlarm,
    toggleAlarmActive,
    markAsTriggered
  };
}
