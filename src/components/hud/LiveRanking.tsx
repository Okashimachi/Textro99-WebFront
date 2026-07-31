// 試合中のリアルタイム順位。サーバー確定順位（PlayerSummary.rank）で並べるだけの表示。
// 表示方針: 等幅の順位表。自分の行は黒背景で反転させ、スクロールせずに見つけられるようにする。
import type { PlayerView } from "@/state";
import { sortByServerRank, type RankedPlayer } from "@/state/ranking";
import { Panel } from "./Panel";

interface Props {
  players: PlayerView[];
  selfPlayerId: string | null;
  /** 自分の行に出す表示名（プロフィール名）。未指定ならサーバーの displayName。 */
  selfDisplayName?: string;
  /** 上位何件まで出すか（既定 6）。 */
  limit?: number;
  /** 外側パネルの追加クラス（高さの引き伸ばし用）。 */
  className?: string;
  /**
   * 表示の大きさ。試合中は compact（HUD の脇役）、決着後は large（主役）。
   * 見た目だけの切替で、並び順・値はどちらもサーバー由来のまま。
   */
  size?: "compact" | "large";
}

// 上位3位のメダル色（表示だけ）。
const MEDAL: Record<number, string> = {
  1: "text-amber-500",
  2: "text-zinc-400",
  3: "text-amber-700",
};

export function LiveRanking({
  players,
  selfPlayerId,
  selfDisplayName,
  limit = 14,
  className = "",
  size = "compact",
}: Props) {
  const ranked = sortByServerRank(players, selfPlayerId);
  const total = ranked.length;
  const shown = ranked.slice(0, limit);
  const selfIndex = ranked.findIndex((r) => r.isSelf);
  const selfRow = selfIndex >= 0 ? ranked[selfIndex] : undefined;
  // 表示は先頭 limit 件のみ。自分がそこに入らないときだけ末尾に自分の行を足す。
  const selfOutside = selfIndex >= limit ? ranked[selfIndex] : null;

  return (
    <Panel
      label="ランキング"
      tone="badge"
      right={selfRow ? `自分 ${rankLabel(selfRow.rank)} / ${total}` : `${total}人`}
      className={className}
      bodyClassName="p-2"
    >
      <ul
        className={
          size === "large"
            ? "flex h-full min-h-0 flex-col gap-1 overflow-hidden"
            : "space-y-px"
        }
      >
        {shown.map((r) => (
          <Row
            key={r.player.playerId}
            r={r}
            selfDisplayName={selfDisplayName}
            size={size}
          />
        ))}
        {selfOutside && (
          <>
            <li className="text-center text-[10px] leading-none text-zinc-500">⋯</li>
            <Row r={selfOutside} selfDisplayName={selfDisplayName} size={size} />
          </>
        )}
      </ul>
    </Panel>
  );
}

/** サーバー順位の表示文字列。0（未確定）はダッシュ。 */
function rankLabel(rank: number): string {
  return rank > 0 ? String(rank) : "—";
}

function Row({
  r,
  selfDisplayName,
  size,
}: {
  r: RankedPlayer;
  selfDisplayName?: string;
  size: "compact" | "large";
}) {
  const name = r.isSelf && selfDisplayName ? selfDisplayName : r.player.displayName;
  const large = size === "large";
  // 決着後は上位3位を色帯で立たせ、自分の行を太い枠で見つけやすくする（表示のみ）。
  const podium = large && !r.isSelf ? PODIUM_ROW[r.rank] : undefined;

  return (
    <li
      className={`flex items-center tabular-nums ${
        large
          ? `min-h-[2.25rem] max-h-14 flex-1 gap-3 border px-3 ${
              r.isSelf
                ? "border-zinc-900 bg-zinc-900 text-white"
                : (podium ?? "border-zinc-200 bg-white text-zinc-900")
            }`
          : `gap-2 px-1.5 py-1 text-xs ${
              r.isSelf ? "bg-zinc-900 text-white" : "text-zinc-900"
            }`
      } ${!r.player.alive ? (large ? "opacity-60" : "opacity-45") : ""}`}
    >
      <span
        key={r.rank}
        className={`flex shrink-0 items-center justify-center font-black ${
          large ? "w-10 animate-value-bump text-3xl" : "w-5"
        } ${MEDAL[r.rank] ?? (r.isSelf ? "text-white" : "text-zinc-500")}`}
      >
        {rankLabel(r.rank)}
      </span>
      <span
        className={`min-w-0 flex-1 truncate font-bold ${large ? "text-base" : ""} ${
          !r.player.alive ? "line-through" : ""
        }`}
      >
        {name}
        {r.isSelf && (
          <span className={`ml-1 font-normal ${large ? "text-xs" : "text-[10px]"}`}>
            (あなた)
          </span>
        )}
      </span>
      {!r.player.alive && (
        <span
          className={`shrink-0 font-bold text-red-600 ${large ? "text-xs" : "text-[10px]"}`}
        >
          脱落
        </span>
      )}
      <span
        className={`shrink-0 font-bold ${large ? "text-lg" : "text-[11px]"} ${
          r.isSelf ? "text-amber-300" : "text-amber-600"
        }`}
      >
        {r.player.badgeCount}
      </span>
    </li>
  );
}

/** 決着表示での上位3位の行スタイル（表示のみ）。 */
const PODIUM_ROW: Record<number, string> = {
  1: "border-amber-400 bg-amber-50 text-amber-900",
  2: "border-zinc-400 bg-zinc-100 text-zinc-900",
  3: "border-amber-700/40 bg-amber-100/60 text-amber-900",
};
