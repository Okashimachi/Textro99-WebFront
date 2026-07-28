// AttackWarningBar — AttackIncoming の予告と猶予カウントダウン（コンパクト表示）。
// 予告データはサーバー由来。残り時間は「表示のためのクライアント側カウントダウン」であり、
// 着弾判定・相殺判定はサーバー権威（ここでは行わない）。
//
// 表示方針:
//   ・1件を細い1行チップにして、多数の予告を省スペースで並べられるようにする。
//   ・被弾（猶予切れ）／カウンター（OffsetResolved）で消える。無ければ何も描画しない。
import type { IncomingAttack } from "@/state";
import { useNow } from "./useNow";

interface Props {
  incomingAttacks: IncomingAttack[];
}

export function AttackWarningBar({ incomingAttacks }: Props) {
  const now = useNow(100);

  // 猶予が切れた予告（= 被弾して着弾済み）は表示から除去する。
  // カウンター（相殺）時は OffsetResolved で state 側から除去される（reducer）。
  const visible = incomingAttacks.filter(
    (a) => a.graceMs - (now - a.receivedAtMs) > 0,
  );

  if (visible.length === 0) return null;

  // 残り時間が短い順（＝差し迫っている順）に上へ。
  const sorted = [...visible].sort(
    (x, y) => x.graceMs - (now - x.receivedAtMs) - (y.graceMs - (now - y.receivedAtMs)),
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300/80">
        <span>⚠ 被弾予告</span>
        <span className="tabular-nums">{sorted.length}</span>
      </div>
      {sorted.map((a, i) => {
        const remainMs = Math.max(0, a.graceMs - (now - a.receivedAtMs));
        const ratio = a.graceMs > 0 ? remainMs / a.graceMs : 0;
        const urgent = remainMs <= 1500;
        return (
          <div
            key={`${a.warningId}-${a.receivedAtMs}-${i}`}
            className={`animate-warn-drop flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
              urgent
                ? "animate-danger-pulse border-rose-400 bg-rose-900/70"
                : "border-rose-600/50 bg-rose-950/60"
            }`}
          >
            {/* 攻撃元＋威力 */}
            <span className="w-24 shrink-0 truncate text-rose-100">
              <span className="text-rose-300/80">from </span>
              {a.attackerId}
            </span>
            <span className="shrink-0 rounded bg-rose-500/25 px-1 font-bold text-rose-200">
              {a.power}
            </span>
            {/* 猶予バー */}
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-rose-950">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-[width] duration-100"
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right font-bold tabular-nums text-rose-100">
              {(remainMs / 1000).toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
