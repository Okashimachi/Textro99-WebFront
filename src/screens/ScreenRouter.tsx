// 画面フェーズに応じてコンテナを切り替えるルーター。
// 各画面の中身は後続 Issue（#10 待機 / #11 HUD / #12 グリッド / #13 リザルト）で差し替える。
// ここではライフサイクル（#9）の遷移とプレースホルダのみを担う。
import type { GameViewModel } from "@/state";
import type { ScreenPhase } from "./lifecycle";
import type { ScreenActions } from "./useScreenPhase";
import { InMatchScreen } from "./InMatchScreen";
import { MatchmakingScreen } from "./MatchmakingScreen";

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
  /** 打鍵途中経過（#8 予定・表示専用）。 */
  typedPrefix?: string;
}

export function ScreenRouter({
  phase,
  state,
  actions,
  net,
  selectedStrategyId = null,
  typedPrefix,
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
        />
      );

    case "spectating":
      return (
        <InMatchScreen
          state={state}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={typedPrefix}
          spectating
        />
      );

    case "result":
      return (
        <Placeholder title="リザルト">
          <p className="text-slate-300">
            {state.gameOver
              ? state.gameOver.rank === 1
                ? "優勝！"
                : `脱落（${state.gameOver.rank}位）`
              : "—"}
          </p>
          <p className="text-xs text-slate-500">（画面本体は #13 で実装）</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                actions.rematch();
                net.join();
              }}
              className="rounded bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-500"
            >
              再マッチング
            </button>
            <button
              onClick={actions.backToTitle}
              className="rounded bg-slate-600 px-4 py-2 hover:bg-slate-500"
            >
              タイトルへ
            </button>
          </div>
        </Placeholder>
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
