// ============================================================================
// NextQueue — これから打つお題を「下から積み上がる」形で見せるパネル。
//
// 兼ねる役割:
//   ・次に何が来るかの先読み（ひらがなだけをコンパクトに縦積み）。
//   ・被弾でどれくらい溜まっているか＝あと何枠でゲームオーバーかの可視化。
//     左のレールが被弾スタック（サーバー由来 count/limit）を下から塗る。
//
// 種別は色で区別する（通常=黒 / 被弾=琥珀 / トラップ=赤）。ラベル・Lv・ローマ字は出さない。
// 入力は DTO と ViewModel のみ。判定・戦闘数値の算出はしない（docs/rules/01 §3）。
// ============================================================================
import type { DakenInstance } from "@/proto/types";
import type { DakenStackState } from "@/state";
import { Panel } from "./Panel";

interface Props {
  /** 現在のお題を含む出題列（先頭＝現在。先頭は主ディスプレイ側で出す）。 */
  activeDaken: DakenInstance[];
  /** 被弾スタック（レール表示用・サーバー由来）。 */
  dakenStack: DakenStackState;
  /** 何件先まで見せるか（既定 12）。 */
  limit?: number;
}

// 種別ごとの見た目（色だけで区別する）。
const TYPE_LOOK: Record<DakenInstance["type"], string> = {
  Normal: "border-zinc-300 bg-white text-zinc-900",
  EnemySent: "border-amber-400 bg-amber-50 text-amber-800",
  Trap: "border-red-500 bg-red-100 text-red-800",
};

export function NextQueue({ activeDaken, dakenStack, limit = 12 }: Props) {
  const upcoming = activeDaken.slice(1, 1 + limit);

  const { count, limit: stackLimit } = dakenStack;
  const remain = stackLimit > 0 ? Math.max(0, stackLimit - count) : null;
  const ratio = stackLimit > 0 ? Math.min(1, count / stackLimit) : 0;
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;
  const railFill = danger ? "bg-red-500" : warn ? "bg-amber-400" : "bg-emerald-500";
  const remainColor = danger ? "text-red-600" : warn ? "text-amber-600" : "text-emerald-600";

  return (
    <Panel
      label="NEXT"
      tone="info"
      className="h-full"
      right={
        remain != null ? (
          <span>
            あと <span className={`text-sm font-black ${remainColor}`}>{remain}</span> でゲームオーバー
          </span>
        ) : (
          `${upcoming.length} 件`
        )
      }
      bodyClassName="p-2 flex gap-2"
    >
      {/* 左レール: 被弾スタックの溜まり具合（下から埋まる） */}
      <div
        className={`relative w-3 shrink-0 border border-zinc-300 bg-zinc-100 ${
          danger ? "animate-danger-pulse" : ""
        }`}
        title={`被弾スタック ${count} / ${stackLimit || "—"}`}
      >
        <div
          className={`absolute inset-x-0 bottom-0 transition-[height] duration-300 ${railFill}`}
          style={{ height: `${ratio * 100}%` }}
        />
      </div>

      {/* お題の積み上げ（下端が「次」） */}
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-1">
        {upcoming.length === 0 ? (
          <div className="my-auto border border-dashed border-zinc-300 px-2 py-4 text-center text-[11px] text-zinc-400">
            次のお題を待っています
          </div>
        ) : (
          upcoming
            .slice()
            .reverse()
            .map((d, revIdx) => {
              const isNext = revIdx === upcoming.length - 1;
              return (
                <div
                  key={d.dakenId}
                  className={`animate-queue-in truncate border px-2 py-1 font-bold leading-tight ${
                    TYPE_LOOK[d.type]
                  } ${isNext ? "border-2 text-xl" : "text-base"}`}
                >
                  {d.text}
                </div>
              );
            })
        )}
      </div>
    </Panel>
  );
}
