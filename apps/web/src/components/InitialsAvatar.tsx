// A curated set of tasteful two-stop gradients — picked deterministically
// per name (a simple string hash) so the same school/person always gets
// the same color, without needing to store one.
const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-emerald-600",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/** A gradient initials badge — the colorful stand-in for a school/person's logo everywhere the Super Admin console lists them. */
export function InitialsAvatar({ name, size = 40, rounded = "rounded-xl" }: { name: string; size?: number; rounded?: string }) {
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <div
      className={`shrink-0 ${rounded} bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold shadow-sm`}
      style={{ height: size, width: size, fontSize: Math.round(size * 0.38) }}
    >
      {initialsFor(name)}
    </div>
  );
}
