// 試合中画面。HUD コンポーネント群（#11）を state から組み立てる。
// 各コンポーネントは proto DTO / ViewModel のみを入力とし、判定ロジックを持たない。
//
// レイアウト方針（企画: 寿司打×テトリス99）:
//   ・中央のプレイ盤面(PlayField)にお題を寿司コンベアとして流し、被弾スタックを背景に積む。
//   ・右側にテトリス99 風の対戦相手グリッド＋ランキングを置き、優勢劣勢を一望できるようにする。
//   ・攻撃/防御の駆け引き（コンボ・被弾予告・作戦）は盤面の周囲に配置する。
import type { GameViewModel } from "@/state";
import { ComboGauge } from "@/components/hud/ComboGauge";
import { AttackWarningBar } from "@/components/hud/AttackWarningBar";
import { StrategySelector } from "@/components/hud/StrategySelector";
import { EventLog } from "@/components/hud/EventLog";
import { LiveRanking } from "@/components/hud/LiveRanking";
import { PlayField } from "@/components/hud/PlayField";
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
    <div className="grid gap-3 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      {/* 左：メインプレイ盤面 */}
      <div className={`space-y-3 ${spectating ? "opacity-60" : ""}`}>
        {spectating && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
            観戦モード（あなたは脱落済み・操作は無効）
          </div>
        )}

        {/* 被弾予告：盤面のすぐ上に出して即座に気づけるように */}
        <AttackWarningBar incomingAttacks={state.incomingAttacks} />

        {/* 寿司コンベア盤面（お題＋被弾スタック背景） */}
        <PlayField
          activeDaken={state.activeDaken}
          dakenStack={state.dakenStack}
          typedPrefix={typedPrefix}
          missCount={missCount}
        />

        {/* 攻撃原資（コンボ）と作戦 */}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ComboGauge combo={state.combo} />
          <StrategySelector selectedStrategyId={selectedStrategyId} />
        </div>
      </div>

      {/* 右：テトリス99 風の戦況ボード */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm">
          <span className="text-slate-400">生存</span>
          <span>
            <span className="text-2xl font-black text-emerald-300">
              {state.aliveCount}
            </span>
            <span className="text-slate-500"> / 99</span>
          </span>
        </div>
        <PlayerGrid99 players={state.players} selfPlayerId={state.selfPlayerId} />
        <LiveRanking
          players={state.players}
          selfPlayerId={state.selfPlayerId}
          selfDisplayName={selfDisplayName}
        />
        <EventLog events={state.events} />
      </div>
    </div>
  );
}
