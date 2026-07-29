// ============================================================================
// PlayField — 主ディスプレイ。いま打つお題だけを最大サイズで見せる。
//
// レイアウト:
//   ・中央: 現在のお題（打鍵済みは緑＝確定、残りは黒）とローマ字ヒント。
//   ・下端: 打鍵の進捗バー。
//   ・右下: 攻撃力（ComboGauge・円形バッジ）を重ねる。
// NEXT と被弾の溜まり具合は右の NextQueue、通知は上の EventLog が担当する。
//
// 入力は ViewModel の値と表示用の打鍵経過のみ。判定・戦闘数値の算出は一切しない
// （docs/rules/01 §3。判定は #8 TypingJudge、戦闘値はサーバー権威）。
// ============================================================================
import type { DakenInstance } from "@/proto/types";
import type { ComboState, DifficultyState } from "@/state";
import { romajiHint } from "@/typing/romaji";
import { ComboGauge } from "./ComboGauge";
import { Panel } from "./Panel";

interface Props {
  activeDaken: DakenInstance[];
  /** 攻撃力（右下の円形バッジ）。 */
  combo: ComboState;
  /** 難易度（サーバー由来・表示だけ）。 */
  difficulty?: DifficultyState;
  /** 表示専用の打鍵途中経過（#8 TypingJudge が公開）。 */
  typedPrefix?: string;
  /** ミス打鍵の累計（#8・表示専用）。 */
  missCount?: number;
}

// 種別ごとの盤面の縁色（NEXT と同じ意味づけ: 通常=青 / 被弾=琥珀 / トラップ=赤）。
const TYPE_FRAME: Record<DakenInstance["type"], string> = {
  Normal: "border-sky-300 bg-sky-50/40",
  EnemySent: "border-amber-400 bg-amber-50/60",
  Trap: "border-red-500 bg-red-50",
};

export function PlayField({
  activeDaken,
  combo,
  difficulty,
  typedPrefix = "",
  missCount = 0,
}: Props) {
  const current = activeDaken[0];
  const matched = current && current.text.startsWith(typedPrefix) ? typedPrefix.length : 0;
  const total = current?.text.length ?? 0;
  const progress = total > 0 ? (matched / total) * 100 : 0;

  return (
    <Panel
      label="いま打つお題"
      tone="info"
      right={
        <span>
          {difficulty && `Lv${difficulty.effectiveLevel} / `}
          ミス {missCount}
        </span>
      }
      bodyClassName="p-3"
    >
      <div
        className={`relative flex min-h-[200px] flex-col items-center justify-center border-2 px-4 py-6 text-center ${
          current ? TYPE_FRAME[current.type] : "border-zinc-200 bg-zinc-50"
        }`}
      >
        {current ? (
          <>
            <div
              key={current.dakenId}
              className="animate-plate-pop text-6xl font-black tracking-wide text-zinc-900"
            >
              <span className="text-emerald-600">{current.text.slice(0, matched)}</span>
              <span>{current.text.slice(matched)}</span>
            </div>
            <div className="mt-3 font-mono text-xl tracking-[0.35em] text-zinc-500">
              <span className="text-emerald-600">
                {romajiHint(current.text.slice(0, matched))}
              </span>
              <span>{romajiHint(current.text.slice(matched))}</span>
            </div>
          </>
        ) : (
          <div className="text-sm text-zinc-400">（お題待ち）</div>
        )}

        {/* 右下に攻撃力（コンボ）を重ねる */}
        <div className="absolute -bottom-3 -right-3">
          <ComboGauge combo={combo} />
        </div>
      </div>

      {/* 打鍵の進捗 */}
      <div className="mt-2 h-2 w-full bg-zinc-100">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Panel>
  );
}
