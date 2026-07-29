// ============================================================================
// PlayField — 「お題」パネル。被弾スタック・現在のお題・NEXT キューをまとめた盤面。
//
// レイアウト（戦況コンソール）:
//   ・上段: 被弾スタック（横並びのセグメントバー・count/limit）と誘発待ち表示。
//   ・中段: 現在のお題を最大サイズで。打鍵済みは緑（＝確定）、残りは黒。下にローマ字ヒント。
//   ・下段: NEXT のお題を行リストで（種別チップ付き）。
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
  const upcoming = activeDaken.slice(1, 4);
  const matched = current && current.text.startsWith(typedPrefix) ? typedPrefix.length : 0;
  const total = current?.text.length ?? 0;

  const { count, limit, trapPending } = dakenStack;
  const segments = Math.min(limit || 0, MAX_SEGMENTS);
  const ratio = limit > 0 ? Math.min(1, count / limit) : 0;
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;
  const stackColor = danger ? "text-red-600" : warn ? "text-amber-600" : "text-emerald-600";

  return (
    <Panel
      label="お題"
      tone="info"
      right={`ミス ${missCount} / ${total}打`}
      bodyClassName="p-3 space-y-3"
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
      <div className="border-2 border-sky-200 bg-sky-50/40 px-3 py-4 text-center">
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
              className="animate-plate-pop text-4xl font-black tracking-wide text-zinc-900 sm:text-5xl"
            >
              <span className="text-emerald-600">{current.text.slice(0, matched)}</span>
              <span>{current.text.slice(matched)}</span>
            </div>
            <div className="mt-1 font-mono text-sm tracking-[0.35em] text-zinc-500">
              <span className="text-emerald-600">{romajiHint(current.text.slice(0, matched))}</span>
              <span>{romajiHint(current.text.slice(matched))}</span>
            </div>
          </>
        ) : (
          <div className="py-6 text-sm text-zinc-500">（お題待ち）</div>
        )}
      </div>

      {/* NEXT キュー */}
      <ul className="space-y-px">
        {upcoming.length === 0 && (
          <li className="border border-zinc-300 px-2 py-1 text-[11px] text-zinc-500">
            NEXT なし
          </li>
        )}
        {upcoming.map((d, i) => (
          <li
            key={d.dakenId}
            className="animate-queue-in flex items-center gap-2 border border-zinc-300 px-2 py-1"
          >
            <span className="w-8 shrink-0 text-[10px] font-bold text-zinc-500 tabular-nums">
              {i + 1}
            </span>
            <span
              className={`shrink-0 border px-1 text-[10px] font-bold ${TYPE_CHIP[d.type]}`}
            >
              {TYPE_LABEL[d.type]}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-900">
              {d.text}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-500">
              {romajiHint(d.text)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
