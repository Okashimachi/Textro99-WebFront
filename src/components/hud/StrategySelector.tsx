// StrategySelector — 0-9 戦略の選択中ハイライト。送信は入力送信層(#7)が担う。
// ここは選択状態の「表示」だけ。未選択の既定は 4（proto 注記）だがローカルで既定を送らない。
import { Panel } from "./Panel";

interface Props {
  selectedStrategyId: number | null;
}

const STRATEGY_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function StrategySelector({ selectedStrategyId }: Props) {
  return (
    <Panel
      label="作戦"
      tone="info"
      right={
        selectedStrategyId != null ? `選択中 ${selectedStrategyId}` : "0-9 キーで選択"
      }
      bodyClassName="p-2"
    >
      <div className="grid grid-cols-10 gap-px">
        {STRATEGY_IDS.map((id) => {
          const active = id === selectedStrategyId;
          return (
            <span
              key={id}
              className={`flex h-8 items-center justify-center border text-sm font-black tabular-nums ${
                active
                  ? "border-sky-700 bg-sky-600 text-white"
                  : "border-zinc-300 bg-white text-zinc-500"
              }`}
            >
              {id}
            </span>
          );
        })}
      </div>
    </Panel>
  );
}
