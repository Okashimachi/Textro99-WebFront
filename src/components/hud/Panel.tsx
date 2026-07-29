// Panel — HUD 共通の枠（白面＋ヘッダ帯）。表示のみ。
//
// 「戦況コンソール」デザインの最小単位。左に色チップ、その右にラベル、
// 右端に補助情報（件数・凡例など）を置く。中身のロジックは一切持たない。
import type { ReactNode } from "react";

// パネルの役割色。OUT/IN=赤（攻防）、お題=青、順位=琥珀、盤面=緑、ログ=無彩。
export type PanelTone = "neutral" | "accent" | "ink" | "info" | "badge" | "alive";

interface Props {
  /** ヘッダのラベル（例「お題」「OUT — 自分の攻撃」）。 */
  label: ReactNode;
  /** ヘッダ右端の補助表示。 */
  right?: ReactNode;
  /** 色チップのトーン。 */
  tone?: PanelTone;
  /** 本文の追加クラス（余白調整用）。 */
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}

const CHIP: Record<PanelTone, { bar: string; head: string; label: string }> = {
  neutral: { bar: "bg-zinc-400", head: "bg-zinc-100", label: "text-zinc-700" },
  accent: { bar: "bg-red-600", head: "bg-red-50", label: "text-red-800" },
  ink: { bar: "bg-zinc-900", head: "bg-zinc-100", label: "text-zinc-900" },
  info: { bar: "bg-sky-500", head: "bg-sky-50", label: "text-sky-800" },
  badge: { bar: "bg-amber-400", head: "bg-amber-50", label: "text-amber-800" },
  alive: { bar: "bg-emerald-500", head: "bg-emerald-50", label: "text-emerald-800" },
};

export function Panel({
  label,
  right,
  tone = "neutral",
  bodyClassName = "p-3",
  className = "",
  children,
}: Props) {
  return (
    <section className={`flex flex-col border border-zinc-300 bg-white ${className}`}>
      <header
        className={`flex items-center gap-2 border-b border-zinc-300 px-2 py-1 ${CHIP[tone].head}`}
      >
        <span className={`h-3 w-1.5 shrink-0 ${CHIP[tone].bar}`} aria-hidden />
        <h2
          className={`min-w-0 flex-1 truncate text-[11px] font-bold tracking-wide ${CHIP[tone].label}`}
        >
          {label}
        </h2>
        {right != null && (
          <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">{right}</span>
        )}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
