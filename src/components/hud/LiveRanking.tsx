// 試合中のリアルタイム順位（近似）。deriveRanking の結果を並べるだけの表示。
import type { PlayerView } from "@/state";
import { deriveRanking } from "@/state/ranking";

interface Props {
  players: PlayerView[];
  selfPlayerId: string | null;
  /** 自分の行に出す表示名（プロフィール名）。未指定ならサーバーの displayName。 */
  selfDisplayName?: string;
  /** 上位何件まで出すか（既定 8）。 */
  limit?: number;
}

export function LiveRanking({
  players,
  selfPlayerId,
  selfDisplayName,
  limit = 8,
}: Props) {
  const ranked = deriveRanking(players, selfPlayerId);
  const shown = ranked.slice(0, limit);
  const selfRow = ranked.find((r) => r.isSelf);
  const selfOutside = selfRow && selfRow.rank > limit ? selfRow : null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm">
      <div className="mb-2 text-xs font-bold text-slate-300">ランキング（暫定）</div>
      <ul className="space-y-0.5">
        {shown.map((r) => (
          <Row key={r.player.playerId} r={r} selfDisplayName={selfDisplayName} />
        ))}
        {selfOutside && (
          <>
            <li className="py-0.5 text-center text-xs text-slate-600">…</li>
            <Row r={selfOutside} selfDisplayName={selfDisplayName} />
          </>
        )}
      </ul>
    </div>
  );
}

function Row({
  r,
  selfDisplayName,
}: {
  r: ReturnType<typeof deriveRanking>[number];
  selfDisplayName?: string;
}) {
  const name = r.isSelf && selfDisplayName ? selfDisplayName : r.player.displayName;
  return (
    <li
      className={`flex items-center justify-between rounded px-2 py-0.5 tabular-nums ${
        r.isSelf ? "bg-emerald-900/50 font-bold text-emerald-200" : "text-slate-300"
      } ${!r.player.alive ? "opacity-40 line-through" : ""}`}
    >
      <span className="flex items-center gap-2">
        <span className="w-6 text-right text-slate-400">{r.rank}</span>
        <span className="truncate">{name}</span>
      </span>
      <span className="text-xs text-slate-400">🏅{r.player.badgeCount}</span>
    </li>
  );
}
