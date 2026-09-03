/** Picks readable text (near-black or white) for a given background hex, via the standard relative-luminance formula — so a school's own accent color never has to be pre-checked for contrast by hand. */
function readableInkFor(hex: string): string {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
}

/** Sets `--brand`/`--brand-ink` on the document root from the school's own themeColor — the one piece of "this is our site" branding a deployment gets, applied once data loads (see App.tsx). */
export function applyBrandColor(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--brand-ink", readableInkFor(hex));
}
