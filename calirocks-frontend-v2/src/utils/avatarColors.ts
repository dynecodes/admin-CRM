const AVATAR_COLORS = [
  'bg-teal-600',
  'bg-rose-600',
  'bg-orange-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-red-600',
  'bg-amber-600',
  'bg-lime-600',
  'bg-green-600',
  'bg-emerald-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-rose-600',
];

export function getAvatarColor(userId: number): string {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}