// StrategySelector — 0-9 戦略の選択中ハイライト。送信は入力送信層(#7)が担う。
// ここは選択状態の「表示」だけ。未選択の既定は 4（proto 注記）だがローカルで既定を送らない。
interface Props {
  selectedStrategyId: number | null;
}

const STRATEGY_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function StrategySelector({ selectedStrategyId }: Props) {
  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          作戦
        </span>
        <span className="text-[10px] text-slate-500">
          {selectedStrategyId != null ? (
            <>
              選択中 <span className="font-bold text-sky-300">{selectedStrategyId}</span>
            </>
          ) : (
            "0-9 キーで選択"
          )}
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {STRATEGY_IDS.map((id) => {
          const active = id === selectedStrategyId;
          return (
            <span
              key={id}
              className={`flex aspect-square items-center justify-center rounded-lg text-base font-black transition-all ${
                active
                  ? "scale-105 bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-300"
                  : "bg-slate-900 text-slate-500 hover:bg-slate-800"
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
