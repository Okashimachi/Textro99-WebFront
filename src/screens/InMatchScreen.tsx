// 試合中画面。HUD コンポーネント群（#11）を state から組み立てる。
// 各コンポーネントは proto DTO / ViewModel のみを入力とし、判定ロジックを持たない。
// PlayerGrid99（#12）は別 Issue で差し込む。
import type { GameViewModel } from "@/state";
import { DakenDisplay } from "@/components/hud/DakenDisplay";
import { ComboGauge } from "@/components/hud/ComboGauge";
import { DakenStackView } from "@/components/hud/DakenStackView";
import { AttackWarningBar } from "@/components/hud/AttackWarningBar";
import { StrategySelector } from "@/components/hud/StrategySelector";
import { EventLog } from "@/components/hud/EventLog";

interface Props {
  state: GameViewModel;
  /** 入力送信層(#7)が保持する選択中戦略。 */
  selectedStrategyId: number | null;
  /** 打鍵途中経過（#8 TypingJudge が公開予定・表示専用）。 */
  typedPrefix?: string;
  /** 観戦中（脱落済み）なら操作系をトーンダウンする。 */
  spectating?: boolean;
}

export function InMatchScreen({
  state,
  selectedStrategyId,
  typedPrefix,
  spectating = false,
}: Props) {
  return (
    <div className="grid gap-3 py-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {spectating && (
          <div className="rounded bg-slate-800 px-3 py-2 text-sm text-amber-300">
            観戦モード（あなたは脱落済み・操作は無効）
          </div>
        )}
        <AttackWarningBar incomingAttacks={state.incomingAttacks} />
        <DakenDisplay activeDaken={state.activeDaken} typedPrefix={typedPrefix} />
        <div className="grid gap-3 sm:grid-cols-2">
          <ComboGauge combo={state.combo} />
          <DakenStackView dakenStack={state.dakenStack} />
        </div>
        <StrategySelector selectedStrategyId={selectedStrategyId} />
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm">
          生存 <span className="font-bold">{state.aliveCount}</span> / 99
        </div>
        {/* PlayerGrid99 は #12 でここに差し込む */}
        <EventLog events={state.events} />
      </div>
    </div>
  );
}
