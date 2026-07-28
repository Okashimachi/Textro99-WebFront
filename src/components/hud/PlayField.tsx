// ============================================================================
// PlayField — お題キューと被弾スタックを統合した縦レーン盤面（表示専用）。
//
// メタファ（寿司打 × テトリス99）:
//   ・レーンの下端が「現在のお題（ターゲット）」。上に向かって NEXT のお題札が積まれる。
//   ・被弾スタック（危険度）はレーン上部から降りてくる「天井（せり下がる圧）」として表現。
//     スタックが満タンに近いほど天井が下がり、お題キューに迫る＝脱落圧が直感的に分かる。
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

const TYPE_ICON: Record<DakenInstance["type"], string> = {
  Normal: "🍣",
  EnemySent: "⚡",
  Trap: "💣",
};

const TYPE_ACCENT: Record<
  DakenInstance["type"],
  { card: string; pill: string; text: string; bar: string }
> = {
  Normal: {
    card: "border-sky-400/60 from-sky-500/20 to-slate-900",
    pill: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    text: "text-sky-200",
    bar: "from-sky-500 to-cyan-400",
  },
  EnemySent: {
    card: "border-amber-400/70 from-amber-500/20 to-slate-900",
    pill: "border-amber-400/50 bg-amber-500/15 text-amber-200",
    text: "text-amber-200",
    bar: "from-amber-500 to-yellow-400",
  },
  Trap: {
    card: "border-rose-400/80 from-rose-600/25 to-slate-900",
    pill: "border-rose-400/50 bg-rose-500/15 text-rose-200",
    text: "text-rose-200",
    bar: "from-rose-500 to-pink-400",
  },
};

export function PlayField({
  activeDaken,
  dakenStack,
  typedPrefix = "",
  missCount = 0,
}: Props) {
  const current = activeDaken[0];
  // 上に向かって積む NEXT（近い順に下→上へ）。近いものを現在お題のすぐ上に置く。
  const upcoming = activeDaken.slice(1, 4);
  const accent = current ? TYPE_ACCENT[current.type] : TYPE_ACCENT.Normal;
  const matched = current && current.text.startsWith(typedPrefix) ? typedPrefix.length : 0;
  const total = current?.text.length ?? 0;
  const progress = total > 0 ? (matched / total) * 100 : 0;

  // 被弾スタック（天井）の高さ比・危険度。
  const { count, limit, trapPending } = dakenStack;
  const ratio = limit > 0 ? Math.min(1, count / limit) : 0;
  const danger = ratio >= 0.85;
  const warn = ratio >= 0.6;
  const ceilFill = danger
    ? "from-rose-600/70 to-rose-500/10"
    : warn
      ? "from-amber-500/60 to-amber-400/5"
      : "from-emerald-500/40 to-emerald-400/5";
  const stackNum = danger ? "text-rose-300" : warn ? "text-amber-300" : "text-emerald-300";

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-md overflow-hidden rounded-3xl border-2 border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
      {/* 天井：被弾スタックがせり下がってくる圧（上から height 比で降りる） */}
      <div
        className={`absolute inset-x-0 top-0 z-0 bg-gradient-to-b ${ceilFill} transition-[height] duration-500 ${
          danger ? "animate-danger-pulse" : ""
        }`}
        style={{ height: `${ratio * 100}%` }}
      >
        {/* 天井の縁（ギザギザの圧） */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10" />
      </div>

      {/* 被弾スタック件数バッジ（左上） */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <span className="rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs backdrop-blur-sm">
          <span className="text-slate-400">被弾 </span>
          <span className={`text-base font-black tabular-nums ${stackNum}`}>{count}</span>
          <span className="text-slate-500"> / {limit || "—"}</span>
        </span>
        {trapPending && (
          <span className="animate-danger-pulse rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white">
            💣 誘発待ち
          </span>
        )}
      </div>

      {/* 打鍵ステータス（右上） */}
      {current && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2 text-xs tabular-nums">
          <span className="rounded-lg bg-slate-950/80 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-base font-black text-slate-100">{matched}</span>
            <span className="text-slate-500">/{total}</span>
          </span>
          {missCount > 0 && (
            <span className="rounded-lg bg-rose-500/25 px-2 py-1 font-bold text-rose-300">
              ミス {missCount}
            </span>
          )}
        </div>
      )}

      {/* お題キュー：下寄せで、現在お題の上に NEXT を積む */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end gap-2 px-4 pb-4 pt-12">
        {/* NEXT（遠い→近いの順で上→下に並べる） */}
        {upcoming
          .slice()
          .reverse()
          .map((d, revIdx) => {
            // revIdx=0 が最遠。近いほど大きく・不透明に。
            const nearness = upcoming.length - revIdx; // 1..n（大きいほど近い）
            const a = TYPE_ACCENT[d.type];
            return (
              <div
                key={d.dakenId}
                className={`animate-queue-in flex w-full max-w-xs items-center gap-2 rounded-xl border px-3 py-2 ${a.pill}`}
                style={{ opacity: 0.45 + nearness * 0.18, transform: `scale(${0.9 + nearness * 0.03})` }}
              >
                <span className="text-sm" aria-hidden>
                  {TYPE_ICON[d.type]}
                </span>
                <span className="text-[10px] font-bold text-slate-400">NEXT</span>
                <span className={`truncate text-base font-bold ${a.text}`}>{d.text}</span>
              </div>
            );
          })}

        {/* 現在のお題（ターゲット・最下段で最大） */}
        {current ? (
          <div
            key={current.dakenId}
            className={`animate-plate-pop w-full rounded-2xl border-2 bg-gradient-to-b px-5 py-4 text-center shadow-xl ${accent.card}`}
          >
            <div className="mb-1 flex items-center justify-center gap-1.5">
              <span className="text-base" aria-hidden>
                {TYPE_ICON[current.type]}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${accent.pill}`}
              >
                {TYPE_LABEL[current.type]} ・ Lv{current.difficultyLevel}
              </span>
            </div>
            <div className="text-4xl font-black tracking-wide sm:text-5xl">
              <span className="text-emerald-400">{current.text.slice(0, matched)}</span>
              <span className="text-slate-100">{current.text.slice(matched)}</span>
            </div>
            <div className="mt-1.5 font-mono text-lg tracking-widest text-slate-400">
              <span className="text-emerald-500/80">
                {romajiHint(current.text.slice(0, matched))}
              </span>
              {romajiHint(current.text.slice(matched)) && (
                <span>
                  {matched > 0 ? " " : ""}
                  {romajiHint(current.text.slice(matched))}
                </span>
              )}
            </div>
            {/* 進捗バー */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-[width] duration-150`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/60 text-slate-500">
            （お題待ち）
          </div>
        )}
      </div>
    </div>
  );
}
