// ============================================================================
// PlayField — 寿司打×テトリス99 のメインプレイ盤面（表示専用）。
//
// ・お題ダケンを寿司皿に見立て、右から中央へ流れてくるコンベアとして描画する。
// ・中央の的（ターゲットゾーン）に現在のお題を大きく表示し、打鍵途中経過を色分けする。
// ・被弾で溜まったダケンスタックは盤面下部の背景に皿が積み上がる様子で可視化する。
//
// 入力は ViewModel の値と表示用の打鍵経過のみ。判定・戦闘数値の算出は一切しない
// （docs/rules/01 §3。判定は #8 TypingJudge、戦闘値はサーバー権威）。
// ============================================================================
import type { DakenInstance } from "@/proto/types";
import type { DakenStackState } from "@/state";
import { romajiHint } from "@/typing/romaji";

interface Props {
  activeDaken: DakenInstance[];
  dakenStack: DakenStackState;
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

// 皿ごとのアクセント色（ネタの色分けに見立てる・表示だけ）。
const TYPE_ACCENT: Record<DakenInstance["type"], string> = {
  Normal: "from-sky-500/30 to-sky-400/10 border-sky-400/50",
  EnemySent: "from-amber-500/30 to-amber-400/10 border-amber-400/60",
  Trap: "from-rose-600/40 to-rose-500/10 border-rose-400/70",
};

const TYPE_TEXT: Record<DakenInstance["type"], string> = {
  Normal: "text-sky-200",
  EnemySent: "text-amber-200",
  Trap: "text-rose-200",
};

export function PlayField({
  activeDaken,
  dakenStack,
  typedPrefix = "",
  missCount = 0,
}: Props) {
  const current = activeDaken[0];
  const upcoming = activeDaken.slice(1, 5);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 shadow-inner">
      {/* 背景：被弾スタックの積み上がり（下からせり上がる） */}
      <EnemyStackBackground dakenStack={dakenStack} />

      {/* 前景：コンベア */}
      <div className="relative z-10 flex h-[320px] flex-col">
        {/* 上部ステータス */}
        <div className="flex items-center justify-between px-4 pt-3 text-xs">
          <span className="text-slate-400">
            お題ダケン{activeDaken.length > 0 ? ` ・ 待ち ${activeDaken.length}` : ""}
          </span>
          {current && (
            <span className="text-slate-400">
              打鍵 <span className="tabular-nums text-slate-200">{typedPrefix.length}</span>/
              {current.text.length}
              {missCount > 0 && (
                <span className="ml-2 text-rose-400">ミス {missCount}</span>
              )}
            </span>
          )}
        </div>

        {/* 中央ターゲットゾーン＋コンベア */}
        <div className="relative flex flex-1 items-center">
          {/* コンベアベルト（流れる背景） */}
          <div className="animate-belt absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 border-y border-slate-700/60 bg-slate-800/40" />

          {/* 中央の的マーカー */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-28 w-[min(560px,72%)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-dashed border-sky-400/40" />

          {/* 現在のお題（中央の皿） */}
          <div className="relative z-30 mx-auto w-[min(560px,72%)]">
            {current ? (
              <CurrentPlate
                key={current.dakenId}
                daken={current}
                typedPrefix={typedPrefix}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/60 text-slate-500">
                （お題待ち）
              </div>
            )}
          </div>

          {/* 右から流れてくる次のお題（小皿） */}
          <div className="pointer-events-none absolute right-3 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2">
            {upcoming.map((d, i) => (
              <div
                key={d.dakenId}
                className={`animate-sushi-in flex h-14 min-w-[54px] flex-col items-center justify-center rounded-xl border bg-gradient-to-b px-2 text-center ${TYPE_ACCENT[d.type]}`}
                style={{ opacity: 1 - i * 0.18 }}
                title={d.text}
              >
                <span className="text-[9px] text-slate-400">{TYPE_LABEL[d.type]}</span>
                <span className={`max-w-[72px] truncate text-xs font-bold ${TYPE_TEXT[d.type]}`}>
                  {d.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 入力ヒント */}
        <div className="px-4 pb-3 text-center text-[11px] text-slate-500">
          ローマ字で入力 ・ <span className="text-slate-400">Enter</span>=攻撃 ・{" "}
          <span className="text-slate-400">0-9</span>=作戦
        </div>
      </div>
    </div>
  );
}

// 中央の大皿：お題テキスト（打鍵ハイライト）とローマ字ヒント。
function CurrentPlate({
  daken,
  typedPrefix,
}: {
  daken: DakenInstance;
  typedPrefix: string;
}) {
  const matched = daken.text.startsWith(typedPrefix) ? typedPrefix.length : 0;
  return (
    <div
      className={`animate-plate-pop rounded-2xl border-2 bg-gradient-to-b px-6 py-4 text-center shadow-lg ${TYPE_ACCENT[daken.type]}`}
    >
      <div className="mb-1 flex items-center justify-center gap-2 text-[10px]">
        <span className={`rounded-full bg-slate-900/70 px-2 py-0.5 ${TYPE_TEXT[daken.type]}`}>
          {TYPE_LABEL[daken.type]} ・ Lv{daken.difficultyLevel}
        </span>
      </div>
      <div className="text-4xl font-black tracking-wide">
        <span className="text-emerald-400">{daken.text.slice(0, matched)}</span>
        <span className="text-slate-100">{daken.text.slice(matched)}</span>
      </div>
      <div className="mt-1 font-mono text-lg tracking-wider text-slate-400">
        {romajiHint(daken.text)}
      </div>
    </div>
  );
}

// 盤面下部の背景：被弾で溜まったダケンスタックを積み皿で可視化（テトリス99的な圧の表現）。
function EnemyStackBackground({ dakenStack }: { dakenStack: DakenStackState }) {
  const { count, limit, trapPending } = dakenStack;
  const ratio = limit > 0 ? count / limit : 0;
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;
  const plateColor = danger
    ? "bg-rose-500/70"
    : warn
      ? "bg-amber-400/70"
      : "bg-emerald-500/60";
  // 皿は最大10段まで可視化（それ以上は数値で補う）。
  const shown = Math.min(count, 10);
  const heightPct = limit > 0 ? Math.min(100, ratio * 100) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* せり上がる被弾ゾーン */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-[height] duration-500 ${
          danger ? "animate-danger-pulse" : ""
        }`}
        style={{
          height: `${heightPct}%`,
          background:
            "linear-gradient(to top, rgba(244,63,94,0.16), rgba(244,63,94,0.02))",
        }}
      />
      {/* 積み皿 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end gap-1 p-2">
        {Array.from({ length: shown }).map((_, i) => (
          <div
            key={i}
            className={`animate-stack-rise h-1.5 rounded-full ${plateColor}`}
            style={{ width: `${40 + i * 5}%`, maxWidth: "80%" }}
          />
        ))}
      </div>
      {/* 件数バッジ */}
      <div className="absolute bottom-2 left-3 flex items-center gap-2 text-xs">
        <span className="rounded bg-slate-900/80 px-2 py-1 text-slate-300">
          被弾スタック{" "}
          <span
            className={`font-bold tabular-nums ${
              danger ? "text-rose-300" : warn ? "text-amber-300" : "text-emerald-300"
            }`}
          >
            {count}
          </span>
          <span className="text-slate-500"> / {limit || "—"}</span>
        </span>
        {trapPending && (
          <span className="animate-danger-pulse rounded bg-rose-600 px-2 py-1 text-[10px] font-bold text-white">
            トラップ誘発待ち
          </span>
        )}
      </div>
    </div>
  );
}
