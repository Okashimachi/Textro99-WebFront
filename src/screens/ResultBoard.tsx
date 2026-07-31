// 決着レイアウトの主役パネル。試合中に「お題／お題のストック」を出していた
// 中央〜右の領域を、そのまま自分の戦績表示に置き換える。
//
// 数値はサーバー由来（GameOver DTO）をそのまま出す。正確率だけは表示用の割り算
// （docs/rules/01 §3 の「表示計算」の範囲・log-011 と同じ扱い）。
//
// ここは「読むところ」だけを持つ。操作（再マッチング/タイトルへ）と終了カウントダウンは
// 別ブロック（ResultActions）に分けている。
import type { GameOver } from "@/proto/types";
import { Panel } from "@/components/hud/Panel";

interface Props {
  result: GameOver;
  /**
   * 自分にトドメを刺した相手の表示名。自滅なら null、優勝（＝倒されていない）なら undefined。
   * 名前の解決は呼び出し側（MatchResultScreen）が players から行う。
   */
  defeatedByName?: string | null;
  /** その KO で相手に渡ったバッジ数（サーバー値）。 */
  defeatedBadges?: number;
  /**
   * 自分が倒した相手（受信順）。名前の解決は呼び出し側が players から行う。
   * 件数の正典はサーバーの koCount。これはその内訳表示。
   */
  defeatedPlayers?: { name: string; badges: number }[];
  className?: string;
}

export function ResultBoard({
  result,
  defeatedByName,
  defeatedBadges = 0,
  defeatedPlayers = [],
  className = "",
}: Props) {
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
      bodyClassName="flex min-h-0 flex-1 flex-col gap-3 p-3"
    >
      {/* 順位（この画面で一番大きい要素） */}
      <div
        className={`animate-plate-pop flex shrink-0 items-center justify-center gap-4 border-2 py-4 ${
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

      {/* トドメを刺した相手（優勝時は出さない）。KoNotified をそのまま出すだけ。 */}
      {!isWin && defeatedByName !== undefined && (
        <div className="shrink-0 border-2 border-zinc-900 bg-zinc-900 px-4 py-3 text-white">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
            Defeated by
          </div>
          {defeatedByName === null ? (
            <div className="mt-0.5 text-3xl font-black leading-tight text-zinc-300">
              自滅
            </div>
          ) : (
            <div className="mt-0.5 flex items-baseline gap-3">
              <span className="min-w-0 flex-1 truncate text-4xl font-black leading-tight">
                {defeatedByName}
              </span>
              {defeatedBadges > 0 && (
                <span className="shrink-0 text-lg font-bold tabular-nums text-amber-300">
                  バッジ {defeatedBadges} を献上
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 倒した相手。数（サーバーの koCount）と、誰を倒したかの内訳を1枚にまとめる。 */}
      <div className="flex min-h-0 flex-1 flex-col border-2 border-red-500 bg-red-50">
        <div className="flex shrink-0 items-center gap-3 border-b border-red-200 px-3 py-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-red-700">
            Knocked out
          </span>
          <span className="text-4xl font-black leading-none tabular-nums text-red-600">
            {result.koCount}
          </span>
          <span className="text-sm font-black text-red-600">人</span>
          <span className="ml-auto text-[11px] font-bold tabular-nums text-amber-600">
            バッジ {result.finalBadgeCount}
          </span>
        </div>

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {defeatedPlayers.length === 0 ? (
            <li className="px-1 py-0.5 text-sm text-red-700/60">
              {result.koCount > 0
                ? "撃破した相手の記録なし（試合途中から観戦）"
                : "撃破なし"}
            </li>
          ) : (
            defeatedPlayers.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className="flex items-center gap-2 border border-red-200 bg-white px-2 py-1"
              >
                <span className="w-5 shrink-0 text-center text-[11px] font-black tabular-nums text-red-400">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-lg font-black text-zinc-900">
                  {p.name}
                </span>
                {p.badges > 0 && (
                  <span className="shrink-0 text-xs font-bold tabular-nums text-amber-600">
                    +{p.badges}
                  </span>
                )}
              </li>
            ))
          )}
          {/* サーバーの koCount に内訳が足りない場合（受信前の撃破など）は差分を明示する。
              数の正典は koCount 側。ここで数え直して辻褄を合わせない。 */}
          {defeatedPlayers.length > 0 && result.koCount > defeatedPlayers.length && (
            <li className="px-1 py-0.5 text-xs text-red-700/60">
              ほか {result.koCount - defeatedPlayers.length} 人（記録なし）
            </li>
          )}
        </ul>
      </div>

      {/* タイピング統計は主役ではないので1行に畳む。 */}
      <dl className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-500">
        <MiniStat label="最大コンボ" value={`${typingStats.maxCombo}`} />
        <MiniStat label="ダケン" value={`${typingStats.totalDakenCleared}`} />
        <MiniStat label="ミス" value={`${typingStats.totalMiss}`} />
        <MiniStat label="正確率" value={`${accuracy.toFixed(1)}%`} />
        <MiniStat
          label="時間"
          value={`${(typingStats.elapsedMs / 1000).toFixed(0)}s`}
        />
      </dl>
    </Panel>
  );
}

/** タイピング統計の1項目。枠を持たず、ラベルと値だけを詰めて並べる。 */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <dt className="text-[11px]">{label}</dt>
      <dd className="text-base font-bold tabular-nums text-zinc-900">{value}</dd>
    </span>
  );
}
