// DakenDisplay — 出題ダケンと打鍵ハイライト表示。
// DTO（DakenInstance）と表示用の打鍵途中経過(typedPrefix)のみを入力とし、判定ロジックは持たない。
// 判定は #8 TypingJudge の責務。ここは「表示」だけ。
import type { DakenInstance } from "@/proto/types";
import { romajiHint } from "@/typing/romaji";

interface Props {
  activeDaken: DakenInstance[];
  /** 表示専用の打鍵途中経過（#8 TypingJudge が公開）。未接続時は空。 */
  typedPrefix?: string;
  /** ミス打鍵の累計（#8・表示専用）。 */
  missCount?: number;
}

const TYPE_LABEL: Record<DakenInstance["type"], string> = {
  Normal: "通常",
  EnemySent: "被弾",
  Trap: "トラップ",
};

const TYPE_COLOR: Record<DakenInstance["type"], string> = {
  Normal: "text-slate-100",
  EnemySent: "text-amber-300",
  Trap: "text-rose-400",
};

export function DakenDisplay({ activeDaken, typedPrefix = "", missCount = 0 }: Props) {
  const current = activeDaken[0];
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>出題ダケン {activeDaken.length > 0 ? `(残り ${activeDaken.length})` : ""}</span>
        {current && (
          <span>
            打鍵 {typedPrefix.length}/{current.text.length}
            {missCount > 0 && <span className="ml-2 text-rose-400">ミス {missCount}</span>}
          </span>
        )}
      </div>
      {current ? (
        <div>
          <span
            className={`mr-2 rounded px-1.5 py-0.5 text-[10px] ${TYPE_COLOR[current.type]} bg-slate-900`}
          >
            {TYPE_LABEL[current.type]} Lv{current.difficultyLevel}
          </span>
          <div className={`mt-2 text-3xl font-bold tracking-wide ${TYPE_COLOR[current.type]}`}>
            {highlight(current.text, typedPrefix)}
          </div>
          <div className="mt-1 font-mono text-lg tracking-wide text-slate-400">
            {romajiHint(current.text)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            ローマ字で入力（Enter=攻撃 / 0-9=作戦）
          </div>
        </div>
      ) : (
        <div className="text-slate-500">（出題待ち）</div>
      )}
    </div>
  );
}

// 打鍵済みプレフィックスと未打鍵部分を色分け表示（純粋な表示処理）。
function highlight(text: string, typed: string) {
  const matched = text.startsWith(typed) ? typed.length : 0;
  return (
    <>
      <span className="text-emerald-400">{text.slice(0, matched)}</span>
      <span>{text.slice(matched)}</span>
    </>
  );
}
