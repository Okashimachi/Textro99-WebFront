// ============================================================================
// NextQueue — これから打つお題のストック。上が「次」で、下へ向かって溜まっていく。
//
// 兼ねる役割:
//   ・次に何が来るかの先読み（ひらがなだけをコンパクトに縦積み。次の1件だけ2倍の高さで強調）。
//   ・被弾でどれくらい溜まっているか＝あと何枠でゲームオーバーかの可視化。
//     溜まり具合は「窓全体の地色」で示し、危険域では前景（お題の札）をゆっくり点滅させる。
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
  /** 被弾スタック（窓の地色に反映・サーバー由来）。 */
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

  const { count, limit: stackLimit, trapPending } = dakenStack;
  const remain = stackLimit > 0 ? Math.max(0, stackLimit - count) : null;
  const ratio = stackLimit > 0 ? Math.min(1, count / stackLimit) : 0;
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;

  // 溜まり具合＝窓全体の地色（静止）。危険域は前景（札）を点滅させて知らせる。
  const windowTone = danger ? "bg-red-100" : warn ? "bg-amber-50" : "bg-white";
  const remainColor = danger
    ? "text-red-600"
    : warn
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <Panel
      label="NEXT"
      tone="info"
      className="h-full"
      right={
        <span className="flex items-center gap-2">
          {trapPending && (
            <span className="animate-danger-pulse border border-red-500 bg-red-100 px-1 font-bold text-red-700">
              💣 誘発待ち
            </span>
          )}
          {remain != null ? (
            <span>
              あと{" "}
              <span className={`text-sm font-black ${remainColor}`}>{remain}</span>{" "}
              でゲームオーバー
            </span>
          ) : (
            <span>{upcoming.length} 件</span>
          )}
        </span>
      }
      bodyClassName={`flex flex-col gap-1 overflow-hidden p-2 transition-colors ${windowTone}`}
    >
      {upcoming.length === 0 ? (
        <div className="border border-dashed border-zinc-300 px-2 py-4 text-center text-[11px] text-zinc-400">
          次のお題を待っています
        </div>
      ) : (
        // 上が「次」。以降は下へ向かって積まれる。
        upcoming.map((d, i) => {
          const isNext = i === 0;
          return (
            <div
              key={d.dakenId}
              className={`animate-queue-in flex shrink-0 items-center truncate border px-2 font-bold leading-tight ${
                TYPE_LOOK[d.type]
              } ${
                isNext
                  ? "h-16 border-2 text-2xl shadow-sm"
                  : "h-9 text-lg"
              } ${danger ? "animate-fg-alert" : ""}`}
            >
              {d.text}
            </div>
          );
        })
      )}
    </Panel>
  );
}
