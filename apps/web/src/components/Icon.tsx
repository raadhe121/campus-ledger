import type { CSSProperties } from "react";

/**
 * Renders one glyph from the Material Symbols Outlined font (loaded in
 * index.html) by its ligature name — e.g. <Icon name="dashboard" />. Keeps
 * every icon in the app on one consistent line-icon set instead of mixing
 * emoji and ad-hoc SVGs.
 */
export function Icon({
  name,
  className = "",
  filled = false,
  size,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}) {
  const style: CSSProperties = {
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    lineHeight: 1,
    ...(size ? { fontSize: size } : {}),
  };

  return (
    <span aria-hidden="true" className={`material-symbols-outlined select-none ${className}`} style={style}>
      {name}
    </span>
  );
}
