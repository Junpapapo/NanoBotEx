export interface AlarmData {
  id: string;
  title: string;
  time: string; // ISO String (예약 시각)
  createdAt: string; // 생성 시각
  isActive: boolean; // 활성화 여부
  source: "memo" | "chat" | "manual"; // 생성 출처
  triggered: boolean; // 이미 발생한 알림인지 여부
}
