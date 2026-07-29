// 試合中画面。HUD コンポーネント群を state から組み立てる。
// 各コンポーネントは proto DTO / ViewModel のみを入力とし、判定ロジックを持たない。
//
// レイアウト方針（視線は中央の主ディスプレイに固定し、周辺に情報を配る）:
//
//   ┌──────────── 常設ステータス（残り/順位/撃破/難易度）────────────┐
//   │ 敵の状況        │        作戦（0-9）        │                 │
//   │ （99人グリッド）│  ┌───────────────────┐   │   NEXT          │
//   │                 │  │  主ディスプレイ    │   │  （下から積む） │
//   │ 被弾予告(IN)    │  │  いま打つお題      │   │                 │
//   │                 │  └───────────────────┘   │                 │
//   │ 戦況ログ        │      攻撃力（OUT）        │   ランキング    │
//   └────────────────────────────────────────────────────────────────┘
import type { GameViewModel } from "@/state";
import { ComboGauge } from "@/components/hud/ComboGauge";
import { AttackWarningBar } from "@/components/hud/AttackWarningBar";
import { StrategySelector } from "@/components/hud/StrategySelector";
import { EventLog } from "@/components/hud/EventLog";
import { LiveRanking } from "@/components/hud/LiveRanking";
import { MatchStatusBar } from "@/components/hud/MatchStatusBar";
import { NextQueue } from "@/components/hud/NextQueue";
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
    <div className="mx-auto max-w-[1280px] space-y-2 py-2">
      <MatchStatusBar state={state} selfDisplayName={selfDisplayName} />

      {spectating && (
        <div className="border border-red-500 bg-red-50 px-3 py-1.5 text-center text-xs font-bold text-red-800">
          観戦モード（あなたは脱落済み・操作は無効）
        </div>
      )}

      <div
        className={`grid gap-2 lg:grid-cols-[minmax(230px,0.85fr)_minmax(420px,1.5fr)_minmax(250px,0.9fr)] ${
          spectating ? "opacity-60" : ""
        }`}
      >
        {/* 左：敵の状況（99人）＋被弾予告＋戦況ログ */}
        <div className="order-2 space-y-2 lg:order-1">
          <PlayerGrid99 players={state.players} selfPlayerId={state.selfPlayerId} />
          <AttackWarningBar incomingAttacks={state.incomingAttacks} />
          <EventLog events={state.events} limit={5} />
        </div>

        {/* 中央：作戦 → 主ディスプレイ → 攻撃力 */}
        <div className="order-1 space-y-2 lg:order-2">
          <StrategySelector selectedStrategyId={selectedStrategyId} />
          <PlayField
            activeDaken={state.activeDaken}
            dakenStack={state.dakenStack}
            difficulty={state.difficulty}
            typedPrefix={typedPrefix}
            missCount={missCount}
          />
          <ComboGauge combo={state.combo} />
        </div>

        {/* 右：NEXT（下から積み上がる）＋ランキング */}
        <div className="order-3 flex flex-col gap-2">
          <div className="min-h-[240px] flex-1">
            <NextQueue activeDaken={state.activeDaken} />
          </div>
          <LiveRanking
            players={state.players}
            selfPlayerId={state.selfPlayerId}
            selfDisplayName={selfDisplayName}
          />
        </div>
      </div>
    </div>
  );
}
