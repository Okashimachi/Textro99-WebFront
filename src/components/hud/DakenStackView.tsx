// DakenStackView — 被弾スタック（危険度）メーター。ゲーム的に大きく強調する。
// 値はサーバー由来（DakenStackUpdated / GameParametersPublicSubset）。判定はしない。
// スタックが上限に近いほど危険（脱落圧）であることを色と点滅で直感的に伝える。
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

  const theme = danger
    ? {
        border: "border-rose-400/70",
        bg: "from-rose-600/20 to-slate-950",
        bar: "bg-gradient-to-r from-rose-600 to-rose-400",
        num: "text-rose-300",
        label: "危険",
        labelCls: "bg-rose-500/25 text-rose-200",
      }
    : warn
      ? {
          border: "border-amber-400/60",
          bg: "from-amber-500/15 to-slate-950",
          bar: "bg-gradient-to-r from-amber-500 to-amber-300",
          num: "text-amber-300",
          label: "注意",
          labelCls: "bg-amber-500/25 text-amber-200",
        }
      : {
          border: "border-emerald-500/40",
          bg: "from-emerald-500/10 to-slate-950",
          bar: "bg-gradient-to-r from-emerald-500 to-emerald-300",
          num: "text-emerald-300",
          label: "安全",
          labelCls: "bg-emerald-500/20 text-emerald-200",
        };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-4 ${theme.border} ${theme.bg} ${
        danger ? "animate-danger-pulse" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          被弾スタック
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${theme.labelCls}`}>
          {theme.label}
        </span>
      </div>

      <div className="mt-1 flex items-end gap-1">
        <span className={`text-5xl font-black leading-none tabular-nums ${theme.num}`}>
          {count}
        </span>
        <span className="mb-1 text-sm font-bold text-slate-500">/ {limit || "—"}</span>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${theme.bar}`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className="text-slate-500">満タンで脱落圧</span>
        {trapPending && (
          <span className="animate-danger-pulse rounded bg-rose-600 px-2 py-0.5 font-bold text-white">
            トラップ誘発待ち
          </span>
        )}
      </div>
    </div>
  );
}
