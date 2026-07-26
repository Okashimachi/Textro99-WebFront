// DakenDisplay — 出題ダケンと打鍵ハイライト表示。
// DTO（DakenInstance）と表示用の打鍵途中経過(typedPrefix)のみを入力とし、判定ロジックは持たない。
// 判定は #8 TypingJudge の責務。ここは「表示」だけ。
import type { DakenInstance } from "@/proto/types";

interface Props {
  activeDaken: DakenInstance[];
  /** 表示専用の打鍵途中経過（#8 が公開する予定）。未接続時は空。 */
  typedPrefix?: string;
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

export function DakenDisplay({ activeDaken, typedPrefix = "" }: Props) {
  const current = activeDaken[0];
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-1 text-xs text-slate-400">
        出題ダケン {activeDaken.length > 0 ? `(残り ${activeDaken.length})` : ""}
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
