// CatClawLogo - inline SVG cat paw logo with gradient

import React from "react";

interface CatClawLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function CatClawLogo({ size = 64, className = "", animated = false }: CatClawLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? "animate-float" : ""} ${className}`}
    >
      <defs>
        <linearGradient id="pawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="pawGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="46" fill="url(#pawGrad)" opacity="0.1" />

      {/* Main pad */}
      <ellipse cx="50" cy="60" rx="20" ry="16" fill="url(#pawGrad)" filter={animated ? "url(#pawGlow)" : undefined} />

      {/* Toe beans */}
      <circle cx="30" cy="38" r="9" fill="url(#pawGrad)" />
      <circle cx="50" cy="30" r="9" fill="url(#pawGrad)" />
      <circle cx="70" cy="38" r="9" fill="url(#pawGrad)" />

      {/* Claw marks (subtle) */}
      <path d="M26 30 L22 22" stroke="url(#pawGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M50 22 L50 14" stroke="url(#pawGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M74 30 L78 22" stroke="url(#pawGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
