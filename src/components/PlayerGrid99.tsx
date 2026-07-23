// ============================================================================
// PlayerGrid99 — 99人の生存/劣勢サマリのミニ盤面（テトリス99式）
//
// 入力は ViewModel の PlayerView[]（= PlayerSummary + Delta 由来の stackRatio）のみ。
// 高頻度更新は PlayerListDelta、低頻度フルは PlayerListUpdated（reducer #5 が反映済み）。
// ターゲティング先の確定はサーバー権威。ここでは表示だけ（判定・推定をしない）。
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
  if (!p.alive) return "bg-slate-800 text-slate-600";
  const r = stackRatioOf(p);
  // 生存中は危険度で色替え（表示のしきい値色分け）。
  const base =
    r >= 0.85
      ? "bg-rose-600 text-white"
      : r >= 0.6
        ? "bg-amber-500 text-slate-900"
        : "bg-emerald-600 text-white";
  return isSelf ? `${base} ring-2 ring-sky-300` : base;
}

export function PlayerGrid99({ players, selfPlayerId }: Props) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-2">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>PlayerGrid99</span>
        <span>{players.filter((p) => p.alive).length} 生存</span>
      </div>
      <div className="grid grid-cols-11 gap-0.5">
        {players.map((p) => {
          const isSelf = p.playerId === selfPlayerId;
          return (
            <div
              key={p.playerId}
              title={`${p.displayName}${isSelf ? "（自分）" : ""} / バッジ${p.badgeCount} / ${
                p.alive ? "生存" : "脱落"
              }`}
              className={`relative flex aspect-square items-center justify-center rounded-sm text-[8px] ${cellClass(
                p,
                isSelf,
              )}`}
            >
              {p.badgeCount > 0 && p.alive && (
                <span className="absolute right-0 top-0 rounded-bl bg-yellow-300 px-0.5 text-[7px] font-bold text-slate-900">
                  {p.badgeCount}
                </span>
              )}
              {!p.alive && "×"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
