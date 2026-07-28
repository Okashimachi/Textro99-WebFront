// 試合中画面。HUD コンポーネント群を state から組み立てる。
// 各コンポーネントは proto DTO / ViewModel のみを入力とし、判定ロジックを持たない。
//
// レイアウト方針（ゲーム HUD）:
//   ・中央列＝お題キューと被弾スタックを統合した縦レーン盤面。画面の縦横ど真ん中に置く。
//   ・盤面の上：残り人数＋被弾予告（コンパクト・盤面の上に浮かせて多数表示・盤面は動かさない）。
//   ・盤面の下：コンボ（視覚メーター）＋作戦。
//   ・左：99人グリッド、右：ランキング＋戦況ログ。
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
    <div className="grid items-center gap-4 py-4 lg:min-h-[80vh] lg:grid-cols-[minmax(240px,1fr)_minmax(360px,1.7fr)_minmax(240px,1fr)]">
      {/* 中央：統合レーン盤面（縦横ど真ん中）＋上下の情報 */}
      <div
        className={`order-first flex flex-col items-center gap-3 lg:order-2 ${
          spectating ? "opacity-60" : ""
        }`}
      >
        {spectating && (
          <div className="w-full max-w-md rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-center text-sm text-amber-300">
            観戦モード（あなたは脱落済み・操作は無効）
          </div>
        )}

        {/* 盤面の上：残り人数 */}
        <div className="flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-950 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            残り
          </span>
          <span className="text-3xl font-black leading-none text-emerald-300 tabular-nums">
            {state.aliveCount}
          </span>
          <span className="text-sm font-bold text-slate-500">/ 99人</span>
        </div>

        {/* 盤面＋被弾予告オーバーレイ（盤面の直上に浮かせる＝盤面は動かない） */}
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-x-0 bottom-full z-40 mb-2 max-h-44 overflow-hidden">
            <AttackWarningBar incomingAttacks={state.incomingAttacks} />
          </div>
          <PlayField
            activeDaken={state.activeDaken}
            dakenStack={state.dakenStack}
            typedPrefix={typedPrefix}
            missCount={missCount}
          />
        </div>

        {/* 盤面の下：コンボ（視覚メーター）＋作戦 */}
        <div className="w-full max-w-md space-y-3">
          <ComboGauge combo={state.combo} />
          <StrategySelector selectedStrategyId={selectedStrategyId} />
        </div>
      </div>

      {/* 左：99人グリッド */}
      <div className="space-y-3 lg:order-1">
        <PlayerGrid99 players={state.players} selfPlayerId={state.selfPlayerId} />
      </div>

      {/* 右：ランキング＋戦況ログ */}
      <div className="space-y-3 lg:order-3">
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
