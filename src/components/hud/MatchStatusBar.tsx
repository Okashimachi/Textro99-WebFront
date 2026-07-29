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
    <div className="flex flex-wrap items-stretch gap-px border border-zinc-300 bg-zinc-300">
      <Stat label="残り" value={state.aliveCount} unit="/ 99人" tone="alive" />
      <Stat
        label="あなたの順位"
        value={selfRow ? selfRow.rank : "—"}
        unit={selfRow ? `位 / ${ranked.length}` : ""}
        tone="rank"
      />
      <Stat label="撃破" value={selfBadges} unit="バッジ" tone="badge" />
      <Stat
        label="難易度"
        value={`Lv${state.difficulty.effectiveLevel}`}
        tone="level"
      />

      <div className="flex flex-1 items-center justify-end gap-3 bg-white px-3 py-1.5 text-[11px] text-zinc-500">
        {selfDisplayName && <span className="truncate text-zinc-900">{selfDisplayName}</span>}
        <span className="tabular-nums">MATCH {state.matchId ?? "—"}</span>
      </div>
    </div>
  );
}

// 指標ごとの色（意味付け: 生存=緑 / 順位=赤 / 撃破=琥珀 / 難易度=青）。
const TONE: Record<string, { bar: string; value: string }> = {
  alive: { bar: "bg-emerald-500", value: "text-emerald-600" },
  rank: { bar: "bg-red-600", value: "text-red-600" },
  badge: { bar: "bg-amber-400", value: "text-amber-600" },
  level: { bar: "bg-sky-500", value: "text-sky-600" },
};

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className="flex min-w-[104px] items-stretch gap-2 bg-white pr-3">
      <span className={`w-1 shrink-0 ${t.bar}`} aria-hidden />
      <div className="py-1">
        <div className="text-[10px] tracking-wide text-zinc-500">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black leading-tight tabular-nums ${t.value}`}>
            {value}
          </span>
          {unit && <span className="text-[11px] text-zinc-500">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
