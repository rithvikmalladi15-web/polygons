import { useId } from "react";

export function LogoMark({ className = "" }: { className?: string }) {
  const gid = useId();
  return (
    <svg className={className || "brand-mark"} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path
        d="M20 3.2 34.2 11.4v16.4L20 35.9 5.8 27.8V11.4L20 3.2z"
        fill={`url(#${gid})`}
      />
      <path
        d="M20 11.2 27.4 15.4v8.4L20 27.9l-7.4-4.1v-8.4L20 11.2z"
        fill="var(--logo-ink)"
        opacity="0.95"
      />
    </svg>
  );
}

export function LogoWordmark() {
  return (
    <span className="brand-word">
      Poly<span className="brand-accent">gons</span>
    </span>
  );
}
