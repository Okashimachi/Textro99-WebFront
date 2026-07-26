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
import { LiveRanking } from "@/components/hud/LiveRanking";
import { PlayerGrid99 } from "@/components/PlayerGrid99";

interface Props {
  state: GameViewModel;
  /** 入力送信層(#7)が保持する選択中戦略。 */
  selectedStrategyId: number | null;
  /** 打鍵途中経過（#8 TypingJudge が公開・表示専用）。 */
  typedPrefix?: string;
  /** ミス打鍵の累計（#8・表示専用）。 */
  missCount?: number;
  /** 自分の表示名（プロフィール名）。ランキングの自分の行に出す。 */
  selfDisplayName?: string;
  /** 観戦中（脱落済み）なら操作系をトーンダウンする。 */
  spectating?: boolean;
}

export function InMatchScreen({
  state,
  selectedStrategyId,
  typedPrefix,
  missCount,
  selfDisplayName,
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
        <DakenDisplay
          activeDaken={state.activeDaken}
          typedPrefix={typedPrefix}
          missCount={missCount}
        />
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
        <LiveRanking
          players={state.players}
          selfPlayerId={state.selfPlayerId}
          selfDisplayName={selfDisplayName}
        />
        <PlayerGrid99 players={state.players} selfPlayerId={state.selfPlayerId} />
        <EventLog events={state.events} />
      </div>
    </div>
  );
}
