// ============================================================================
// PlayerGrid99 — 99人の生存/劣勢サマリのミニ盤面（テトリス99式）
//
// 入力は ViewModel の PlayerView[]（= PlayerSummary + Delta 由来の stackRatio）のみ。
// 高頻度更新は PlayerListDelta、低頻度フルは PlayerListUpdated（reducer #5 が反映済み）。
// ターゲティング先の確定はサーバー権威。ここでは表示だけ（判定・推定をしない）。
//
// 表示方針: 「誰が優勢/劣勢/脱落か」を色で一望できるようにし、凡例で意味を明示する。
// ============================================================================
import type { PlayerView } from "@/state";

interface Props {
  players: PlayerView[];
  /** 自分の playerId（セルを強調表示）。 */
  selfPlayerId: string | null;
}

/** スタック比（Delta 由来）または count/limit から量子化した危険度を返す（表示用）。 */
function stackRatioOf(p: PlayerView): number {
  if (typeof p.stackRatio === "number") return p.stackRatio;
  if (p.dakenStackLimit > 0) return p.dakenStackCount / p.dakenStackLimit;
  return 0;
}

function cellClass(p: PlayerView, isSelf: boolean): string {
  if (!p.alive) return "bg-slate-800/80 text-slate-600";
  const r = stackRatioOf(p);
  // 生存中は危険度で色替え（表示のしきい値色分け）。
  const base =
    r >= 0.85
      ? "bg-rose-500 text-white"
      : r >= 0.6
        ? "bg-amber-400 text-slate-900"
        : "bg-emerald-500 text-white";
  return isSelf ? `${base} ring-2 ring-sky-300 ring-offset-1 ring-offset-slate-900` : base;
}

export function PlayerGrid99({ players, selfPlayerId }: Props) {
  const aliveCount = players.filter((p) => p.alive).length;

  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          対戦相手（{players.length}）
        </span>
        <span className="text-xs text-slate-400">
          生存 <span className="font-bold text-emerald-300">{aliveCount}</span>
        </span>
      </div>

      <div className="grid grid-cols-11 gap-1">
        {players.map((p) => {
          const isSelf = p.playerId === selfPlayerId;
          return (
            <div
              key={p.playerId}
              title={`${p.displayName}${isSelf ? "（自分）" : ""} / バッジ${p.badgeCount} / ${
                p.alive ? "生存" : "脱落"
              }`}
              className={`relative flex aspect-square items-center justify-center rounded text-[9px] font-bold ${cellClass(
                p,
                isSelf,
              )}`}
            >
              {p.badgeCount > 0 && p.alive && (
                <span className="absolute -right-0.5 -top-0.5 z-10 rounded-full bg-yellow-300 px-1 text-[7px] font-black text-slate-900 shadow">
                  {p.badgeCount}
                </span>
              )}
              {!p.alive && <span className="text-slate-600">✕</span>}
              {isSelf && p.alive && <span className="text-[8px]">YOU</span>}
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
        <Legend color="bg-emerald-500" label="安全" />
        <Legend color="bg-amber-400" label="注意" />
        <Legend color="bg-rose-500" label="危険" />
        <Legend color="bg-slate-700" label="脱落" />
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-emerald-500 ring-2 ring-sky-300" />
          自分
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded-full bg-yellow-300 px-1 text-[7px] font-black text-slate-900">
            2
          </span>
          撃破数
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded ${color}`} />
      {label}
    </span>
  );
}
