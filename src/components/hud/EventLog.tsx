// EventLog — KO/攻撃等の直近イベントを「通知」として主ディスプレイの上に出す。
// reducer が写したイベントを並べるだけ（判定・集計はしない）。
//
// 表示方針: 打鍵中の視界（お題の真上）に入るので、種類ごとに色を変えて一瞬で意味が取れるようにし、
// 件数は絞る。無いときもプレースホルダを置き、通知が来てもレイアウトが跳ねないようにする。
import type { GameEvent } from "@/state";

interface Props {
  events: GameEvent[];
  /** 表示する最大件数（既定 2）。 */
  limit?: number;
}

const KIND_STYLE: Record<
  GameEvent["kind"],
  { mark: string; box: string; tag: string; label: string }
> = {
  Ko: {
    mark: "💥",
    box: "border-red-500 bg-red-100 text-red-900",
    tag: "bg-red-600",
    label: "撃破",
  },
  AttackFailed: {
    mark: "⚔",
    box: "border-amber-500 bg-amber-100 text-amber-900",
    tag: "bg-amber-500",
    label: "攻撃",
  },
  OffsetResolved: {
    mark: "🛡",
    box: "border-emerald-500 bg-emerald-100 text-emerald-900",
    tag: "bg-emerald-600",
    label: "相殺",
  },
  GameOver: {
    mark: "🏁",
    box: "border-sky-500 bg-sky-100 text-sky-900",
    tag: "bg-sky-600",
    label: "決着",
  },
  Welcome: {
    mark: "•",
    box: "border-zinc-300 bg-zinc-50 text-zinc-600",
    tag: "bg-zinc-400",
    label: "情報",
  },
};

export function EventLog({ events, limit = 2 }: Props) {
  const shown = events.slice(0, limit);

  if (shown.length === 0) {
    return (
      <div className="border border-dashed border-zinc-300 px-3 py-2 text-center text-[11px] text-zinc-400">
        戦況ログ（まだ動きはありません）
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {shown.map((e, i) => {
        const s = KIND_STYLE[e.kind];
        return (
          <div
            key={e.id}
            className={`animate-warn-drop flex items-center gap-2 border-2 px-2 py-1.5 ${s.box} ${
              i === 0 ? "" : "opacity-60"
            }`}
          >
            <span
              className={`shrink-0 px-1.5 py-0.5 text-[10px] font-black text-white ${s.tag}`}
            >
              {s.label}
            </span>
            <span className="shrink-0 text-base" aria-hidden>
              {s.mark}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{e.message}</span>
          </div>
        );
      })}
    </div>
  );
}
