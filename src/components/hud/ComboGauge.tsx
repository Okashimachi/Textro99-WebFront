// ComboGauge — 攻撃力（コンボ）を円形バッジで示す。主ディスプレイの右下に重ねて使う。
// 値はサーバー由来（ComboUpdated）。ローカル算出しない（docs/rules/01 §3）。
// 表示方針: 打鍵中も視線を動かさずに済むよう、お題のすぐ脇で数字だけを大きく見せる。
import type { ComboState } from "@/state";

interface Props {
  combo: ComboState;
}

// 満タン扱いの目安（表示だけ。戦闘の閾値ではない）。
const GAUGE_FULL = 10;

export function ComboGauge({ combo }: Props) {
  const hot = combo.value >= GAUGE_FULL;

  return (
    <div
      className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 shadow-sm ${
        hot
          ? "animate-danger-pulse border-amber-500 bg-amber-100"
          : "border-red-500 bg-white"
      }`}
      title={`攻撃力（コンボ）${combo.value}${combo.lastReason ? ` / ${combo.lastReason}` : ""}`}
    >
      <span className="text-[9px] font-bold leading-none tracking-wide text-zinc-500">
        攻撃力
      </span>
      <span
        key={combo.value}
        className={`animate-value-bump text-3xl font-black leading-none tabular-nums ${
          hot ? "text-amber-600" : "text-red-600"
        }`}
      >
        {combo.value}
      </span>
      <span
        className={`text-[9px] font-bold leading-none ${
          hot ? "text-amber-600" : "text-zinc-400"
        }`}
      >
        {hot ? "MAX" : "⏎ 攻撃"}
      </span>
    </div>
  );
}
