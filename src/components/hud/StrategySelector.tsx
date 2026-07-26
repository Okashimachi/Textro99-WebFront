// StrategySelector — 0-9 戦略の選択中ハイライト。送信は入力送信層(#7)が担う。
// ここは選択状態の「表示」だけ。未選択の既定は 4（proto 注記）だがローカルで既定を送らない。
interface Props {
  selectedStrategyId: number | null;
}

const STRATEGY_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function StrategySelector({ selectedStrategyId }: Props) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
      <div className="mb-2 text-xs text-slate-400">戦略選択（0-9 キーで送信）</div>
      <div className="flex flex-wrap gap-1">
        {STRATEGY_IDS.map((id) => {
          const active = id === selectedStrategyId;
          return (
            <span
              key={id}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold ${
                active
                  ? "bg-sky-500 text-white"
                  : "bg-slate-900 text-slate-400"
              }`}
            >
              {id}
            </span>
          );
        })}
      </div>
    </div>
  );
}
