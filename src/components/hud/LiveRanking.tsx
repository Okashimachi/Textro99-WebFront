// 試合中のリアルタイム順位（近似）。deriveRanking の結果を並べるだけの表示。
// 表示方針: 上位を表彰台メダルで強調し、自分の順位を常に大きく見せる（ゲーム的な順位表）。
import type { PlayerView } from "@/state";
import { deriveRanking, type RankedPlayer } from "@/state/ranking";

interface Props {
  players: PlayerView[];
  selfPlayerId: string | null;
  /** 自分の行に出す表示名（プロフィール名）。未指定ならサーバーの displayName。 */
  selfDisplayName?: string;
  /** 上位何件まで出すか（既定 5）。 */
  limit?: number;
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LiveRanking({
  players,
  selfPlayerId,
  selfDisplayName,
  limit = 5,
}: Props) {
  const ranked = deriveRanking(players, selfPlayerId);
  const total = ranked.length;
  const shown = ranked.slice(0, limit);
  const selfRow = ranked.find((r) => r.isSelf);
  const selfOutside = selfRow && selfRow.rank > limit ? selfRow : null;

  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ランキング
        </span>
        {selfRow && (
          <span className="text-xs text-slate-400">
            あなた{" "}
            <span className="text-lg font-black text-sky-300 tabular-nums">
              {selfRow.rank}
            </span>
            <span className="text-slate-500"> / {total}位</span>
          </span>
        )}
      </div>

      <ul className="space-y-1">
        {shown.map((r) => (
          <Row key={r.player.playerId} r={r} selfDisplayName={selfDisplayName} />
        ))}
        {selfOutside && (
          <>
            <li className="text-center text-xs leading-none text-slate-600">⋯</li>
            <Row r={selfOutside} selfDisplayName={selfDisplayName} />
          </>
        )}
      </ul>
    </div>
  );
}

function Row({ r, selfDisplayName }: { r: RankedPlayer; selfDisplayName?: string }) {
  const name = r.isSelf && selfDisplayName ? selfDisplayName : r.player.displayName;
  const medal = MEDAL[r.rank];
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 tabular-nums ${
        r.isSelf
          ? "bg-sky-500/20 ring-1 ring-sky-400/50"
          : r.rank <= 3
            ? "bg-slate-900/60"
            : ""
      } ${!r.player.alive ? "opacity-40" : ""}`}
    >
      <span className="flex w-7 shrink-0 items-center justify-center text-base font-black">
        {medal ?? <span className="text-sm text-slate-400">{r.rank}</span>}
      </span>
      <span
        className={`min-w-0 flex-1 truncate font-bold ${
          r.isSelf ? "text-sky-100" : "text-slate-200"
        } ${!r.player.alive ? "line-through" : ""}`}
      >
        {name}
        {r.isSelf && <span className="ml-1 text-[10px] text-sky-300">(あなた)</span>}
      </span>
      {!r.player.alive && (
        <span className="shrink-0 text-[10px] font-bold text-rose-400">脱落</span>
      )}
      <span className="flex shrink-0 items-center gap-0.5 text-xs text-amber-300">
        🏅<span className="font-bold text-slate-200">{r.player.badgeCount}</span>
      </span>
    </li>
  );
}
