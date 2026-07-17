"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  gradient: string;
  label: string;
  source?: string;
  className?: string;
  showLabel?: boolean;
};

/** Article image with a category-coloured gradient fallback when missing, broken, or a degenerate 1x1 tracking-pixel URL. */
export default function ArticleImage({ src, alt, gradient, label, source, className = "", showLabel = true }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`relative bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden ${className}`}>
        {/* soft glow blobs for depth, so it reads as a designed placeholder rather than a flat block */}
        <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-1/3 -right-1/4 w-2/3 h-2/3 rounded-full bg-black/15 blur-2xl" />
        {/* dot-grid texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
        {/* large watermark icon, always visible even without the text label */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute w-2/5 h-2/5 text-white/20"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        {showLabel && (
          <div className="relative flex flex-col items-center gap-1.5 opacity-90">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="text-white text-xs font-bold uppercase tracking-widest">{label}</span>
            {source && <span className="text-white/70 text-[11px] font-medium">via {source}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 4 || img.naturalHeight <= 4) setFailed(true);
      }}
      className={`object-cover ${className}`}
    />
  );
}
