// EventLog — KO/攻撃等の直近イベント列。reducer が写したイベントを並べるだけ。
// 表示方針: 他の HUD より控えめ（枠を弱く）だが、プレイ中に読めるよう文字は大きめ・簡潔に。
// 情報過多を避けるため直近数件のみ表示する。
import type { GameEvent } from "@/state";

interface Props {
  events: GameEvent[];
  /** 表示する最大件数（既定 5）。 */
  limit?: number;
}

const KIND_STYLE: Record<GameEvent["kind"], { icon: string; color: string }> = {
  Welcome: { icon: "•", color: "text-slate-400" },
  Ko: { icon: "💥", color: "text-rose-300" },
  AttackFailed: { icon: "⚔️", color: "text-amber-300" },
  OffsetResolved: { icon: "🛡️", color: "text-sky-300" },
  GameOver: { icon: "🏁", color: "text-emerald-300" },
};

export function EventLog({ events, limit = 5 }: Props) {
  const shown = events.slice(0, limit);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        戦況ログ
      </div>
      {shown.length === 0 ? (
        <div className="py-1 text-sm text-slate-600">まだ動きはありません</div>
      ) : (
        <ul className="space-y-1">
          {shown.map((e) => {
            const s = KIND_STYLE[e.kind];
            return (
              <li key={e.id} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-0.5 shrink-0 text-xs" aria-hidden>
                  {s.icon}
                </span>
                <span className={`min-w-0 flex-1 ${s.color}`}>{e.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
