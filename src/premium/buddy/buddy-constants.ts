import { QuickMenuItem } from "../../shared/chatbot-types";

export const BUDDY_QUICK_MENU_ITEMS: QuickMenuItem[] = [
  {
    id: "guide",
    labelKey: "buddy.quickMenu.items.guide.label",
    defaultLabel: "🐾 가이드 안내",
    promptKey: "buddy.quickMenu.items.guide.prompt",
    defaultPrompt: "버디의 핵심 특징과 메모리(기억) 시스템 사용 팁을 알려줘."
  },
  {
    id: "save",
    labelKey: "buddy.quickMenu.items.save.label",
    defaultLabel: "💾 기억 저장 요청",
    promptKey: "buddy.quickMenu.items.save.prompt",
    defaultPrompt: "내 취미는 코딩과 음악 감상이야. 이거 꼭 기억해줘."
  },
  {
    id: "view",
    labelKey: "buddy.quickMenu.items.view.label",
    defaultLabel: "🧠 기억 목록 확인",
    promptKey: "buddy.quickMenu.items.view.prompt",
    defaultPrompt: "나에 대해서 네가 현재 기억하고 있는 모든 사실들을 알려줘."
  }
];
