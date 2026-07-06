import { UserSettings } from "./chatbot-types";

export const DEFAULT_PERSONA = 
  "You are a friendly and intelligent AI assistant named 'NanoBot'. " +
  "Provide helpful, concise, and professional answers. " +
  "Use markdown formatting when appropriate. " +
  "Keep answers highly readable with bullet points or bold text.";

export const DEFAULT_SETTINGS: UserSettings = {
  nano_ai_avatar: "/nanobots/bot-01.webp",
  nano_ai_avatar_name: "NanoBot",
  nano_ai_random_avatar: false,
  nano_ai_enabled: true,
  nano_ai_bypass: false,
  nano_ai_persona: DEFAULT_PERSONA,
  nano_ai_temperature: 0.7,
  nano_ai_context_level: "standard",
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
  nano_session_timeout_minutes: 60, // 세션 최대 유지 시간 (분), 0 = 비활성화
  nano_web_search_mode: "auto",
  tutor_lang: "en",
  tutor_level: "adult",
  tutor_difficulty: "intermediate",
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
  },
  beige: {
    name: "크림 Yellow",
    colorCode: "#fef08a",
    dark: {
      primary: "bg-yellow-500",
      border: "border-yellow-500/35",
      text: "text-yellow-400",
      textHover: "hover:text-yellow-300",
      bgHover: "hover:bg-yellow-500/10",
      bgMuted: "bg-yellow-500/20",
      shadow: "shadow-[0_0_8px_rgba(254,240,138,0.4)]",
      gradient: "from-yellow-500 to-yellow-400",
      focusBorder: "focus:border-yellow-500/80",
      glow: "shadow-[0_0_20px_rgba(254,240,138,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(254,240,138,0.25)] border-yellow-500/35",
      bookmarksHover: "hover:border-yellow-500/50 hover:bg-yellow-500/10",
      scrollGlow: "bg-[#fef08a]/20 text-[#fef9c3] border-[#fef08a]/40",
      avatarBorder: "border-yellow-400/20",
      bgHeader: "bg-[#14140c]/95"
    },
    light: {
      primary: "bg-yellow-500",
      border: "border-yellow-200",
      text: "text-yellow-650",
      textHover: "hover:text-yellow-700",
      bgHover: "hover:bg-yellow-50/80",
      bgMuted: "bg-yellow-50",
      shadow: "shadow-[0_2px_8px_rgba(254,240,138,0.15)]",
      gradient: "from-yellow-500 to-yellow-600",
      focusBorder: "focus:border-yellow-500/80",
      glow: "shadow-[0_4px_12px_rgba(254,240,138,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(254,240,138,0.08)] border-yellow-100",
      bookmarksHover: "hover:border-yellow-400 hover:bg-yellow-50/50",
      scrollGlow: "bg-[#fef08a]/10 text-[#854d0e] border-[#fef08a]/20",
      avatarBorder: "border-yellow-200",
      bgHeader: "bg-yellow-50/90"
    }
  },
  charcoal: {
    name: "스틸 Charcoal",
    colorCode: "#64748b",
    dark: {
      primary: "bg-slate-600",
      border: "border-slate-500/35",
      text: "text-slate-400",
      textHover: "hover:text-slate-350",
      bgHover: "hover:bg-slate-500/10",
      bgMuted: "bg-slate-500/20",
      shadow: "shadow-[0_0_8px_rgba(100,116,139,0.4)]",
      gradient: "from-slate-600 to-slate-500",
      focusBorder: "focus:border-slate-500/80",
      glow: "shadow-[0_0_20px_rgba(100,116,139,0.15)]",
      leftPanelGlow: "shadow-[0_0_40px_rgba(100,116,139,0.25)] border-slate-500/35",
      bookmarksHover: "hover:border-slate-500/50 hover:bg-slate-500/10",
      scrollGlow: "bg-[#64748b]/20 text-[#cbd5e1] border-[#64748b]/40",
      avatarBorder: "border-slate-400/20",
      bgHeader: "bg-[#0f1115]/95"
    },
    light: {
      primary: "bg-slate-600",
      border: "border-slate-200",
      text: "text-slate-600",
      textHover: "hover:text-slate-700",
      bgHover: "hover:bg-slate-50/80",
      bgMuted: "bg-slate-50",
      shadow: "shadow-[0_2px_8px_rgba(100,116,139,0.15)]",
      gradient: "from-slate-600 to-slate-500",
      focusBorder: "focus:border-slate-400/80",
      glow: "shadow-[0_4px_12px_rgba(100,116,139,0.06)]",
      leftPanelGlow: "shadow-[0_4px_25px_rgba(100,116,139,0.08)] border-slate-100",
      bookmarksHover: "hover:border-slate-300 hover:bg-slate-50/50",
      scrollGlow: "bg-[#64748b]/10 text-[#334155] border-[#64748b]/20",
      avatarBorder: "border-slate-100",
      bgHeader: "bg-slate-100/90"
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


export const DEFAULT_SKILLS = [
  {
    id: "business_editor",
    title: "Business Email Editor",
    description: "Drafts and refines formal and professional business email drafts based on scenarios.",
    prompt: `You are a global business communication expert and an email editor. Based on the core content or draft provided by the user, you write or refine a perfect and professional business email tailored to the recipient and scenario.

[Response Guidelines]
1. Clear Purpose Classification: Provide two versions: a formal email (Formal) and a friendly business email (Semi-formal) for the user to choose from.
2. Core Structure Compliance: Ensure the email strictly follows the standard email structure: Subject, Salutation, Body, and Closing.
3. Professional Refinement: When refining a draft, clearly point out 2-3 key changes, explaining how the vocabulary or nuance was improved.`,
    icon: "Mail"
  },
  {
    id: "code_mentor",
    title: "Senior Dev Mentor",
    description: "Provides feedback on written code, and mentors on better architecture and design.",
    prompt: `You are a friendly mentoring senior software engineer with over 15 years of experience. Your task is to diagnose issues in code submitted by the user and guide them in designing a more productive and robust architecture.

[Response Guidelines]
1. Warm and Encouraging Tone: Answer with encouragement and praise, like a friendly mentor helping a junior developer grow.
2. Architectural and Clean Code Advice: Point out improvements from the perspective of readability, maintainability, and scalability (e.g., SOLID principles, Clean Architecture) beyond simple bug fixes.
3. Before/After Refactoring Comparison: Always present the proposed solutions by clearly comparing the code before and after refactoring using Markdown code blocks.
4. Recommended Keywords: At the end of your answer, suggest 2-3 technical keywords or concepts that the mentee should study further, along with hashtags (#).`,
    icon: "Terminal"
  },
  {
    id: "code_reviewer",
    title: "Code Reviewer",
    description: "Finds problems in submitted code and suggests improvement ideas.",
    prompt: `You are a senior software engineer and a code reviewer. Carefully review the syntax errors, potential bugs, readability, and performance aspects of the code provided by the user, and present specific refactoring suggestions along with modified code.`,
    icon: "Cpu"
  },
  {
    id: "summarizer",
    title: "Text Summarizer",
    description: "Summarizes long text into 3 clean, key points.",
    prompt: `You are a document summarization expert. Analyze the core content of the text entered below, and clearly summarize the most important 3 points using bullet points (•). Prioritize readability.`,
    icon: "FileText"
  },
  {
    id: "translator",
    title: "Multilingual Translator",
    description: "Performs natural translation between English, Korean, and other languages.",
    prompt: `You are a professional translator. Translate the sentences entered by the user according to the following rules:
1. If the input sentence is Korean, translate it into natural English.
2. If the input sentence is English or another language, translate it into natural Korean.
3. Do not make any comments or meta-remarks other than the translation result.`,
    icon: "Languages"
  },
  {
    id: "tutor",
    title: "Friendly AI Teacher",
    description: "Explains complex concepts easily at a student's level using text, tables, and examples.",
    prompt: `You are a friendly and dependable academic helper and concept tutor. No matter what the user asks, teach them easily and kindly based on the following rules.

[Response Guidelines]
1. Use Analogies: When explaining the core concepts of a question, start by mixing analogies with objects that are easily accessible in daily life.
2. Use Tables: When contrasting complex theories or two or more features, be sure to diagram them in a Markdown table for a clean comparison.
3. Use Examples (Language): If they ask about language, vocabulary, or English sentence structures, add 3 vivid examples that native speakers can immediately use in real life, along with pronunciation/usage tips.
4. Summary Quiz: At the end of all explanations, present a fun '1 multiple-choice quiz' (hide the explanation and answer using collapsible/spoiler blocks) to check and review the core concepts learned.`,
    icon: "HelpCircle"
  },
  {
    id: "visualizer",
    title: "Data Visualization & Table Maker",
    description: "Processes complex text data into neat tables and visual charts.",
    prompt: `You are a data reporting and visual processing expert. Structure and process various text information, raw data, or statistical data entered by the user to make it look clean.

[Response Guidelines]
1. Table Prioritization: First, completely convert statistics, lists, or comparison indicators that can be structured into Markdown tables.
2. Create Dedicated Charts: If time-series trends containing dates or stock data are provided, visualize the data by appropriately using the special chart block codes below that the component can render.
- Line Chart Example:
\`\`\`chart-line
2026-06-01: 100
2026-06-02: 120
\`\`\`
- Portfolio Weight Chart Example:
\`\`\`chart-pie
US Stocks: 50
Korean Stocks: 30
\`\`\`
3. Key Summary: Attach a clear 3-line summary of key insights (bullet points) below the data.`,
    icon: "LineChart"
  }
];

// AUTO 검색 모드 판단을 위한 실시간성 다국어 키워드 매핑 테이블
export const TEMPORAL_KEYWORDS_MAP: Record<string, string[]> = {
  ko: [
    // 시간/시점
    "오늘", "어제", "내일", "최근", "최신", "현재", "지금", "방금", "이번주", "이번달", "올해", "시간", "시각", "일정", "실시간",
    // 날씨/재난/교통
    "날씨", "지진", "태풍", "교통", "사고", 
    // 경제/금융
    "주가", "환율", "비트코인", "코인", "금리", "가상화폐", "시세", "가격",
    // 뉴스/이슈
    "뉴스", "기사", "트렌드", "이슈", "대통령", "속보", "논란", "사건", "업데이트",
    // 스포츠/결과
    "결과", "순위", "경기", "야구", "축구", "스포츠", "스코어", "올림픽", "월드컵", "생중계",
    // 엔터테인먼트/문화
    "차트", "개봉", "상영작", "예매", "콘서트", "컴백", "라이브"
  ],
  en: [
    // 시간/시점
    "today", "yesterday", "tomorrow", "recent", "latest", "current", "now", "just now", "this week", "this month", "this year", "time", "schedule", "real-time",
    // 날씨/재난/교통
    "weather", "earthquake", "typhoon", "hurricane", "traffic", "accident",
    // 경제/금융
    "stock", "exchange rate", "bitcoin", "crypto", "interest rate", "price",
    // 뉴스/이슈
    "news", "trend", "issue", "president", "breaking news", "update", "scandal",
    // 스포츠/결과
    "result", "rank", "match", "game", "score", "sports", "baseball", "soccer", "olympics", "world cup", "live stream",
    // 엔터테인먼트/문화
    "chart", "release", "movies", "tickets", "concert", "live"
  ],
  ja: [
    // 시간/시점
    "今日", "昨日", "明日", "最近", "最新", "現在", "今", "先ほど", "今週", "今月", "今年", "時間", "予定", "スケジュール", "リアルタイム",
    // 날씨/재난/교통
    "天気", "地震", "台風", "交通", "事故",
    // 경제/금융
    "株価", "為替", "ビットコイン", "仮想通貨", "金利", "価格", "相場",
    // 뉴스/이슈
    "ニュース", "記事", "トレンド", "イシュー", "大統領", "速報", "炎上", "事件", "アップデート",
    // 스포츠/결과
    "結果", "順位", "試合", "スポーツ", "スコア", "野球", "サッカー", "オリンピック", "ワールドカップ", "生中継",
    // 엔터테인먼트/문화
    "チャート", "公開", "上映", "チケット", "コンサート", "ライブ"
  ]
};

// 3개 국어 통합 매핑 배열로 평탄화 (다국어 혼용 입력 대응)
export const ALL_TEMPORAL_KEYWORDS = Object.values(TEMPORAL_KEYWORDS_MAP).flat();



