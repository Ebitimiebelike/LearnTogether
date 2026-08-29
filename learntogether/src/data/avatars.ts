/** Avatar choices offered during setup. Emoji keep this offline and licence-free. */
export interface Avatar {
  id: string;
  label: string;
  emoji: string;
  /** Tailwind background class for the avatar tile. */
  background: string;
}

export const AVATARS: Avatar[] = [
  { id: "fox", label: "Fox", emoji: "🦊", background: "bg-orange-100" },
  { id: "panda", label: "Panda", emoji: "🐼", background: "bg-slate-100" },
  { id: "owl", label: "Owl", emoji: "🦉", background: "bg-amber-100" },
  { id: "turtle", label: "Turtle", emoji: "🐢", background: "bg-emerald-100" },
  { id: "whale", label: "Whale", emoji: "🐳", background: "bg-sky-100" },
  { id: "cat", label: "Cat", emoji: "🐱", background: "bg-rose-100" },
  { id: "rocket", label: "Rocket", emoji: "🚀", background: "bg-indigo-100" },
  { id: "star", label: "Star", emoji: "⭐", background: "bg-yellow-100" },
];

export const DEFAULT_AVATAR = AVATARS[0].id;

export function getAvatar(id: string): Avatar {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}
