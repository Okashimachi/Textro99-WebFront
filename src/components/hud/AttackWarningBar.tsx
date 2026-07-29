// AttackWarningBar — 「IN（被弾予告）」パネル。AttackIncoming と猶予カウントダウン。
// 予告データはサーバー由来。残り時間は「表示のためのクライアント側カウントダウン」であり、
// 着弾判定・相殺判定はサーバー権威（ここでは行わない）。
//
// 表示方針: 差し迫っている順に上から。残り秒を大きく、威力はバーで相対比較できるようにする。
import type { IncomingAttack } from "@/state";
import { useNow } from "./useNow";
import { Panel } from "./Panel";

interface Props {
  incomingAttacks: IncomingAttack[];
}

export function AttackWarningBar({ incomingAttacks }: Props) {
  const now = useNow(100);

  // 猶予が切れた予告（= 被弾して着弾済み）は表示から除去する。
  // カウンター（相殺）時は OffsetResolved で state 側から除去される（reducer）。
  const visible = incomingAttacks.filter((a) => a.graceMs - (now - a.receivedAtMs) > 0);

  // 残り時間が短い順（＝差し迫っている順）に上へ。
  const sorted = [...visible].sort(
    (x, y) => x.graceMs - (now - x.receivedAtMs) - (y.graceMs - (now - y.receivedAtMs)),
  );
  const maxPower = sorted.reduce((m, a) => Math.max(m, a.power), 1);

  return (
    <Panel label="IN — 被弾予告" tone="accent" right={`予告 ${sorted.length}`}>
      {sorted.length === 0 ? (
        <div className="py-2 text-[11px] text-sub">飛来中の攻撃はありません</div>
      ) : (
        <ul className="space-y-1">
          {sorted.map((a, i) => {
            const remainMs = Math.max(0, a.graceMs - (now - a.receivedAtMs));
            const urgent = remainMs <= 1500;
            return (
              <li
                key={`${a.warningId}-${a.receivedAtMs}-${i}`}
                className={`animate-warn-drop border px-2 py-1 ${
                  urgent
                    ? "animate-danger-pulse border-accent bg-accent-soft"
                    : "border-line bg-panel"
                }`}
              >
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black leading-none tabular-nums ${
                      urgent ? "text-accent" : "text-ink"
                    }`}
                  >
                    {(remainMs / 1000).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-sub">秒</span>
                  <span className="ml-auto truncate text-[10px] text-sub">
                    {a.attackerId} / 威力 {a.power}
                  </span>
                </div>
                {/* 威力バー（予告どうしの相対比較・表示専用） */}
                <div className="mt-1 h-1.5 w-full bg-head">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(a.power / maxPower) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
