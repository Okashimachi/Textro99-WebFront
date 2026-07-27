// AttackWarningBar — AttackIncoming の予告と猶予カウントダウン表示。
// 予告データはサーバー由来。残り時間は「表示のためのクライアント側カウントダウン」であり、
// 着弾判定・相殺判定はサーバー権威（ここでは行わない）。
import type { IncomingAttack } from "@/state";
import { useNow } from "./useNow";

interface Props {
  incomingAttacks: IncomingAttack[];
}

export function AttackWarningBar({ incomingAttacks }: Props) {
  const now = useNow(100);

  if (incomingAttacks.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-500">
        被弾予告なし
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {incomingAttacks.map((a) => {
        // 表示専用の残り猶予（負値は 0 に丸め）。
        const remainMs = Math.max(0, a.graceMs - (now - a.receivedAtMs));
        const ratio = a.graceMs > 0 ? remainMs / a.graceMs : 0;
        return (
          <div
            key={a.warningId}
            className="animate-warn-drop rounded-lg border border-rose-600/60 bg-rose-950/40 p-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-300">
                被弾予告 from {a.attackerId}（威力 {a.power}）
              </span>
              <span className="tabular-nums text-rose-200">
                {(remainMs / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-slate-900">
              <div
                className="h-full bg-rose-500 transition-[width] duration-100"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
