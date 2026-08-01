// 画面フェーズに応じてコンテナを切り替えるルーター。
// 各画面の中身は後続 Issue（#10 待機 / #11 HUD / #12 グリッド / #13 リザルト）で差し替える。
// ここではライフサイクル（#9）の遷移とプレースホルダのみを担う。
import type { GameViewModel } from "@/state";
import type { ScreenPhase } from "./lifecycle";
import type { ScreenActions } from "./useScreenPhase";
import type { GameOver } from "@/proto/types";
import { InMatchScreen } from "./InMatchScreen";
import { MatchmakingScreen } from "./MatchmakingScreen";
import { MatchResultScreen } from "./MatchResultScreen";

/** 画面から発火するマッチング関連の送信。実体は App が connection.send で配線する。 */
export interface MatchmakingNet {
  join: () => void;
  leave: () => void;
}

interface Props {
  phase: ScreenPhase;
  state: GameViewModel;
  actions: ScreenActions;
  net: MatchmakingNet;
  /** 入力送信層(#7)の選択中戦略。 */
  selectedStrategyId?: number | null;
  /** 打鍵途中経過（#8・表示専用）。 */
  typedPrefix?: string;
  /** ミス打鍵の累計（#8・表示専用）。 */
  missCount?: number;
  /** 自分の表示名（プロフィール名）。 */
  selfDisplayName?: string;
  /** 開発ツール（ログ/デバッグ）の表示状態。マッチング中に切替できる。 */
  showDevTools?: boolean;
  /** 開発ツールの表示切替。 */
  onToggleDevTools?: (show: boolean) => void;
  /** 試合中ヘッダー右側の開発ツール（練習モードのみ）。 */
  inMatchDevTools?: React.ReactNode;
  /** 自分の試合結果。非 null の間、観戦画面の上にリザルトモーダルを重ねる。 */
  matchResult?: GameOver | null;
  /** 試合が完全に終わったか（サーバーが接続を切ったこと）。タイトルへ戻るのはプレイヤー操作のみ。 */
  matchEnded?: boolean;
}

export function ScreenRouter({
  phase,
  state,
  actions,
  net,
  selectedStrategyId = null,
  typedPrefix,
  missCount,
  selfDisplayName,
  showDevTools,
  onToggleDevTools,
  inMatchDevTools,
  matchResult = null,
  matchEnded = false,
}: Props) {
  switch (phase) {
    case "title":
      // 実タイトルは setup フロー（App）が持つ。ここに来るのは接続〜MatchStart 待ちの間。
      return (
        <Placeholder title="接続中…">
          <p className="text-sm text-zinc-500">サーバーに接続しています（起動に数秒かかることがあります）</p>
          <button
            onClick={actions.backToTitle}
            className="border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-100"
          >
            キャンセル
          </button>
        </Placeholder>
      );

    case "matchmaking":
      return (
        <MatchmakingScreen
          status={state.matchmaking}
          statusReceivedAtMs={state.matchmakingReceivedAtMs}
          // 待機中の進行（参加/離脱・カウントダウン開始/中止）の履歴。
          // テスト用のログなので開発ツール表示中だけ出す（実運用フローでは出さない）。
          events={
            showDevTools
              ? state.events.filter(
                  (e) => e.kind === "Matchmaking" || e.kind === "Welcome",
                )
              : undefined
          }
          selfDisplayName={selfDisplayName}
          onLeave={() => {
            net.leave();
            actions.leaveMatchmaking();
          }}
          showDevTools={showDevTools}
          onToggleDevTools={onToggleDevTools}
        />
      );

    case "inMatch":
      return (
        <InMatchScreen
          state={state}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={typedPrefix}
          missCount={missCount}
          selfDisplayName={selfDisplayName}
          devTools={inMatchDevTools}
        />
      );

    case "spectating":
      // 自分の結果が出ていれば決着レイアウト（ランキング・敵の状況＋リザルト）。
      // まだ結果が来ていない脱落直後は、試合中レイアウトのまま観戦する。
      if (matchResult) {
        return (
          <MatchResultScreen
            state={state}
            result={matchResult}
            selfDisplayName={selfDisplayName}
            matchEnded={matchEnded}
            onRematch={() => {
              actions.rematch();
              net.join();
            }}
            onBackToTitle={actions.backToTitle}
          />
        );
      }
      return (
        <InMatchScreen
          state={state}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={typedPrefix}
          missCount={missCount}
          selfDisplayName={selfDisplayName}
          spectating
        />
      );
  }
}

function Placeholder({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
