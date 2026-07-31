// ============================================================================
// PlayerGrid99 — 99人の生存/劣勢サマリのミニ盤面（テトリス99式）
//
// 入力は ViewModel の PlayerView[]（= PlayerSummary + Delta 由来の stackRatio）のみ。
// 高頻度更新は PlayerListDelta、低頻度フルは PlayerListUpdated（reducer #5 が反映済み）。
// ターゲティング先の確定はサーバー権威。ここでは表示だけ（判定・推定をしない）。
//
// 表示方針:
//   ・盤面は常に 7×14=98 マス（＝自分を除く相手の数）。自分は左上のヘッダ指標側で見るのでここには出さない。
//     サーバーから届いていない席は「欠席」として ✕ で描き、少人数でも盤面の形が変わらないようにする。
//   ・生存者は危険度で色分け（緑→琥珀→赤）、脱落は黒に ✕。
//   ・マスは縦に引き伸ばして画面の高さを使い切る（1画面で全員を一望する）。
// ============================================================================
import type { PlayerView } from "@/state";
import { Panel } from "@/components/hud/Panel";

interface Props {
  players: PlayerView[];
  /** 自分の playerId（セルを強調表示）。 */
  selfPlayerId: string | null;
  /** 外側パネルの追加クラス（高さの引き伸ばし用）。 */
  className?: string;
  /**
   * 表示の大きさ。試合中は compact（HUD の脇役）、決着後は large（主役）。
   * large では危険域のセルを脈動させ、バッジ数を大きく出す（表示のみ）。
   */
  size?: "compact" | "large";
}

/** 盤面の列数・行数（自分を除く相手 98 人ぶん）。 */
const COLS = 7;
const ROWS = 14;
const SEATS = COLS * ROWS;

/** スタック比（Delta 由来）または count/limit から量子化した危険度を返す（表示用）。 */
function stackRatioOf(p: PlayerView): number {
  if (typeof p.stackRatio === "number") return p.stackRatio;
  if (p.dakenStackLimit > 0) return p.dakenStackCount / p.dakenStackLimit;
  return 0;
}

function cellClass(p: PlayerView): string {
  if (!p.alive) return "border-zinc-800 bg-zinc-800 text-white";
  const r = stackRatioOf(p);
  // 生存中は危険度で色替え（表示のしきい値色分け）。
  return r >= 0.85
    ? "border-red-700 bg-red-500 text-white"
    : r >= 0.6
      ? "border-amber-500 bg-amber-300 text-amber-900"
      : "border-emerald-300 bg-emerald-100 text-emerald-900";
}

export function PlayerGrid99({
  players,
  selfPlayerId,
  className = "",
  size = "compact",
}: Props) {
  const large = size === "large";
  // 自分は盤面に出さない（相手だけを一望する）。
  const opponents = players.filter((p) => p.playerId !== selfPlayerId);
  const aliveCount = opponents.filter((p) => p.alive).length;
  const seated = opponents.slice(0, SEATS);
  const emptySeats = Math.max(0, SEATS - seated.length);

  return (
    <Panel
      label="敵の状況"
      tone="alive"
      right={`残り ${aliveCount} / ${SEATS}人`}
      className={className}
      bodyClassName="flex min-h-0 flex-col gap-2 p-2"
    >
      {/* 盤面はパネルの高さいっぱいに引き伸ばす（7列×14行）。 */}
      <div
        className={`grid min-h-0 flex-1 ${large ? "gap-1.5" : "gap-1"}`}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
        }}
      >
        {seated.map((p) => (
          <div
            key={p.playerId}
            title={`${p.displayName} / バッジ${p.badgeCount} / ${p.alive ? "生存" : "脱落"}`}
            className={`flex items-center justify-center border font-black leading-none ${
              large ? "text-xs" : "text-[10px]"
            } ${cellClass(p)} ${
              // 決着表示では、まだ生き残っていて危険域の相手を脈動させる（表示のみ）。
              large && p.alive && stackRatioOf(p) >= 0.85 ? "animate-danger-pulse" : ""
            }`}
          >
            {!p.alive ? "✕" : p.badgeCount > 0 ? p.badgeCount : ""}
          </div>
        ))}

        {/* 欠席（サーバーから届いていない席） */}
        {Array.from({ length: emptySeats }).map((_, i) => (
          <div
            key={`empty-${i}`}
            title="欠席（参加者なし）"
            className="flex items-center justify-center border border-dashed border-zinc-300 bg-white text-[10px] font-bold leading-none text-zinc-300"
          >
            ✕
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        <Legend color="border-emerald-300 bg-emerald-100" label="安全" />
        <Legend color="border-amber-500 bg-amber-300" label="注意" />
        <Legend color="border-red-700 bg-red-500" label="危険" />
        <Legend color="border-zinc-800 bg-zinc-800" label="脱落" />
        <Legend color="border-dashed border-zinc-300 bg-white" label="欠席" />
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
