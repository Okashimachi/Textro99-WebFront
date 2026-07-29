// ============================================================================
// PlayField — 主ディスプレイ。いま打つお題と被弾スタックだけを大きく見せる。
//
// レイアウト:
//   ・上段: 被弾スタック（横セグメント・count/limit）と誘発待ち表示。
//   ・中段: 現在のお題を画面内で最大サイズに。打鍵済みは緑（＝確定）、残りは黒。
//   ・下段: 打鍵の進捗バー。
// NEXT は右側の NextQueue、攻撃力は下の ComboGauge が担当する（1パネル1役割）。
//
// 入力は ViewModel の値と表示用の打鍵経過のみ。判定・戦闘数値の算出は一切しない
// （docs/rules/01 §3。判定は #8 TypingJudge、戦闘値はサーバー権威）。
// ============================================================================
import type { DakenInstance } from "@/proto/types";
import type { DakenStackState, DifficultyState } from "@/state";
import { romajiHint } from "@/typing/romaji";
import { Panel } from "./Panel";

interface Props {
  activeDaken: DakenInstance[];
  dakenStack: DakenStackState;
  /** 難易度（サーバー由来・表示だけ）。 */
  difficulty?: DifficultyState;
  /** 表示専用の打鍵途中経過（#8 TypingJudge が公開）。 */
  typedPrefix?: string;
  /** ミス打鍵の累計（#8・表示専用）。 */
  missCount?: number;
}

const TYPE_LABEL: Record<DakenInstance["type"], string> = {
  Normal: "通常",
  EnemySent: "被弾",
  Trap: "トラップ",
};

const TYPE_CHIP: Record<DakenInstance["type"], string> = {
  Normal: "border-sky-400 bg-sky-50 text-sky-700",
  EnemySent: "border-amber-500 bg-amber-50 text-amber-700",
  Trap: "border-red-500 bg-red-50 text-red-700",
};

// 被弾スタックのセグメント数の上限（表示だけ。limit が大きいときは丸めて描く）。
const MAX_SEGMENTS = 24;

export function PlayField({
  activeDaken,
  dakenStack,
  difficulty,
  typedPrefix = "",
  missCount = 0,
}: Props) {
  const current = activeDaken[0];
  const matched = current && current.text.startsWith(typedPrefix) ? typedPrefix.length : 0;
  const total = current?.text.length ?? 0;
  const progress = total > 0 ? (matched / total) * 100 : 0;

  const { count, limit, trapPending } = dakenStack;
  const segments = Math.min(limit || 0, MAX_SEGMENTS);
  const ratio = limit > 0 ? Math.min(1, count / limit) : 0;
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;
  const stackColor = danger ? "text-red-600" : warn ? "text-amber-600" : "text-emerald-600";

  return (
    <Panel
      label="いま打つお題"
      tone="info"
      right={`ミス ${missCount} / ${total}打`}
      bodyClassName="p-3 space-y-2"
    >
      {/* 被弾スタック（横セグメント） */}
      <div>
        <div className="flex items-end justify-between">
          <span className="text-[10px] tracking-wide text-zinc-500">
            被弾スタック（満タンで脱落）
          </span>
          <span className="text-[11px] tabular-nums text-zinc-500">
            <span className={`text-base font-black ${stackColor}`}>{count}</span>
            <span> / {limit || "—"}</span>
          </span>
        </div>
        <div className={`mt-1 flex gap-px ${danger ? "animate-danger-pulse" : ""}`}>
          {segments > 0 ? (
            Array.from({ length: segments }).map((_, i) => {
              const on = i < Math.round(ratio * segments);
              return (
                <span
                  key={i}
                  className={`h-3 flex-1 border ${
                    on
                      ? danger
                        ? "border-red-700 bg-red-600"
                        : warn
                          ? "border-amber-500 bg-amber-400"
                          : "border-emerald-600 bg-emerald-500"
                      : "border-zinc-300 bg-zinc-100"
                  }`}
                />
              );
            })
          ) : (
            <span className="h-3 flex-1 border border-zinc-300 bg-zinc-100" />
          )}
        </div>
        {trapPending && (
          <div className="mt-1 inline-block border border-red-500 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
            💣 トラップ誘発待ち
          </div>
        )}
      </div>

      {/* 現在のお題 */}
      <div className="flex min-h-[150px] flex-col items-center justify-center border-2 border-sky-200 bg-sky-50/40 px-3 py-4 text-center">
        {current ? (
          <>
            <div className="mb-1 flex items-center justify-center gap-1.5 text-[10px]">
              <span className={`border px-1 py-0.5 font-bold ${TYPE_CHIP[current.type]}`}>
                {TYPE_LABEL[current.type]}
              </span>
              <span className="text-zinc-500 tabular-nums">
                Lv{current.difficultyLevel}
                {difficulty && ` / 実効 Lv${difficulty.effectiveLevel}`}
              </span>
            </div>
            <div
              key={current.dakenId}
              className="animate-plate-pop text-5xl font-black tracking-wide text-zinc-900"
            >
              <span className="text-emerald-600">{current.text.slice(0, matched)}</span>
              <span>{current.text.slice(matched)}</span>
            </div>
            <div className="mt-2 font-mono text-lg tracking-[0.35em] text-zinc-500">
              <span className="text-emerald-600">{romajiHint(current.text.slice(0, matched))}</span>
              <span>{romajiHint(current.text.slice(matched))}</span>
            </div>
          </>
        ) : (
          <div className="py-6 text-sm text-zinc-500">（お題待ち）</div>
        )}
      </div>

      {/* 打鍵の進捗 */}
      <div className="h-1.5 w-full bg-zinc-100">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Panel>
  );
}
