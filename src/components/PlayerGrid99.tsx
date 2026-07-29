// ============================================================================
// PlayerGrid99 — 99人の生存/劣勢サマリのミニ盤面（テトリス99式）
//
// 入力は ViewModel の PlayerView[]（= PlayerSummary + Delta 由来の stackRatio）のみ。
// 高頻度更新は PlayerListDelta、低頻度フルは PlayerListUpdated（reducer #5 が反映済み）。
// ターゲティング先の確定はサーバー権威。ここでは表示だけ（判定・推定をしない）。
//
// 表示方針:
//   ・マス目は常に 99（自分を含む）。サーバーから届いていない席は「欠席」として ✕ で描く。
//     人数が揃っていない練習/デバッグ時でも盤面の形が変わらず、位置で相手を覚えられる。
//   ・生存者は危険度で色分け（緑→琥珀→赤）、脱落は黒に ✕、自分は青枠。
// ============================================================================
import type { PlayerView } from "@/state";
import { Panel } from "@/components/hud/Panel";

interface Props {
  players: PlayerView[];
  /** 自分の playerId（セルを強調表示）。 */
  selfPlayerId: string | null;
  /** 外側パネルの追加クラス（高さの引き伸ばし用）。 */
  className?: string;
}

/** 盤面のマス数（自分を含む）。 */
const SEATS = 99;

/** スタック比（Delta 由来）または count/limit から量子化した危険度を返す（表示用）。 */
function stackRatioOf(p: PlayerView): number {
  if (typeof p.stackRatio === "number") return p.stackRatio;
  if (p.dakenStackLimit > 0) return p.dakenStackCount / p.dakenStackLimit;
  return 0;
}

function cellClass(p: PlayerView, isSelf: boolean): string {
  if (!p.alive) return "border-zinc-800 bg-zinc-800 text-white";
  const r = stackRatioOf(p);
  // 生存中は危険度で色替え（表示のしきい値色分け）。
  const base =
    r >= 0.85
      ? "border-red-700 bg-red-500 text-white"
      : r >= 0.6
        ? "border-amber-500 bg-amber-300 text-amber-900"
        : "border-emerald-300 bg-emerald-100 text-emerald-900";
  return isSelf ? `${base} outline outline-2 outline-sky-600` : base;
}

export function PlayerGrid99({ players, selfPlayerId, className = "" }: Props) {
  const aliveCount = players.filter((p) => p.alive).length;
  const seated = players.slice(0, SEATS);
  const emptySeats = Math.max(0, SEATS - seated.length);

  return (
    <Panel
      label="敵の状況"
      tone="alive"
      right={`残り ${aliveCount} / ${SEATS}人`}
      className={className}
      bodyClassName="p-2"
    >
      <div className="grid grid-cols-9 gap-1">
        {seated.map((p) => {
          const isSelf = p.playerId === selfPlayerId;
          return (
            <div
              key={p.playerId}
              title={`${p.displayName}${isSelf ? "（あなた）" : ""} / バッジ${p.badgeCount} / ${
                p.alive ? "生存" : "脱落"
              }`}
              className={`flex aspect-square items-center justify-center border text-[10px] font-black leading-none ${cellClass(
                p,
                isSelf,
              )}`}
            >
              {!p.alive ? "✕" : p.badgeCount > 0 ? p.badgeCount : ""}
            </div>
          );
        })}

        {/* 欠席（サーバーから届いていない席） */}
        {Array.from({ length: emptySeats }).map((_, i) => (
          <div
            key={`empty-${i}`}
            title="欠席（参加者なし）"
            className="flex aspect-square items-center justify-center border border-dashed border-zinc-300 bg-white text-[10px] font-bold leading-none text-zinc-300"
          >
            ✕
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        <Legend color="border-emerald-300 bg-emerald-100" label="安全" />
        <Legend color="border-amber-500 bg-amber-300" label="注意" />
        <Legend color="border-red-700 bg-red-500" label="危険" />
        <Legend color="border-zinc-800 bg-zinc-800" label="脱落" />
        <Legend color="border-dashed border-zinc-300 bg-white" label="欠席" />
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 border border-emerald-300 bg-emerald-100 outline outline-2 outline-sky-600" />
          あなた
        </span>
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
