/** Original pixel-art mascot — Bit Bot */
export function BitBot({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="64"
      height="64"
      aria-hidden
      shapeRendering="crispEdges"
    >
      <rect x="8" y="4" width="16" height="14" fill="#5ef0ff" />
      <rect x="6" y="6" width="4" height="4" fill="#12182b" />
      <rect x="22" y="6" width="4" height="4" fill="#12182b" />
      <rect x="10" y="10" width="4" height="4" fill="#0a0e1a" />
      <rect x="18" y="10" width="4" height="4" fill="#0a0e1a" />
      <rect x="12" y="14" width="8" height="2" fill="#ff6eb4" />
      <rect x="10" y="18" width="12" height="8" fill="#b8ff5a" />
      <rect x="6" y="20" width="4" height="6" fill="#5ef0ff" />
      <rect x="22" y="20" width="4" height="6" fill="#5ef0ff" />
      <rect x="12" y="26" width="4" height="4" fill="#c49bff" />
      <rect x="18" y="26" width="4" height="4" fill="#c49bff" />
      <rect x="14" y="2" width="4" height="2" fill="#ffe566" />
    </svg>
  )
}
