// ============================================================================
// PlayField — 主ディスプレイ。いま打つお題だけを最大サイズで見せる。
//
// レイアウト:
//   ・上端: 制限時間の残り（useDakenTimer の表示用カウントダウン）。残り僅かで琥珀→赤。
//     危険域では画面全体もフラッシュする（InMatchScreen 側のオーバーレイ）。
//     **時間切れの確定はサーバー権威**（DakenExpired）で、ここでは一切判定しない。
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
import type { DakenTimer } from "./useDakenTimer";

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
  /** 残り時間（useDakenTimer の結果。画面全体の警告と基準を揃えるため親から渡す）。 */
  timer: DakenTimer;
  /** 外側パネルの追加クラス（高さの引き伸ばし用）。 */
  className?: string;
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
  timer,
  className = "",
}: Props) {
  const current = activeDaken[0];
  const { show: showTimer, remainMs, ratio: timeRatio, warn: timeWarn, danger: timeDanger } =
    timer;

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
      className={className}
      bodyClassName="flex min-h-0 flex-col p-3"
    >
      {/* 制限時間の警告（表示専用・時間切れの確定はサーバー） */}
      {showTimer && (
        <div className={`mb-2 shrink-0 ${timeDanger ? "animate-danger-pulse" : ""}`}>
          <div className="flex items-baseline justify-between text-[10px]">
            <span className="text-zinc-500">残り時間</span>
            <span
              className={`font-black tabular-nums ${
                timeDanger
                  ? "text-red-600"
                  : timeWarn
                    ? "text-amber-600"
                    : "text-zinc-600"
              }`}
            >
              {(remainMs / 1000).toFixed(1)}秒
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-100">
            <div
              className={`h-full transition-[width] duration-100 ${
                timeDanger ? "bg-red-500" : timeWarn ? "bg-amber-400" : "bg-sky-500"
              }`}
              style={{ width: `${timeRatio * 100}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={`relative flex min-h-[200px] flex-1 flex-col items-center justify-center border-2 px-4 py-6 text-center ${
          timeDanger
            ? "border-red-500 bg-red-50"
            : current
              ? TYPE_FRAME[current.type]
              : "border-zinc-200 bg-zinc-50"
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
      <div className="mt-2 h-2 w-full shrink-0 bg-zinc-100">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Panel>
  );
}
