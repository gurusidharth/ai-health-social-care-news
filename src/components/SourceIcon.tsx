const PALETTE = [
  "bg-sky-600", "bg-emerald-600", "bg-indigo-600", "bg-purple-600", "bg-amber-600", "bg-rose-600", "bg-teal-600",
];

function colorFor(source: string): string {
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

// No real per-publisher logos are available (Google News links don't point at
// the actual publisher's domain, so favicons can't be fetched reliably) — an
// initial-letter badge gives the same "icon next to source name" rhythm
// without faking data.
export default function SourceIcon({ source }: { source: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold shrink-0 ${colorFor(source)}`}
    >
      {source.charAt(0).toUpperCase()}
    </span>
  );
}
