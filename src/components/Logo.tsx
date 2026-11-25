export function Logo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/assets/brand/arabic-logo-white.png" alt="" width={36} height={41} className="h-9 w-auto" />
      {!compact && <img src="/assets/brand/wordmark-white.png" alt="Tea Town" width={110} height={36} className="h-6 w-auto md:h-7" />}
      {compact && <span className="sr-only">Tea Town</span>}
    </span>
  )
}
