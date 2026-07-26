// 画面フェーズに応じてコンテナを切り替えるルーター。
// 各画面の中身は後続 Issue（#10 待機 / #11 HUD / #12 グリッド / #13 リザルト）で差し替える。
// ここではライフサイクル（#9）の遷移とプレースホルダのみを担う。
import type { GameViewModel } from "@/state";
import type { ScreenPhase } from "./lifecycle";
import type { ScreenActions } from "./useScreenPhase";
import { InMatchScreen } from "./InMatchScreen";
import { MatchmakingScreen } from "./MatchmakingScreen";
import { ResultScreen } from "./ResultScreen";

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
}

export function ScreenRouter({
  phase,
  state,
  actions,
  net,
  selectedStrategyId = null,
  typedPrefix,
  missCount,
}: Props) {
  switch (phase) {
    case "title":
      return (
        <Placeholder title="タイトル">
          <button
            onClick={() => {
              actions.seekMatch();
              net.join();
            }}
            className="rounded bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-500"
          >
            マッチングに参加
          </button>
        </Placeholder>
      );

    case "matchmaking":
      return (
        <MatchmakingScreen
          status={state.matchmaking}
          statusReceivedAtMs={state.matchmakingReceivedAtMs}
          onLeave={() => {
            net.leave();
            actions.leaveMatchmaking();
          }}
        />
      );

    case "inMatch":
      return (
        <InMatchScreen
          state={state}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={typedPrefix}
          missCount={missCount}
        />
      );

    case "spectating":
      return (
        <InMatchScreen
          state={state}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={typedPrefix}
          missCount={missCount}
          spectating
        />
      );

    case "result":
      if (!state.gameOver) return <Placeholder title="リザルト">—</Placeholder>;
      return (
        <ResultScreen
          result={state.gameOver}
          onRematch={() => {
            actions.rematch();
            net.join();
          }}
          onBackToTitle={actions.backToTitle}
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
