export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  suggestions?: any[];
  isWebAnalyzeIntro?: boolean;
}

export type ScenarioType =
  | "none"
  | "PRICE_CHECK"
  | "NEWS_CHECK"
  | "PAGE_ANALYZE"
  | "MARKET_BRIEFING"
  | "KR_BRIEFING"
  | "GLOBAL_INDICES"
  | "CALENDAR_CHECK"
  | "TOP_PICKS"
  | "SMART_FLOW"
  | "MACRO_CHECK"
  | "PORTFOLIO_OPT"
  | "NET_BUYING"
  | "TPOCKET_SHORTCUTS";

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
  scenario: ScenarioType;
}

export interface StockContext {
  ticker: string;
  name: string;
  price: number;
  market: string;
  currency?: string;
}

export interface UserSettings {
  nano_ai_avatar: string;
  nano_ai_avatar_name: string;
  nano_ai_random_avatar: boolean;
  nano_ai_enabled: boolean;
  nano_ai_bypass: boolean;
  nano_ai_persona: string;
  nano_ai_temperature: number;
  nano_ai_context_level: "minimal" | "standard" | "detailed";
  api_mode: "local" | "api";
  api_key?: string;
  api_url: string;
  api_model: string;
  nano_theme_color?: string;
  nano_skin_mode?: "dark" | "light"; // 스킨 모드 (dark / light)
  nano_launcher_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  nano_launcher_icon: "message" | "bot" | "cpu" | "sparkles" | "custom";
  nano_launcher_image: string;       // 기본 상태 이미지 (비어있으면 기본 플로팅 버튼)
  nano_launcher_hover_image: string; // 호버 시 이미지 (비어있으면 nano_launcher_image 사용)
  nano_launcher_size: "small" | "medium" | "large" | "original" | "custom";
  nano_launcher_custom_size: number;
  nano_launcher_tooltip_text: string;
  nano_launcher_tooltip_style: "standard" | "glow" | "modern" | "speech";
  nano_fallback_enabled: boolean;
  nano_fallback_model: string;
  nano_fallback_save_path: string;
  nano_locale?: string;
  // 크롬 확장 기동 모드 설정
  nano_launcher_mode?: "sidepanel" | "widget";
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface ChatbotContextType {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  setIsEnabled: (enabled: boolean) => void;
  checkAvailability: () => Promise<boolean>;
  createSession: (systemPrompt?: string) => Promise<any>;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  skills: Skill[];
  loadSkills: () => Promise<void>;
  activeSkill: Skill | null;
  setActiveSkill: (skill: Skill | null) => void;
  effectiveAIAvatar: string;
}
