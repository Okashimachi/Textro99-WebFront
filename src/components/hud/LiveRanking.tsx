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
      right={selfRow ? `自分 ${selfRow.rank} / ${total}` : `${total}人`}
      bodyClassName="p-2"
    >
      <ul className="space-y-px">
        {shown.map((r) => (
          <Row key={r.player.playerId} r={r} selfDisplayName={selfDisplayName} />
        ))}
        {selfOutside && (
          <>
            <li className="text-center text-[10px] leading-none text-sub">⋯</li>
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
        r.isSelf ? "bg-ink text-white" : "text-ink"
      } ${!r.player.alive ? "opacity-45" : ""}`}
    >
      <span
        className={`w-5 shrink-0 text-right font-black ${
          r.isSelf ? "text-white" : r.rank <= 3 ? "text-accent" : "text-sub"
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
        <span className="shrink-0 text-[10px] font-bold text-accent">脱落</span>
      )}
      <span className="shrink-0 text-[11px] font-bold">{r.player.badgeCount}</span>
    </li>
  );
}
