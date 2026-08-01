// 決着レイアウトの主役パネル。試合中に「お題／お題のストック」を出していた
// 中央〜右の領域を、そのまま自分の戦績表示に置き換える。
//
// 数値はサーバー由来（GameOver DTO）をそのまま出す。正確率だけは表示用の割り算
// （docs/rules/01 §3 の「表示計算」の範囲・log-011 と同じ扱い）。
//
// 左に順位とパラメータ、右にトドメを刺した相手を置く。
// 「誰に倒されたか」はランキングの上（MatchResultScreen）、操作（再マッチング/タイトルへ）と
// 終了カウントダウンは別ブロック（ResultActions）に分けている。
import type { GameOver } from "@/proto/types";
import { Panel } from "@/components/hud/Panel";

interface Props {
  result: GameOver;
  /**
   * 自分が倒した相手（受信順）。名前の解決は呼び出し側が players から行う。
   * 件数の正典はサーバーの koCount。これはその内訳表示。
   */
  defeatedPlayers?: { name: string; badges: number }[];
  className?: string;
}

export function ResultBoard({
  result,
  defeatedPlayers = [],
  className = "",
}: Props) {
  // 内訳として並べる上限。これを超えるぶんは e.t.c. にまとめ、枠からはみ出させない。
  const VICTIM_ROWS = 7;
  const shownVictims = defeatedPlayers.slice(0, VICTIM_ROWS);
  // 表示しきれないぶん＋KoNotified を受け取れなかったぶん（koCount との差）。
  const hiddenVictims = Math.max(
    defeatedPlayers.length - shownVictims.length,
    result.koCount - shownVictims.length,
  );

  const isWin = result.rank === 1;
  const { typingStats } = result;
  const accuracy =
    typingStats.totalDakenCleared + typingStats.totalMiss > 0
      ? (typingStats.totalDakenCleared /
          (typingStats.totalDakenCleared + typingStats.totalMiss)) *
        100
      : 0;

  return (
    <Panel
      label="リザルト — あなたの戦績"
      tone={isWin ? "accent" : "ink"}
      right={isWin ? "WINNER" : "GAME OVER"}
      className={className}
      bodyClassName="grid min-h-0 flex-1 grid-cols-2 gap-3 p-3"
    >
      {/* 左：順位とパラメータ。右：トドメを刺した相手。 */}
      <div className="flex min-h-0 flex-col gap-3">
      {/* 順位（この画面で一番大きい要素） */}
      <div
        className={`animate-plate-pop flex shrink-0 items-center justify-center gap-3 border-2 py-4 ${
          isWin ? "border-red-600 bg-red-50" : "border-zinc-900 bg-zinc-100"
        }`}
      >
        <span
          className={`text-[10px] font-black uppercase tracking-[0.3em] ${
            isWin ? "text-red-700" : "text-zinc-500"
          }`}
        >
          Rank
        </span>
        <span
          className={`text-7xl font-black leading-none tabular-nums ${
            isWin ? "text-red-600" : "text-zinc-900"
          }`}
        >
          {isWin ? "1" : result.rank}
        </span>
        <span
          className={`text-2xl font-black ${isWin ? "text-red-600" : "text-zinc-900"}`}
        >
          {isWin ? "優勝！" : "位"}
        </span>
      </div>

        {/* パラメータは枠を持たせず、ラベルと値の行として縦に並べる。 */}
        <dl className="min-h-0 flex-1 divide-y divide-zinc-200 border border-zinc-300 bg-white px-3">
          {/* バッジは表示しない（概念を出さない方針）。値は proto から受け取っている。 */}
          <MiniStat label="最大コンボ" value={`${typingStats.maxCombo}`} />
          <MiniStat label="ダケンクリア" value={`${typingStats.totalDakenCleared}`} />
          <MiniStat label="ミス" value={`${typingStats.totalMiss}`} />
          <MiniStat label="正確率" value={`${accuracy.toFixed(1)}%`} />
          <MiniStat
            label="経過時間"
            value={`${(typingStats.elapsedMs / 1000).toFixed(0)}s`}
          />
        </dl>
      </div>

      {/* 右：トドメを刺した相手。数（サーバーの koCount）と内訳を1枚にまとめる。 */}
      <div className="flex min-h-0 flex-col border-2 border-red-500 bg-red-50">
        <div className="shrink-0 border-b border-red-200 px-3 py-2">
          <span className="text-2xl font-black leading-none tabular-nums text-red-600">
            {result.koCount}
          </span>
          <span className="ml-1 text-sm font-black text-red-700">
            人にトドメを刺した
          </span>
        </div>

        {/* 収まらないぶんは e.t.c. にまとめ、この枠からはみ出させない。 */}
        <ul className="min-h-0 flex-1 space-y-1 overflow-hidden p-2">
          {defeatedPlayers.length === 0 ? (
            <li className="px-1 py-0.5 text-sm text-red-700/60">
              {result.koCount > 0
                ? "撃破した相手の記録なし（試合途中から観戦）"
                : "撃破なし"}
            </li>
          ) : (
            shownVictims.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className="flex items-center gap-2 border border-red-200 bg-white px-2 py-1"
              >
                <span className="w-5 shrink-0 text-center text-[11px] font-black tabular-nums text-red-400">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-black text-zinc-900">
                  {p.name}
                </span>
              </li>
            ))
          )}
          {/* 表示しきれないぶん＋サーバーの koCount に内訳が足りないぶん。
              数の正典は koCount 側。ここで数え直して辻褄を合わせない。 */}
          {defeatedPlayers.length > 0 && hiddenVictims > 0 && (
            <li className="px-1 py-0.5 text-sm font-bold text-red-700/70">
              e.t.c.（ほか {hiddenVictims} 人）
            </li>
          )}
        </ul>
      </div>
    </Panel>
  );
}

/** パラメータ1項目。個別の枠は持たず、ラベル左・値右の1行として並べる。 */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-lg font-bold tabular-nums text-zinc-900">{value}</dd>
    </div>
  );
}
