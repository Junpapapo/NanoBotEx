import { UserSettings } from "./chatbot-types";

export const DEFAULT_PERSONA = 
  "You are a friendly and intelligent AI assistant named 'Nano AI'. " +
  "Provide helpful, concise, and professional answers in Korean (반드시 한국어로 답변해 주세요). " +
  "Use markdown formatting when appropriate. " +
  "Keep answers highly readable with bullet points or bold text.";

export const DEFAULT_SETTINGS: UserSettings = {
  nano_ai_avatar: "public/nanobots/bot-default.png",
  nano_ai_avatar_name: "기본 봇",
  nano_ai_random_avatar: false,
  nano_ai_enabled: true,
  nano_ai_bypass: false,
  nano_ai_persona: DEFAULT_PERSONA,
  nano_ai_temperature: 0.7,
  nano_ai_context_level: "detailed",
  nano_chat_width: 480,
  nano_chat_height: 620,
  nano_ratio_lock: false,
  nano_font_size: 12,
  api_mode: "local",
  api_key: "",
  api_url: "https://api.openai.com/v1",
  api_model: "gpt-4o-mini",
  nano_theme_color: "indigo",
  nano_skin_mode: "dark",
  nano_launcher_position: "bottom-right",
  nano_launcher_icon: "message",
  nano_launcher_image: "",
  nano_launcher_hover_image: "",
  nano_launcher_size: "medium",
  nano_launcher_custom_size: 56,
  nano_launcher_tooltip_text: "무엇이든 물어보세요!",
  nano_launcher_tooltip_style: "standard",
  nano_fallback_enabled: false,
  nano_fallback_model: "Llama-3-8B-Web (4.3 GB)",
  nano_fallback_save_path: "C:/NanoBot/models",
  nano_locale: "",
  nano_launcher_mode: "sidepanel", // 기본 기동 모드는 사이드패널
};

export interface ThemePalette {
  name: string;
  colorCode: string;
  primary: string;
  border: string;
  text: string;
  textHover: string;
  bgHover: string;
  bgMuted: string;
  shadow: string;
  gradient: string;
  focusBorder: string;
  glow: string;
  leftPanelGlow: string;
  bookmarksHover: string;
  scrollGlow: string;
  avatarBorder: string;
  bgHeader: string;
  mainShadow: string;
  bgMain: string;
  bgSub: string;
  bgInput: string;
  textMain: string;
  textSub: string;
  borderMuted: string;
}

