// 試合中のリアルタイム順位（近似）。deriveRanking の結果を並べるだけの表示。
// 表示方針: 等幅の順位表。自分の行は黒背景で反転させ、スクロールせずに見つけられるようにする。
import type { PlayerView } from "@/state";
import { deriveRanking, type RankedPlayer } from "@/state/ranking";
import { Panel } from "./Panel";

interface Props {
  players: PlayerView[];
  selfPlayerId: string | null;
  /** 自分の行に出す表示名（プロフィール名）。未指定ならサーバーの displayName。 */
  selfDisplayName?: string;
  /** 上位何件まで出すか（既定 6）。 */
  limit?: number;
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
  limit = 6,
}: Props) {
  const ranked = deriveRanking(players, selfPlayerId);
  const total = ranked.length;
  const shown = ranked.slice(0, limit);
  const selfRow = ranked.find((r) => r.isSelf);
  const selfOutside = selfRow && selfRow.rank > limit ? selfRow : null;

  return (
    <Panel
      label="ランキング"
      tone="badge"
      right={selfRow ? `自分 ${selfRow.rank} / ${total}` : `${total}人`}
      bodyClassName="p-2"
    >
      <ul className="space-y-px">
        {shown.map((r) => (
          <Row key={r.player.playerId} r={r} selfDisplayName={selfDisplayName} />
        ))}
        {selfOutside && (
          <>
            <li className="text-center text-[10px] leading-none text-zinc-500">⋯</li>
            <Row r={selfOutside} selfDisplayName={selfDisplayName} />
          </>
        )}
      </ul>
    </Panel>
  );
}

function Row({ r, selfDisplayName }: { r: RankedPlayer; selfDisplayName?: string }) {
  const name = r.isSelf && selfDisplayName ? selfDisplayName : r.player.displayName;
  return (
    <li
      className={`flex items-center gap-2 px-1.5 py-1 text-xs tabular-nums ${
        r.isSelf ? "bg-zinc-900 text-white" : "text-zinc-900"
      } ${!r.player.alive ? "opacity-45" : ""}`}
    >
      <span
        className={`flex w-5 shrink-0 items-center justify-center font-black ${
          MEDAL[r.rank] ?? (r.isSelf ? "text-white" : "text-zinc-500")
        }`}
      >
        {r.rank}
      </span>
      <span
        className={`min-w-0 flex-1 truncate font-bold ${
          !r.player.alive ? "line-through" : ""
        }`}
      >
        {name}
        {r.isSelf && <span className="ml-1 text-[10px] font-normal">(あなた)</span>}
      </span>
      {!r.player.alive && (
        <span className="shrink-0 text-[10px] font-bold text-red-600">脱落</span>
      )}
      <span
        className={`shrink-0 text-[11px] font-bold ${
          r.isSelf ? "text-amber-300" : "text-amber-600"
        }`}
      >
        {r.player.badgeCount}
      </span>
    </li>
  );
}
