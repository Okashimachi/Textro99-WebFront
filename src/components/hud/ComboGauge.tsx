// ComboGauge — コンボ値（攻撃原資）を視覚化するリングメーター。
// 値はサーバー由来（ComboUpdated）。ローカル算出しない。
// 表示方針: リングの充填＋大きな数字＋エネルギーピップで、コンボの溜まり具合を直感的に見せる。
import type { ComboState } from "@/state";

interface Props {
  combo: ComboState;
}

// 満タン（リング一周）の目安（表示だけ。戦闘の閾値ではない）。
const GAUGE_FULL = 10;
const R = 34;
const CIRC = 2 * Math.PI * R;

export function ComboGauge({ combo }: Props) {
  const ratio = Math.min(1, combo.value / GAUGE_FULL);
  const hot = combo.value >= GAUGE_FULL;
  const gained = combo.lastDelta > 0;
  const stroke = hot ? "#fbbf24" : "#38bdf8";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-colors ${
        hot
          ? "border-amber-400/70 bg-gradient-to-br from-amber-500/15 to-slate-950"
          : "border-sky-500/40 bg-gradient-to-br from-sky-500/10 to-slate-950"
      }`}
    >
      {/* リングメーター */}
      <div className="relative h-[84px] w-[84px] shrink-0">
        <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
          <circle cx="42" cy="42" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - ratio)}
            className={`transition-[stroke-dashoffset] duration-300 ${hot ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" : ""}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            key={combo.value}
            className={`animate-value-bump text-3xl font-black leading-none tabular-nums ${
              hot ? "text-amber-300" : "text-sky-300"
            }`}
          >
            {combo.value}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            combo
          </span>
        </div>
      </div>

      {/* 右側：エネルギーピップ＋直近増減 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            攻撃チャージ
          </span>
          {combo.lastReason && (
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                gained ? "bg-sky-500/20 text-sky-200" : "bg-slate-700/60 text-slate-300"
              }`}
            >
              {combo.lastDelta >= 0 ? `+${combo.lastDelta}` : combo.lastDelta}
            </span>
          )}
        </div>
        {/* エネルギーピップ（GAUGE_FULL 分の充填を段階表示） */}
        <div className="mt-2 flex gap-1">
          {Array.from({ length: GAUGE_FULL }).map((_, i) => {
            const filled = i < Math.min(combo.value, GAUGE_FULL);
            return (
              <span
                key={i}
                className={`h-4 flex-1 rounded-sm transition-colors ${
                  filled
                    ? hot
                      ? "bg-gradient-to-t from-amber-500 to-yellow-300"
                      : "bg-gradient-to-t from-sky-500 to-cyan-300"
                    : "bg-slate-800"
                }`}
              />
            );
          })}
        </div>
        <div className="mt-1.5 text-[10px] text-slate-500">
          {hot ? "⚡ MAX チャージ！ Enter で攻撃" : "コンボを繋いで攻撃力アップ"}
        </div>
      </div>
    </div>
  );
}
