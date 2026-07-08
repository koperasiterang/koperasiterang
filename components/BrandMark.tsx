/**
 * Lambang Koperasi Terang — abstraksi warna Kemenkop:
 * teal (institusi), hijau limau (pertumbuhan), amber (transparansi/"terang").
 */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-xl bg-kem-tealSoft ring-1 ring-kem-teal/20 ${className}`}>
      <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* lengkung pertumbuhan */}
        <path
          d="M4 17c0-6 4.5-10 10.5-10"
          stroke="#7FA919"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* pilar transparansi */}
        <path d="M8 19V12" stroke="#0E6E87" strokeWidth="3" strokeLinecap="round" />
        {/* matahari / terang */}
        <circle cx="16.5" cy="8.5" r="2.6" fill="#E8930C" />
      </svg>
    </span>
  );
}
