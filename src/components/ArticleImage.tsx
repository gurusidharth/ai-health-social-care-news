"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  gradient: string;
  label: string;
  className?: string;
};

/** Article image with a category-coloured gradient fallback when missing or broken. */
export default function ArticleImage({ src, alt, gradient, label, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2 opacity-80">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
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
      className={`object-cover ${className}`}
    />
  );
}
