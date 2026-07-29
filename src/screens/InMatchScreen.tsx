// 試合中画面。HUD コンポーネント群を state から組み立てる。
// 各コンポーネントは proto DTO / ViewModel のみを入力とし、判定ロジックを持たない。
//
// レイアウト方針（戦況コンソール／白地・赤アクセントの情報密度重視）:
//   ・最上段：常設ステータスバー（残り／順位／撃破／難易度）。
//   ・左列：OUT（自分の攻撃＝コンボ）＋作戦。
//   ・中央列：お題盤面（被弾スタック・現在のお題・NEXT）。画面中央に最大サイズで置く。
//   ・右列：IN（被弾予告）＋ランキング。
//   ・下段：戦況ログ（左）と 99人グリッド（右）。
import type { GameViewModel } from "@/state";
import { ComboGauge } from "@/components/hud/ComboGauge";
import { AttackWarningBar } from "@/components/hud/AttackWarningBar";
import { StrategySelector } from "@/components/hud/StrategySelector";
import { EventLog } from "@/components/hud/EventLog";
import { LiveRanking } from "@/components/hud/LiveRanking";
import { MatchStatusBar } from "@/components/hud/MatchStatusBar";
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
    <div className="mx-auto max-w-[1180px] space-y-2 py-2 font-hud">
      <MatchStatusBar state={state} selfDisplayName={selfDisplayName} />

      {spectating && (
        <div className="border border-accent bg-accent-soft px-3 py-1.5 text-center text-xs font-bold text-accent-dark">
          観戦モード（あなたは脱落済み・操作は無効）
        </div>
      )}

      <div
        className={`grid gap-2 lg:grid-cols-[minmax(220px,1fr)_minmax(360px,1.6fr)_minmax(220px,1fr)] ${
          spectating ? "opacity-60" : ""
        }`}
      >
        {/* 左：OUT（自分の攻撃）＋作戦 */}
        <div className="order-2 space-y-2 lg:order-1">
          <ComboGauge combo={state.combo} />
          <StrategySelector selectedStrategyId={selectedStrategyId} />
        </div>

        {/* 中央：お題盤面 */}
        <div className="order-1 lg:order-2">
          <PlayField
            activeDaken={state.activeDaken}
            dakenStack={state.dakenStack}
            difficulty={state.difficulty}
            typedPrefix={typedPrefix}
            missCount={missCount}
          />
        </div>

        {/* 右：IN（被弾予告）＋ランキング */}
        <div className="order-3 space-y-2">
          <AttackWarningBar incomingAttacks={state.incomingAttacks} />
          <LiveRanking
            players={state.players}
            selfPlayerId={state.selfPlayerId}
            selfDisplayName={selfDisplayName}
          />
        </div>
      </div>

      {/* 下段：戦況ログ＋99人グリッド */}
      <div className="grid items-start gap-2 lg:grid-cols-[1.4fr_1fr]">
        <EventLog events={state.events} />
        <PlayerGrid99 players={state.players} selfPlayerId={state.selfPlayerId} />
      </div>
    </div>
  );
}
