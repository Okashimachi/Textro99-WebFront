// 試合中画面。HUD コンポーネント群を state から組み立てる。
// 各コンポーネントは proto DTO / ViewModel のみを入力とし、判定ロジックを持たない。
//
// レイアウト方針（視線は中央の主ディスプレイに固定し、周辺に情報を配る）:
//
//   ┌──── ヘッダ: 残り人数 / 撃破数（この2つだけを大きく）────┐
//   │ 順位 │ 敵の状況│      作戦（0-9）        │             │
//   │      │（99マス・│  通知（戦況ログ）        │  NEXT       │
//   │      │ 欠席は ✕）│ ┌────────────────────┐ │（上が「次」・│
//   │      │         │ │ 主ディスプレイ      │ │ 下へ溜まる・ │
//   │      │         │ │ いま打つお題 (+攻撃力)│ │ 地色で危険度）│
//   └──────────────────────────────────────────────────────┘
//
// 被弾ダケン自体は NEXT に色で表れる。それとは別に、着弾までの猶予（graceMs）がある予告は
// 中央の通知の上でカウントダウン表示する（IncomingAttacks・予告が無いときは何も出さない）。
// お題のストック（被弾スタック）が危険域に入ると、画面全体を赤くフラッシュさせて警告する（表示のみ）。
import type { GameViewModel } from "@/state";
import { EventLog } from "@/components/hud/EventLog";
import { IncomingAttacks } from "@/components/hud/IncomingAttacks";
import { LiveRanking } from "@/components/hud/LiveRanking";
import { MatchStatusBar } from "@/components/hud/MatchStatusBar";
import { NextQueue } from "@/components/hud/NextQueue";
import { PlayField } from "@/components/hud/PlayField";
import { PlayerGrid99 } from "@/components/PlayerGrid99";
import { useDakenTimer } from "@/components/hud/useDakenTimer";
import { stackLevel } from "@/components/hud/stackLevel";

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
  /** 観戦中（脱落済み・GameOver 受信前）なら操作系をトーンダウンする。 */
  spectating?: boolean;
  /** ヘッダー右側に置く開発ツール（練習モードのみ・dev 専用）。 */
  devTools?: React.ReactNode;
}

export function InMatchScreen({
  state,
  typedPrefix,
  missCount,
  selfDisplayName,
  spectating = false,
  devTools,
}: Props) {
  // 残り時間（主ディスプレイの帯）。時間切れの確定はサーバー権威。
  const timer = useDakenTimer(state.activeDaken[0]);
  // ストックが満杯に近い＝ゲームオーバーが近い。画面全体で警告する。
  const stackDanger = stackLevel(state.dakenStack) === "danger";

  return (
    // 1画面ぶんの高さを使い切る（ヘッダ約 2.5rem ぶんを差し引く）。
    <div className="mx-auto flex min-h-[calc(100vh-2.75rem)] max-w-[1280px] flex-col gap-2 py-2">
      {/* ストックが危険域: 画面全体をフラッシュさせる（クリックは透過・表示のみ） */}
      {stackDanger && !spectating && (
        <div
          aria-hidden
          className="animate-screen-alert pointer-events-none fixed inset-0 z-50"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <MatchStatusBar state={state} />
        {devTools}
      </div>

      {spectating && (
        <div className="border border-red-500 bg-red-50 px-3 py-1.5 text-center text-xs font-bold text-red-800">
          観戦モード（あなたは脱落済み・操作は無効）
        </div>
      )}

      <div
        className={`grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(240px,0.9fr)_minmax(420px,1.5fr)_minmax(200px,0.7fr)] ${
          spectating ? "opacity-60" : ""
        }`}
      >
        {/* 左：ランキング（細め）＋敵の状況（太め）。どちらも縦長に揃える。 */}
        <div className="order-2 grid min-h-0 grid-cols-[0.6fr_1.4fr] gap-2 lg:order-1">
          <LiveRanking
            players={state.players}
            selfPlayerId={state.selfPlayerId}
            selfDisplayName={selfDisplayName}
            className="h-full"
          />
          <PlayerGrid99
            players={state.players}
            selfPlayerId={state.selfPlayerId}
            className="h-full"
          />
        </div>

        {/* 中央：作戦 → 通知 → 主ディスプレイ（攻撃力を内包） */}
        <div className="order-1 flex min-h-0 flex-col gap-2 lg:order-2">
          <IncomingAttacks
            incomingAttacks={state.incomingAttacks}
            players={state.players}
          />
          <EventLog events={state.events} />
          <PlayField
            activeDaken={state.activeDaken}
            combo={state.combo}
            difficulty={state.difficulty}
            typedPrefix={typedPrefix}
            missCount={missCount}
            timer={timer}
            className="min-h-0 flex-1"
          />
        </div>

        {/* 右：NEXT（積み上げ＋溜まり具合レール） */}
        <div className="order-3 min-h-0">
          <NextQueue activeDaken={state.activeDaken} dakenStack={state.dakenStack} />
        </div>
      </div>
    </div>
  );
}
