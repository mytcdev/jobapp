export default function MatchBar({ percent }: { percent: number }) {
  const color =
    percent >= 75 ? "bg-green-500" : percent >= 40 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right">{percent}%</span>
    </div>
  );
}
