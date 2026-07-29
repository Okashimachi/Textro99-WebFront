// ComboGauge — 「OUT（自分の攻撃）」パネル。コンボ値＝攻撃の原資をブロック段で見せる。
// 値はサーバー由来（ComboUpdated）。ローカル算出しない（docs/rules/01 §3）。
// 表示方針: 大きな数値＋10段ブロックで「どれだけ溜まっているか」を一目で読ませる。
import type { ComboState } from "@/state";
import { Panel } from "./Panel";

interface Props {
  combo: ComboState;
}

// ブロック段数（表示だけ。戦闘の閾値ではない）。
const GAUGE_FULL = 10;

export function ComboGauge({ combo }: Props) {
  const filled = Math.min(combo.value, GAUGE_FULL);
  const hot = combo.value >= GAUGE_FULL;

  return (
    <Panel
      label="OUT — 自分の攻撃"
      tone="accent"
      right={hot ? "MAX" : `${filled} / ${GAUGE_FULL}`}
    >
      <div className="text-[10px] tracking-wide text-zinc-500">攻撃力（コンボ）</div>
      <div className="flex items-baseline gap-2">
        <span
          key={combo.value}
          className={`animate-value-bump text-5xl font-black leading-none tabular-nums ${
            hot ? "text-amber-500" : "text-red-600"
          }`}
        >
          {combo.value}
        </span>
        {hot && (
          <span className="border border-amber-500 bg-amber-100 px-1 text-[10px] font-bold text-amber-700">
            MAX
          </span>
        )}
        {combo.lastReason && (
          <span className="ml-auto text-right text-[11px] leading-tight text-zinc-500">
            <span className="tabular-nums">
              {combo.lastDelta >= 0 ? `+${combo.lastDelta}` : combo.lastDelta}
            </span>
            <span className="ml-1">（{combo.lastReason}）</span>
          </span>
        )}
      </div>

      {/* 10段ブロック */}
      <div className="mt-2 flex gap-px">
        {Array.from({ length: GAUGE_FULL }).map((_, i) => (
          <span
            key={i}
            className={`h-5 flex-1 border ${
              i < filled
                ? hot
                  ? "border-amber-500 bg-amber-400"
                  : "border-red-700 bg-red-600"
                : "border-zinc-300 bg-zinc-100"
            }`}
          />
        ))}
      </div>

      <div
        className={`mt-2 flex items-center gap-2 border px-2 py-1 text-[11px] ${
          hot
            ? "animate-danger-pulse border-amber-500 bg-amber-50 text-amber-800"
            : "border-zinc-300 text-zinc-500"
        }`}
      >
        <span aria-hidden>⏎</span>
        <span className="font-bold">Enter で攻撃発射</span>
        <span className="ml-auto tabular-nums">威力 {combo.value}</span>
      </div>
    </Panel>
  );
}
