export interface AvatarEntry {
  path: string;
  name: string;
}

export const BUDDY_AVATAR_LIST: AvatarEntry[] = Array.from({ length: 50 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return {
    path: `/buddies/buddy-${num}.webp`,
    name: `Buddy ${num}`,
  };
});
