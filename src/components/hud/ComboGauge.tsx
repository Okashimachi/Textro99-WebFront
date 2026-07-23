// ComboGauge — コンボ値の表示。値はサーバー由来（ComboUpdated）。ローカル算出しない。
import type { ComboState } from "@/state";

interface Props {
  combo: ComboState;
}

export function ComboGauge({ combo }: Props) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <div className="text-xs text-slate-400">コンボ</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-sky-300">{combo.value}</span>
        {combo.lastReason && (
          <span className="text-xs text-slate-400">
            {combo.lastDelta >= 0 ? `+${combo.lastDelta}` : combo.lastDelta} (
            {combo.lastReason})
          </span>
        )}
      </div>
    </div>
  );
}