export const THEME_PALETTES: Record<string, any> = {
  indigo: {
    name: "인디고 Blue",
    colorCode: "#6366f1",
    dark: {
      primary: "bg-indigo-600",
      border: "border-indigo-500/35",
      text: "text-indigo-400",
      textHover: "hover:text-indigo-300",
      bgHover: "hover:bg-indigo-500/10",
      bgMuted: "bg-indigo-500/20",
      shadow: "shadow-[0_0_8px_rgba(99,102,241,0.4)]",
      gradient: "from-indigo-600 to-violet-500",
      focusBorder: "focus:border-indigo-500/80",
      glow: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(99,102,241,0.25)] border-indigo-500/35",
      bookmarksHover: "hover:border-indigo-500/50 hover:bg-indigo-500/10",
      scrollGlow: "bg-[#6366f1]/20 text-[#a5b4fc] border-[#6366f1]/40",
      avatarBorder: "border-indigo-400/20",
      bgHeader: "bg-[#0c122c]/95"
    },
    light: {
      primary: "bg-indigo-600",
      border: "border-indigo-200",
      text: "text-indigo-600",
      textHover: "hover:text-indigo-700",
      bgHover: "hover:bg-indigo-50/80",
      bgMuted: "bg-indigo-50",
      shadow: "shadow-[0_2px_8px_rgba(99,102,241,0.15)]",
      gradient: "from-indigo-600 to-violet-500",
      focusBorder: "focus:border-indigo-400/80",
      glow: "shadow-[0_4px_12px_rgba(99,102,241,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(99,102,241,0.08)] border-indigo-100",
      bookmarksHover: "hover:border-indigo-300 hover:bg-indigo-50/50",
      scrollGlow: "bg-[#6366f1]/10 text-[#4338ca] border-[#6366f1]/20",
      avatarBorder: "border-indigo-100",
      bgHeader: "bg-indigo-50/90"
    }
  },
  rose: {
    name: "로즈 Red",
    colorCode: "#f43f5e",
    dark: {
      primary: "bg-rose-600",
      border: "border-rose-500/35",
      text: "text-rose-400",
      textHover: "hover:text-rose-300",
      bgHover: "hover:bg-rose-500/10",
      bgMuted: "bg-rose-500/20",
      shadow: "shadow-[0_0_8px_rgba(244,63,94,0.4)]",
      gradient: "from-rose-600 to-pink-500",
      focusBorder: "focus:border-rose-500/80",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(244,63,94,0.25)] border-rose-500/35",
      bookmarksHover: "hover:border-rose-500/50 hover:bg-rose-500/10",
      scrollGlow: "bg-[#f43f5e]/20 text-[#fca5a5] border-[#f43f5e]/40",
      avatarBorder: "border-rose-400/20",
      bgHeader: "bg-[#140b12]/95"
    },
    light: {
      primary: "bg-rose-600",
      border: "border-rose-200",
      text: "text-rose-600",
      textHover: "hover:text-rose-700",
      bgHover: "hover:bg-rose-50/80",
      bgMuted: "bg-rose-50",
      shadow: "shadow-[0_2px_8px_rgba(244,63,94,0.15)]",
      gradient: "from-rose-600 to-pink-500",
      focusBorder: "focus:border-rose-400/80",
      glow: "shadow-[0_4px_12px_rgba(244,63,94,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(244,63,94,0.08)] border-rose-100",
      bookmarksHover: "hover:border-rose-300 hover:bg-rose-50/50",
      scrollGlow: "bg-[#f43f5e]/10 text-[#991b1b] border-[#f43f5e]/20",
      avatarBorder: "border-rose-100",
      bgHeader: "bg-rose-50/90"
    }
  },
  emerald: {
    name: "에메랄드 Green",
    colorCode: "#10b981",
    dark: {
      primary: "bg-emerald-600",
      border: "border-emerald-500/35",
      text: "text-emerald-400",
      textHover: "hover:text-emerald-300",
      bgHover: "hover:bg-emerald-500/10",
      bgMuted: "bg-emerald-500/20",
      shadow: "shadow-[0_0_8px_rgba(16,185,129,0.4)]",
      gradient: "from-emerald-600 to-teal-500",
      focusBorder: "focus:border-emerald-500/80",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(16,185,129,0.25)] border-emerald-500/35",
      bookmarksHover: "hover:border-emerald-500/50 hover:bg-emerald-500/10",
      scrollGlow: "bg-[#10b981]/20 text-[#a7f3d0] border-[#10b981]/40",
      avatarBorder: "border-emerald-400/20",
      bgHeader: "bg-[#06140f]/95"
    },
    light: {
      primary: "bg-emerald-600",
      border: "border-emerald-200",
      text: "text-emerald-600",
      textHover: "hover:text-emerald-700",
      bgHover: "hover:bg-emerald-50/80",
      bgMuted: "bg-emerald-50",
      shadow: "shadow-[0_2px_8px_rgba(16,185,129,0.15)]",
      gradient: "from-emerald-600 to-teal-500",
      focusBorder: "focus:border-emerald-400/80",
      glow: "shadow-[0_4px_12px_rgba(16,185,129,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(16,185,129,0.08)] border-emerald-100",
      bookmarksHover: "hover:border-emerald-300 hover:bg-emerald-50/50",
      scrollGlow: "bg-[#10b981]/10 text-[#065f46] border-[#10b981]/20",
      avatarBorder: "border-emerald-100",
      bgHeader: "bg-emerald-50/90"
    }
  },
  amber: {
    name: "앰버 Gold",
    colorCode: "#f59e0b",
    dark: {
      primary: "bg-amber-600",
      border: "border-amber-500/35",
      text: "text-amber-400",
      textHover: "hover:text-amber-300",
      bgHover: "hover:bg-amber-500/10",
      bgMuted: "bg-amber-500/20",
      shadow: "shadow-[0_0_8px_rgba(245,158,11,0.4)]",
      gradient: "from-amber-600 to-orange-500",
      focusBorder: "focus:border-amber-500/80",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(245,158,11,0.25)] border-amber-500/35",
      bookmarksHover: "hover:border-amber-500/50 hover:bg-amber-500/10",
      scrollGlow: "bg-[#f59e0b]/20 text-[#fde68a] border-[#f59e0b]/40",
      avatarBorder: "border-amber-400/20",
      bgHeader: "bg-[#141006]/95"
    },
    light: {
      primary: "bg-amber-600",
      border: "border-amber-200",
      text: "text-amber-700",
      textHover: "hover:text-amber-800",
      bgHover: "hover:bg-amber-50/80",
      bgMuted: "bg-amber-50",
      shadow: "shadow-[0_2px_8px_rgba(245,158,11,0.15)]",
      gradient: "from-amber-600 to-orange-500",
      focusBorder: "focus:border-amber-400/80",
      glow: "shadow-[0_4px_12px_rgba(245,158,11,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(245,158,11,0.08)] border-amber-100",
      bookmarksHover: "hover:border-amber-300 hover:bg-amber-50/50",
      scrollGlow: "bg-[#f59e0b]/10 text-[#92400e] border-[#f59e0b]/20",
      avatarBorder: "border-amber-100",
      bgHeader: "bg-amber-50/90"
    }
  },
  violet: {
    name: "바이올렛 Purple",
    colorCode: "#8b5cf6",
    dark: {
      primary: "bg-violet-600",
      border: "border-violet-500/35",
      text: "text-violet-400",
      textHover: "hover:text-violet-300",
      bgHover: "hover:bg-violet-50/50",
      bgMuted: "bg-violet-500/20",
      shadow: "shadow-[0_0_8px_rgba(139,92,246,0.4)]",
      gradient: "from-violet-600 to-fuchsia-500",
      focusBorder: "focus:border-violet-500/80",
      glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(139,92,246,0.25)] border-violet-500/35",
      bookmarksHover: "hover:border-violet-500/50 hover:bg-violet-500/10",
      scrollGlow: "bg-[#8b5cf6]/20 text-[#ddd6fe] border-[#8b5cf6]/40",
      avatarBorder: "border-violet-400/20",
      bgHeader: "bg-[#0f0b1a]/95"
    },
    light: {
      primary: "bg-violet-600",
      border: "border-violet-200",
      text: "text-violet-600",
      textHover: "hover:text-violet-700",
      bgHover: "hover:bg-violet-50/80",
      bgMuted: "bg-violet-50",
      shadow: "shadow-[0_2px_8px_rgba(139,92,246,0.15)]",
      gradient: "from-violet-600 to-fuchsia-500",
      focusBorder: "focus:border-violet-400/80",
      glow: "shadow-[0_4px_12px_rgba(139,92,246,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(139,92,246,0.08)] border-violet-100",
      bookmarksHover: "hover:border-violet-300 hover:bg-violet-50/50",
      scrollGlow: "bg-[#8b5cf6]/10 text-[#5b21b6] border-[#8b5cf6]/20",
      avatarBorder: "border-violet-100",
      bgHeader: "bg-violet-50/90"
    }
  }
};

