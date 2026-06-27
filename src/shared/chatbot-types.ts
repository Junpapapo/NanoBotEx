export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
  suggestions?: any[];
  isWebAnalyzeIntro?: boolean;
  isMenu?: boolean;
  isConfirm?: boolean;
  confirmText?: string;
}

export interface QuickMenuItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  promptKey: string;
  defaultPrompt: string;
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
  // 채팅창 글자 크기 & 폰트
  nano_chat_font_size?: "small" | "medium" | "large";
  nano_chat_font?: "sans" | "inter" | "noto" | "mono";
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

/** 버디 성격 프리셋 */
export type BuddyPersonalityPreset =
  | "caring"       // caring (다정한 친구)
  | "cheerful"     // cheerful (활발한 동생)
  | "tsundere"     // tsundere (츤데레)
  | "wise"         // wise (지적인 멘토)
  | "humorous"     // humorous (유머러스한 개그맨)
  | "calm"         // calm (차분한 상담사)
  | "custom";      // custom (사용자 직접 입력)

/** 버디 메모리 항목 (사용자가 "기억해"라고 요청한 것) */
export interface BuddyMemory {
  id: string;
  content: string;       // 기억할 내용
  createdAt: number;     // 저장 시각
  context?: string;      // 어떤 대화 맥락에서 저장되었는지
}

/** 버디 설정 (Chrome Storage에 저장, 비암호화) */
export interface BuddySettings {
  buddy_avatar: string;
  buddy_name: string;
  buddy_personality_preset: BuddyPersonalityPreset;
  buddy_personality_custom: string;
  buddy_password_hash: string;     // 초기화용 비밀번호 SHA-256 해시
  buddy_initialized: boolean;     // 최초 비밀번호 설정 완료 여부
}

/** 버디 대화 데이터 (암호화된 상태로 저장) */
export interface BuddyChatData {
  messages_encrypted: string;    // AES-GCM 암호화된 Message[] JSON
  memories_encrypted: string;    // AES-GCM 암호화된 BuddyMemory[] JSON
  iv: string;                   // 초기화 벡터 (Base64)
}

