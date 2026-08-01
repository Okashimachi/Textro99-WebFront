// 決着画面（自分の試合が終わったあとの試合画面）。
//
// 試合中レイアウトの「お題・NEXT・作戦」を落とし、中央〜右をリザルトに置き換える。
// ランキングと敵の状況は試合中と同じ受信 state で描画し続け、決着後は主役として大きく出す
// （試合が続いている限り、サーバーのブロードキャストでそのまま動き続ける）。
//
//   ┌ ヘッダ: 決着バナー（自分の結末）＋ 残り人数 ─────────────────┐
//   │  ランキング(large) │ 敵の状況(large) │   リザルト（戦績）    │
//   └───────────────────────────────────────────────────────┘
//
// 表示専用。判定・集計はしない（docs/rules/01 §1,§3）。
import type { GameOver } from "@/proto/types";
import type { GameViewModel } from "@/state";
import { LiveRanking } from "@/components/hud/LiveRanking";
import { PlayerGrid99 } from "@/components/PlayerGrid99";
import { ResultBoard } from "./ResultBoard";
import { ResultActions } from "./ResultActions";

interface Props {
  state: GameViewModel;
  result: GameOver;
  /** 自分の表示名（プロフィール名）。ランキングの自分の行に出す。 */
  selfDisplayName?: string;
  /** セッション終了時刻(ms epoch)。試合が完全に終わったときだけ非 null。 */
  sessionEndDeadlineMs: number | null;
  onRematch: () => void;
  onBackToTitle: () => void;
  onSessionEnd: () => void;
}

export function MatchResultScreen({
  state,
  result,
  selfDisplayName,
  sessionEndDeadlineMs,
  onRematch,
  onBackToTitle,
  onSessionEnd,
}: Props) {
  const isWin = result.rank === 1;
  // 試合がまだ続いているか（サーバーの生存数をそのまま見るだけ）。
  const matchOngoing = sessionEndDeadlineMs == null;

  // 自分にトドメを刺した相手の表示名を players から引くだけ。
  // 未受信＝undefined（出さない）／自滅＝null。優勝時は倒されていないので出さない。
  const defeatedBy = isWin ? null : state.defeatedBy;
  const defeatedByName =
    defeatedBy == null
      ? undefined
      : defeatedBy.attackerId === null
        ? null
        : (state.players.find((p) => p.playerId === defeatedBy.attackerId)
            ?.displayName ?? defeatedBy.attackerId);
  const defeatedBadges = defeatedBy?.badgesTransferred ?? 0;

  return (
    // 高さは1画面ぶんに固定する（min-h だと 20 行のランキングで画面外まで伸びてしまう）。
    <div className="mx-auto flex h-[calc(100vh-2.75rem)] min-h-[560px] max-w-[1600px] flex-col gap-2 py-2">
      {/* 決着バナー：自分の結末を1行で。試合が続いている間は観戦中であることも出す。 */}
      <div
        className={`animate-plate-pop flex flex-wrap items-center gap-x-4 gap-y-1 border-2 px-4 py-2 ${
          isWin
            ? "border-red-600 bg-red-50 text-red-700"
            : "border-zinc-900 bg-zinc-900 text-white"
        }`}
      >
        <span className="text-2xl font-black">
          {isWin ? "優勝！" : `${result.rank} 位で脱落`}
        </span>
        <span
          className={`text-xs font-bold ${isWin ? "text-red-700/80" : "text-zinc-300"}`}
        >
          {matchOngoing
            ? "試合はまだ続いています（観戦中・操作は無効）"
            : "試合が終了しました"}
        </span>
        <span
          className={`ml-auto text-xs font-bold tabular-nums ${
            isWin ? "text-red-700/80" : "text-zinc-300"
          }`}
        >
          残り {state.aliveCount} 人
        </span>
      </div>

      {/* 左: ランキング / 中: 敵の状況 / 右: リザルト。3つとも主役の大きさで並べる。 */}
      {/* 決着後はランキングを上位20人まで出すため、その幅を厚くし敵の盤面を絞る。 */}
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,0.7fr)_minmax(380px,1.3fr)]">
        {/* 左：誰に倒されたか ＋ ランキング（上位20人） */}
        <div className="order-2 flex min-h-0 flex-col gap-2 lg:order-1">
          {defeatedByName !== undefined && (
            <div className="shrink-0 border-2 border-zinc-900 bg-zinc-900 px-3 py-2 text-white">
              {defeatedByName === null ? (
                <div className="text-xl font-black leading-tight text-zinc-300">
                  自滅した
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 truncate text-2xl font-black leading-tight">
                    {defeatedByName}
                  </span>
                  <span className="shrink-0 text-base font-black">に倒された</span>
                  {defeatedBadges > 0 && (
                    <span className="ml-auto shrink-0 text-xs font-bold tabular-nums text-amber-300">
                      バッジ {defeatedBadges} を献上
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <LiveRanking
            players={state.players}
            selfPlayerId={state.selfPlayerId}
            selfDisplayName={selfDisplayName}
            size="large"
            limit={20}
            className="min-h-0 flex-1 overflow-hidden"
          />
        </div>

        {/* 中：敵の状況（決着後も動き続ける）
            戦況ログはランキング20行ぶんの高さを確保するため、この画面では出さない
            （誰にやられたかはランキング上のバナー、脱落状況はランキングで分かる）。 */}
        <div className="order-3 min-h-0 lg:order-2">
          <PlayerGrid99
            players={state.players}
            selfPlayerId={state.selfPlayerId}
            size="large"
            className="h-full overflow-hidden"
          />
        </div>

        {/* 右：戦績（読むところ）＋操作（押すところ）。別ブロックにして役割を分ける。 */}
        <div className="order-1 flex min-h-0 flex-col gap-2 lg:order-3">
          <ResultBoard
            result={result}
            // 倒した相手は表示名を引くだけ（順番・件数はサーバーの KoNotified のまま）。
            defeatedPlayers={state.defeatedPlayers.map((d) => ({
              name:
                state.players.find((p) => p.playerId === d.victimId)?.displayName ??
                d.victimId,
              badges: d.badgesTransferred,
            }))}
            className="min-h-0 flex-1 overflow-y-auto"
          />
          <ResultActions
            sessionEndDeadlineMs={sessionEndDeadlineMs}
            onRematch={onRematch}
            onBackToTitle={onBackToTitle}
            onSessionEnd={onSessionEnd}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
