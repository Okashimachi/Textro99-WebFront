// ============================================================================
// PlayerGrid99 — 99人の生存/劣勢サマリのミニ盤面（テトリス99式）
//
// 入力は ViewModel の PlayerView[]（= PlayerSummary + Delta 由来の stackRatio）のみ。
// 高頻度更新は PlayerListDelta、低頻度フルは PlayerListUpdated（reducer #5 が反映済み）。
// ターゲティング先の確定はサーバー権威。ここでは表示だけ（判定・推定をしない）。
//
// 表示方針: 白地に赤／黒のドットマトリクス。危険なほど赤が濃く、脱落は黒で沈める。
// ============================================================================
import type { PlayerView } from "@/state";
import { Panel } from "@/components/hud/Panel";

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
  if (!p.alive) return "border-ink bg-ink";
  const r = stackRatioOf(p);
  // 生存中は危険度で色替え（表示のしきい値色分け）。
  const base =
    r >= 0.85
      ? "border-accent-dark bg-accent"
      : r >= 0.6
        ? "border-accent bg-accent-soft"
        : "border-line bg-head";
  return isSelf ? `${base} outline outline-2 outline-ink` : base;
}

export function PlayerGrid99({ players, selfPlayerId }: Props) {
  const aliveCount = players.filter((p) => p.alive).length;

  return (
    <Panel
      label={`${players.length}人`}
      right={`生存 ${aliveCount} / 脱落 ${players.length - aliveCount}`}
      bodyClassName="p-2"
    >
      {/* セルは小さく保つ（盤面が縦に伸びて他パネルを押し出さないように上限幅を付ける） */}
      <div className="mx-auto grid max-w-[340px] grid-cols-11 gap-px">
        {players.map((p) => {
          const isSelf = p.playerId === selfPlayerId;
          return (
            <div
              key={p.playerId}
              title={`${p.displayName}${isSelf ? "（自分）" : ""} / バッジ${p.badgeCount} / ${
                p.alive ? "生存" : "脱落"
              }`}
              className={`relative aspect-square border ${cellClass(p, isSelf)}`}
            >
              {p.badgeCount > 0 && p.alive && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-ink">
                  {p.badgeCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-sub">
        <Legend color="border-line bg-head" label="安全" />
        <Legend color="border-accent bg-accent-soft" label="注意" />
        <Legend color="border-accent-dark bg-accent" label="危険" />
        <Legend color="border-ink bg-ink" label="脱落" />
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 border border-line bg-head outline outline-2 outline-ink" />
          自分
        </span>
        <span>数字＝撃破数</span>
      </div>
    </Panel>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2.5 w-2.5 border ${color}`} />
      {label}
    </span>
  );
}
