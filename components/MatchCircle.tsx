interface Props { percent: number; size?: "sm" | "md" }

export default function MatchCircle({ percent, size = "md" }: Props) {
  const bg = percent >= 75 ? "bg-emerald-700" : percent >= 40 ? "bg-amber-500" : "bg-gray-400";
  const dim = size === "sm" ? "w-11 h-11 text-xs" : "w-14 h-14 text-sm";
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={`${dim} ${bg} rounded-full flex items-center justify-center text-white font-bold shadow-sm`}>
        {percent}%
      </div>
      {size === "md" && <span className="text-[10px] text-gray-500 font-medium">Match</span>}
    </div>
  );
}
