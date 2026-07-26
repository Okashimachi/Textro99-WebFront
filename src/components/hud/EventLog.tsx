// EventLog — KO/攻撃等の直近イベント列。reducer が写したイベントを並べるだけ。
import type { GameEvent } from "@/state";

interface Props {
  events: GameEvent[];
}

const KIND_COLOR: Record<GameEvent["kind"], string> = {
  Welcome: "text-slate-400",
  Ko: "text-rose-300",
  AttackFailed: "text-amber-300",
  OffsetResolved: "text-sky-300",
  GameOver: "text-emerald-300",
};

export function EventLog({ events }: Props) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
      <div className="mb-1 text-xs text-slate-400">イベントログ</div>
      <ul className="max-h-40 space-y-0.5 overflow-auto text-xs">
        {events.length === 0 && <li className="text-slate-600">（なし）</li>}
        {events.map((e) => (
          <li key={e.id} className={KIND_COLOR[e.kind]}>
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
