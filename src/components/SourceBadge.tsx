function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(source: string): string {
  const words = source.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Badge for the actual publisher (e.g. "BBC News"), color+initials derived from the name so it's stable without needing real logos. */
export default function SourceBadge({
  source,
  size = 20,
  className = "",
}: {
  source?: string;
  size?: number;
  className?: string;
}) {
  const label = source?.trim() || "News";
  const hue = hashString(label) % 360;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 text-white font-extrabold leading-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size * 0.42),
        background: `linear-gradient(135deg, hsl(${hue} 55% 38%), hsl(${hue} 55% 20%))`,
      }}
    >
      {initials(label)}
    </span>
  );
}
