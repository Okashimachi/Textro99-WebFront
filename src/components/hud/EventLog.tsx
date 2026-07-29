// EventLog — KO/攻撃等の直近イベント列。reducer が写したイベントを並べるだけ。
// 表示方針: 時刻・種別マーク・本文の3カラム。等幅で「戦況の流れ」を追えるようにする。
// 時刻は表示用の相対経過（最古のイベントを 0:00 とする整形だけ）。
import type { GameEvent } from "@/state";
import { Panel } from "./Panel";

interface Props {
  events: GameEvent[];
  /** 表示する最大件数（既定 6）。 */
  limit?: number;
}

const KIND_STYLE: Record<
  GameEvent["kind"],
  { mark: string; color: string; bar: string }
> = {
  Welcome: { mark: "•", color: "text-zinc-500", bar: "bg-zinc-300" },
  Ko: { mark: "✕", color: "text-red-600", bar: "bg-red-500" },
  AttackFailed: { mark: "⚔", color: "text-amber-600", bar: "bg-amber-400" },
  OffsetResolved: { mark: "▣", color: "text-emerald-600", bar: "bg-emerald-500" },
  GameOver: { mark: "■", color: "text-sky-700", bar: "bg-sky-500" },
};

/** ms 差を m:ss に整形する（表示専用）。 */
function elapsed(atMs: number, baseMs: number): string {
  const s = Math.max(0, Math.floor((atMs - baseMs) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function EventLog({ events, limit = 6 }: Props) {
  const shown = events.slice(0, limit);
  const baseMs = events.length > 0 ? events[events.length - 1].atMs : 0;

  return (
    <Panel label="戦況ログ" right={`${events.length} 件`} bodyClassName="p-2">
      {shown.length === 0 ? (
        <div className="py-1 text-[11px] text-zinc-500">まだ動きはありません</div>
      ) : (
        <ul className="space-y-px">
          {shown.map((e) => {
            const s = KIND_STYLE[e.kind];
            return (
              <li
                key={e.id}
                className="flex items-stretch gap-2 border-b border-zinc-200 py-1 text-xs leading-snug last:border-b-0"
              >
                <span className={`w-1 shrink-0 ${s.bar}`} aria-hidden />
                <span className="w-8 shrink-0 text-[10px] tabular-nums text-zinc-500">
                  {elapsed(e.atMs, baseMs)}
                </span>
                <span className={`w-3 shrink-0 text-center ${s.color}`} aria-hidden>
                  {s.mark}
                </span>
                <span className="min-w-0 flex-1 text-zinc-900">{e.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
