export function PixelWardRoom() {
  return (
    <svg
      viewBox="0 0 400 600"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full ward-pixel-image"
    >
      <defs>
        <pattern id="ward-floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="var(--ward-floor)" />
          <path d="M40 0H0V40" fill="none" stroke="var(--ward-floor-line)" strokeWidth="2" />
          <rect x="4" y="4" width="5" height="5" fill="var(--ward-floor-glint)" opacity=".55" />
        </pattern>
      </defs>

      <rect width="400" height="600" fill="var(--ward-wall-dark)" />
      <rect x="12" y="15" width="376" height="570" fill="url(#ward-floor-grid)" />

      {/* deep, stepped outer wall */}
      <path d="M0 0H400V34H388V15H12V585H388V566H400V600H0V566H12V34H0Z" fill="var(--ward-frame)" />
      <path d="M8 8H392V25H383V16H17V584H8Z" fill="var(--ward-frame-hi)" opacity=".8" />
      <path d="M12 15H388V34H12ZM12 566H388V585H12Z" fill="var(--ward-wall)" />
      <rect x="12" y="31" width="376" height="5" fill="var(--ward-trim)" />
      <rect x="12" y="561" width="376" height="5" fill="var(--ward-trim)" />

      {/* upper windows and doors */}
      <rect x="34" y="15" width="76" height="19" fill="var(--ward-wall-light)" />
      <rect x="290" y="15" width="76" height="19" fill="var(--ward-wall-light)" />
      <rect x="126" y="15" width="148" height="19" fill="var(--ward-window-dark)" />
      <rect x="131" y="15" width="43" height="15" fill="var(--ward-window)" />
      <rect x="178" y="15" width="43" height="15" fill="var(--ward-window)" />
      <rect x="225" y="15" width="44" height="15" fill="var(--ward-window)" />
      <path d="m139 28 20-13h11l-21 13Zm47 0 22-13h10l-22 13Z" fill="var(--ward-window-shine)" opacity=".55" />
      <rect x="48" y="17" width="28" height="17" fill="var(--ward-door)" />
      <rect x="52" y="20" width="20" height="14" fill="var(--ward-door-light)" />
      <rect x="324" y="17" width="28" height="17" fill="var(--ward-door)" />
      <rect x="328" y="20" width="20" height="14" fill="var(--ward-door-light)" />

      {/* lower double doors behind the station */}
      <rect x="160" y="566" width="80" height="34" fill="var(--ward-frame)" />
      <rect x="167" y="570" width="31" height="30" fill="var(--ward-door)" />
      <rect x="202" y="570" width="31" height="30" fill="var(--ward-door)" />
      <rect x="191" y="581" width="4" height="12" fill="var(--ward-door-light)" />
      <rect x="205" y="581" width="4" height="12" fill="var(--ward-door-light)" />

      {/* side-wall window slivers */}
      <rect x="12" y="73" width="10" height="104" fill="var(--ward-window-dark)" />
      <rect x="15" y="77" width="7" height="96" fill="var(--ward-window)" />
      <rect x="378" y="73" width="10" height="104" fill="var(--ward-window-dark)" />
      <rect x="378" y="77" width="7" height="96" fill="var(--ward-window)" />
      <rect x="12" y="392" width="10" height="105" fill="var(--ward-window-dark)" />
      <rect x="15" y="396" width="7" height="97" fill="var(--ward-window)" />
      <rect x="378" y="392" width="10" height="105" fill="var(--ward-window-dark)" />
      <rect x="378" y="396" width="7" height="97" fill="var(--ward-window)" />
    </svg>
  );
}

export function PixelCrescentDesk() {
  return (
    <svg viewBox="0 0 420 105" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full ward-pixel-image">
      <path d="M8 18H412V96H8ZM48 18Q210 78 372 18V62Q210 104 48 62Z" fill="var(--ward-frame)" fillRule="evenodd" />
      <path d="M14 12H406V84H14ZM53 18Q210 67 367 18V55Q210 93 53 55Z" fill="var(--ward-desk)" fillRule="evenodd" />
      <path d="M22 18H398V30H22ZM60 32Q210 72 360 32" fill="none" stroke="var(--ward-desk-light)" strokeWidth="6" />
      <path d="M25 70Q210 103 395 70V84Q210 116 25 84Z" fill="var(--ward-desk-dark)" />
    </svg>
  );
}