export function Nurse({ moving }: { moving: boolean }) {
  return (
    <div className={moving ? "animate-throb" : "animate-bob"}>
      <svg viewBox="0 0 48 60" className="h-full w-full drop-shadow-md">
        {/* legs */}
        <rect x="17" y="42" width="6" height="13" rx="3" fill="oklch(0.45 0.1 200)" />
        <rect x="25" y="42" width="6" height="13" rx="3" fill="oklch(0.45 0.1 200)" />
        {/* body */}
        <rect
          x="11"
          y="24"
          width="26"
          height="22"
          rx="9"
          fill="var(--color-scrub)"
        />
        <rect x="22" y="26" width="4" height="10" rx="2" fill="oklch(0.99 0.01 200)" />
        <rect x="19" y="29" width="10" height="4" rx="2" fill="oklch(0.99 0.01 200)" />
        {/* arms */}
        <rect x="5" y="27" width="7" height="15" rx="3.5" fill="var(--color-scrub)" />
        <rect x="36" y="27" width="7" height="15" rx="3.5" fill="var(--color-scrub)" />
        {/* head */}
        <circle cx="24" cy="15" r="11" fill="oklch(0.87 0.06 60)" />
        <path d="M12 12a12 12 0 0 1 24 0z" fill="oklch(0.35 0.05 40)" />
        {/* cap */}
        <rect x="17" y="2" width="14" height="7" rx="2" fill="oklch(0.99 0.01 200)" />
        <rect x="22.5" y="3" width="3" height="5" fill="var(--color-alarm)" />
        <rect x="20.5" y="4.5" width="7" height="2" fill="var(--color-alarm)" />
        <circle cx="20" cy="16" r="1.6" fill="oklch(0.25 0.05 250)" />
        <circle cx="28" cy="16" r="1.6" fill="oklch(0.25 0.05 250)" />
        <path
          d="M21 20q3 2.5 6 0"
          stroke="oklch(0.35 0.06 30)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
