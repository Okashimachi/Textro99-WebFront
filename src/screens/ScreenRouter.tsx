// 画面フェーズに応じてコンテナを切り替えるルーター。
// 各画面の中身は後続 Issue（#10 待機 / #11 HUD / #12 グリッド / #13 リザルト）で差し替える。
// ここではライフサイクル（#9）の遷移とプレースホルダのみを担う。
import type { GameViewModel } from "@/state";
import type { ScreenPhase } from "./lifecycle";
import type { ScreenActions } from "./useScreenPhase";

interface Props {
  phase: ScreenPhase;
  state: GameViewModel;
  actions: ScreenActions;
}

export function ScreenRouter({ phase, state, actions }: Props) {
  switch (phase) {
    case "title":
      return (
        <Placeholder title="タイトル">
          <button
            onClick={actions.seekMatch}
            className="rounded bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-500"
          >
            マッチングに参加
          </button>
        </Placeholder>
      );

    case "matchmaking":
      return (
        <Placeholder title="マッチング待機">
          <p className="text-slate-300">
            待機人数: {state.matchmaking?.waitingCount ?? "—"} / 最少{" "}
            {state.matchmaking?.minPlayers ?? "—"}
          </p>
          <p className="text-xs text-slate-500">（画面本体は #10 で実装）</p>
        </Placeholder>
      );

    case "inMatch":
      return (
        <Placeholder title="試合中">
          <p className="text-slate-300">生存 {state.aliveCount} / 99</p>
          <p className="text-xs text-slate-500">（HUD は #11 / グリッドは #12 で実装）</p>
        </Placeholder>
      );

    case "spectating":
      return (
        <Placeholder title="観戦（脱落済み）">
          <p className="text-slate-300">
            あなたは脱落しました。試合終了まで観戦します（自操作は無効）。
          </p>
          <p className="text-slate-300">生存 {state.aliveCount} / 99</p>
        </Placeholder>
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
              onClick={actions.rematch}
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
