export interface AvatarEntry {
  path: string;       // public 경로 (/nanobots/...)
  name: string;       // 기본 표시 이름
}

// SVG 원조 로봇 (path 빈 문자열로 구분)
export const AVATAR_SVG_ENTRY: AvatarEntry = { path: "", name: "Original Bot" };

export const AVATAR_LIST: AvatarEntry[] = [
  { path: "/nanobots/bot-01.webp",      name: "Bot 01" },
  { path: "/nanobots/bot-02.webp",      name: "Bot 02" },
  { path: "/nanobots/bot-03.webp",      name: "Bot 03" },
  { path: "/nanobots/bot-04.webp",      name: "Bot 04" },
  { path: "/nanobots/bot-05.webp",      name: "Bot 05" },
  { path: "/nanobots/bot-06.webp",      name: "Bot 06" },
  { path: "/nanobots/bot-07.webp",      name: "Bot 07" },
  { path: "/nanobots/bot-08.webp",      name: "Bot 08" },
  { path: "/nanobots/bot-09.webp",      name: "Bot 09" },
  { path: "/nanobots/bot-10.webp",      name: "Bot 10" },
  { path: "/nanobots/bot-11.webp",      name: "Bot 11" },
  { path: "/nanobots/bot-12.webp",      name: "Bot 12" },
  { path: "/nanobots/bot-13.webp",      name: "Bot 13" },
  { path: "/nanobots/bot-15.webp",      name: "Bot 15" },
  { path: "/nanobots/bot-16.webp",      name: "Bot 16" },
  { path: "/nanobots/bot-17.webp",      name: "Bot 17" },
  { path: "/nanobots/bot-18.webp",      name: "Bot 18" },
  { path: "/nanobots/bot-19.webp",      name: "Bot 19" },
  { path: "/nanobots/bot-20.webp",      name: "Bot 20" },
  { path: "/nanobots/bot-21.webp",      name: "Bot 21" },
  { path: "/nanobots/bot-22.webp",      name: "Bot 22" },
  { path: "/nanobots/bot-23.webp",      name: "Bot 23" },
  { path: "/nanobots/bot-24.webp",      name: "Bot 24" },
  { path: "/nanobots/bot-25.webp",      name: "Bot 25" },
  { path: "/nanobots/bot-26.webp",      name: "Bot 26" },
  { path: "/nanobots/bot-27.webp",      name: "Bot 27" }
];

export const ALL_AVATARS: AvatarEntry[] = [AVATAR_SVG_ENTRY, ...AVATAR_LIST];
