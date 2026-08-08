interface LogoProps {
  size?: "sm" | "lg";
  withMark?: boolean;
}

/**
 * The "X" is rendered as two crossing gradient strokes rather than the letter
 * glyph — a small signature that reads as a transfer/crossing mark (money
 * changing direction) rather than a generic wordmark.
 */
export function Logo({ size = "lg", withMark = true }: LogoProps) {
  const text = size === "lg" ? "text-3xl" : "text-lg";
  const mark = size === "lg" ? 44 : 28;

  return (
    <div className="flex items-center gap-2.5 justify-center">
      {withMark && (
        <svg width={mark} height={mark} viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <rect width="44" height="44" rx="12" fill="url(#xpay-grad)" />
          <path d="M14 14L30 30M30 14L14 30" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
          <defs>
            <linearGradient id="xpay-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F46E5" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <span className={`font-display font-semibold tracking-tight text-white ${text}`}>
        Xpay
      </span>
    </div>
  );
}
