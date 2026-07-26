// DakenStackView — ダケンスタック件数/上限・危険域色・trapPending 表示。
// 値はサーバー由来（DakenStackUpdated / GameParametersPublicSubset）。判定はしない。
import type { DakenStackState } from "@/state";

interface Props {
  dakenStack: DakenStackState;
}

export function DakenStackView({ dakenStack }: Props) {
  const { count, limit, trapPending } = dakenStack;
  const ratio = limit > 0 ? count / limit : 0;
  // 危険域の色分けは「表示」（しきい値での色替え）であって戦闘判定ではない。
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;
  const barColor = danger ? "bg-rose-500" : warn ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>ダケンスタック</span>
        {trapPending && (
          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] text-white">
            トラップ誘発待ち
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-100">
        {count}
        <span className="text-sm text-slate-400"> / {limit}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-900">
        <div
          className={`h-full ${barColor}`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
