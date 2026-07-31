// MatchStatusBar — 画面最上段。試合中に最も重要な2つ（残り人数・撃破数）だけを大きく出す。
// 値はサーバー由来（PlayerListUpdated / Delta）をそのまま表示する（算出・推定をしない）。
//
// 表示方針: 情報を2つに絞り、色（緑=生存 / 琥珀=撃破）と大きな数字で遠目にも読めるようにする。
import type { GameViewModel } from "@/state";

interface Props {
  state: GameViewModel;
}

export function MatchStatusBar({ state }: Props) {
  const self = state.players.find((p) => p.playerId === state.selfPlayerId);
  const badges = self?.badgeCount ?? 0;

  return (
    <div className="flex flex-wrap gap-2">
      <BigStat
        label="残り"
        value={state.aliveCount}
        unit="人"
        ring="border-emerald-500"
        bg="bg-emerald-50"
        text="text-emerald-600"
        labelBg="bg-emerald-500"
      />
      <BigStat
        label="撃破"
        value={badges}
        unit="バッジ"
        ring="border-amber-500"
        bg="bg-amber-50"
        text="text-amber-600"
        labelBg="bg-amber-500"
      />
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
  ring,
  bg,
  text,
  labelBg,
}: {
  label: string;
  value: number;
  unit: string;
  ring: string;
  bg: string;
  text: string;
  labelBg: string;
}) {
  return (
    <div className={`flex min-w-[220px] items-center gap-3 border-2 px-5 py-2 ${ring} ${bg}`}>
      <span
        className={`shrink-0 px-2 py-0.5 text-sm font-black tracking-widest text-white ${labelBg}`}
      >
        {label}
      </span>
      <span
        key={value}
        className={`animate-value-bump text-5xl font-black leading-none tabular-nums ${text}`}
      >
        {value}
      </span>
      <span className="text-sm font-bold text-zinc-500">{unit}</span>
    </div>
  );
}
