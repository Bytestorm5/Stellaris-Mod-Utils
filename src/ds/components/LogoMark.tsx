/** Brand mark — hex frame, orbital ring, planet core, amber spark. Adapts to theme. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 3.5 41.7 13.75 V34.25 L24 44.5 6.3 34.25 V13.75 Z"
        stroke="var(--text-faint)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.6"
        fill="none"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="15"
        ry="6.2"
        stroke="var(--accent)"
        strokeWidth="1.8"
        transform="rotate(-28 24 24)"
        fill="none"
      />
      <circle cx="24" cy="24" r="5.4" fill="var(--accent)" />
      <path
        d="M37 16.2 L38.1 19 L41 20.1 L38.1 21.2 L37 24 L35.9 21.2 L33 20.1 L35.9 19 Z"
        fill="var(--accent-2)"
      />
    </svg>
  );
}
