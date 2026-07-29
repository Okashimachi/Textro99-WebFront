// MatchStatusBar — 画面最上段の常設ステータス（残り人数／順位／撃破／難易度）。
// すべてサーバー由来の値をそのまま並べるだけ（算出・推定をしない）。
import type { GameViewModel } from "@/state";
import { deriveRanking } from "@/state/ranking";

interface Props {
  state: GameViewModel;
  /** 自分の表示名（プロフィール名）。 */
  selfDisplayName?: string;
}

export function MatchStatusBar({ state, selfDisplayName }: Props) {
  const ranked = deriveRanking(state.players, state.selfPlayerId);
  const selfRow = ranked.find((r) => r.isSelf);
  const selfBadges = selfRow?.player.badgeCount ?? 0;

  return (
    <div className="flex flex-wrap items-stretch gap-px border border-line bg-line">
      <Stat label="残り" value={state.aliveCount} unit="/ 99人" />
      <Stat
        label="あなたの順位"
        value={selfRow ? selfRow.rank : "—"}
        unit={selfRow ? `位 / ${ranked.length}` : ""}
        tone="accent"
      />
      <Stat label="撃破" value={selfBadges} unit="バッジ" />
      <Stat label="難易度" value={`Lv${state.difficulty.effectiveLevel}`} />

      <div className="flex flex-1 items-center justify-end gap-3 bg-panel px-3 py-1.5 text-[11px] text-sub">
        {selfDisplayName && <span className="truncate text-ink">{selfDisplayName}</span>}
        <span className="tabular-nums">MATCH {state.matchId ?? "—"}</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="min-w-[104px] bg-panel px-3 py-1">
      <div className="text-[10px] tracking-wide text-sub">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-2xl font-black leading-tight tabular-nums ${
            tone === "accent" ? "text-accent" : "text-ink"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-[11px] text-sub">{unit}</span>}
      </div>
    </div>
  );
}