export function getThemePalette(colorKey: string, skinMode: "dark" | "light" = "dark"): ThemePalette {
  const isLight = skinMode === "light";
  const selectedTheme = THEME_PALETTES[colorKey] || THEME_PALETTES.indigo;
  const colorStyles = isLight ? selectedTheme.light : selectedTheme.dark;

  const skinStyles = {
    bgMain: isLight ? "bg-slate-50/98 backdrop-blur-md" : "bg-[#080e21]/95",
    bgSub: isLight ? "bg-white/98" : "bg-[#060a18]/95",
    bgInput: isLight ? "bg-[#f1f5f9]/80" : "bg-slate-950/80",
    textMain: isLight ? "text-slate-800" : "text-slate-100",
    textSub: isLight ? "text-slate-500" : "text-slate-400",
    borderMuted: isLight ? "border-slate-200/50" : "border-white/[0.05]",
    mainShadow: isLight ? "shadow-[0_12px_40px_rgba(15,23,42,0.06)]" : "shadow-[0_12px_45px_rgba(0,0,0,0.8)]"
  };

  return {
    name: selectedTheme.name,
    colorCode: selectedTheme.colorCode,
    ...colorStyles,
    ...skinStyles
  };
}

export const API_BASE_URL = "http://127.0.0.1:5001";

export const DEFAULT_SKILLS = [
  {
    id: "proofread",
    title: "문법/맞춤법 교정",
    description: "문장의 문법 오류나 맞춤법을 정확하게 바로잡아 줍니다.",
    prompt: "다음 텍스트의 맞춤법, 띄어쓰기, 문법 오류를 올바르게 수정하고, 어떤 부분이 수정되었는지 간단히 짚어주세요:\n\n",
    icon: "CheckSquare"
  },
  {
    id: "summarize",
    title: "텍스트 요약",
    description: "긴 텍스트를 핵심 요약형식으로 요점만 정리해 줍니다.",
    prompt: "다음 텍스트를 글머리 기호를 사용해 3줄 내외의 핵심 내용으로 깔끔하게 요약해 주세요:\n\n",
    icon: "FileText"
  },
  {
    id: "tone_change",
    title: "비즈니스 톤 변환",
    description: "일반 대화체 문장을 격식 있는 이메일이나 비즈니스 톤으로 변환해 줍니다.",
    prompt: "다음 메시지를 공손하고 격식 있는 비즈니스 메일/메시지 톤으로 다듬어 주세요:\n\n",
    icon: "Send"
  },
  {
    id: "translate",
    title: "다국어 번역",
    description: "입력한 문장을 한국어, 영어, 일본어, 중국어 등으로 번역해 줍니다.",
    prompt: "다음 문장이 한국어면 영어로 번역하고, 영어 등 타 언어면 자연스러운 한국어로 번역해 주세요:\n\n",
    icon: "Languages"
  }
];

