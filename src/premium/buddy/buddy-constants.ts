import { QuickMenuItem } from "../../shared/chatbot-types";

export const BUDDY_QUICK_MENU_ITEMS: QuickMenuItem[] = [
  {
    id: "guide",
    labelKey: "buddy.quickMenu.items.guide.label",
    defaultLabel: "🐾 가이드 안내",
    promptKey: "buddy.quickMenu.items.guide.prompt",
    defaultPrompt: "/buddy/guide"
  },
  {
    id: "save",
    labelKey: "buddy.quickMenu.items.save.label",
    defaultLabel: "💾 기억 저장 요청",
    promptKey: "buddy.quickMenu.items.save.prompt",
    defaultPrompt: "/buddy/save"
  },
  {
    id: "view",
    labelKey: "buddy.quickMenu.items.view.label",
    defaultLabel: "🧠 기억 목록 확인",
    promptKey: "buddy.quickMenu.items.view.prompt",
    defaultPrompt: "/buddy/view"
  }
];
