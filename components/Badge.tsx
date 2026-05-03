interface BadgeProps {
  label: string;
  variant?: "default" | "matched" | "missing";
}

export default function Badge({ label, variant = "default" }: BadgeProps) {
  if (variant === "matched") {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
      </span>
    );
  }
  if (variant === "missing") {
    return (
      <span className="inline-block text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full border border-dashed border-gray-300">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
      {label}
    </span>
  );
}
