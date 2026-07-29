// Panel — HUD 共通の枠（白面＋ヘッダ帯）。表示のみ。
//
// 「戦況コンソール」デザインの最小単位。左に色チップ、その右にラベル、
// 右端に補助情報（件数・凡例など）を置く。中身のロジックは一切持たない。
import type { ReactNode } from "react";

export type PanelTone = "neutral" | "accent" | "ink";

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

const CHIP: Record<PanelTone, string> = {
  neutral: "bg-sub",
  accent: "bg-accent",
  ink: "bg-ink",
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
    <section className={`flex flex-col border border-line bg-panel ${className}`}>
      <header className="flex items-center gap-2 border-b border-line bg-head px-2 py-1">
        <span className={`h-3 w-1.5 shrink-0 ${CHIP[tone]}`} aria-hidden />
        <h2 className="min-w-0 flex-1 truncate text-[11px] font-bold tracking-wide text-ink">
          {label}
        </h2>
        {right != null && (
          <span className="shrink-0 text-[10px] tabular-nums text-sub">{right}</span>
        )}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
