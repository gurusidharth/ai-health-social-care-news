import { getCategory } from "@/lib/news";

export default function SourceBadge({
  category,
  size = 20,
  className = "",
}: {
  category?: string;
  size?: number;
  className?: string;
}) {
  const cat = getCategory(category ?? "");
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${cat?.gradient ?? "from-slate-700 to-slate-900"} shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </span>
  );
}
