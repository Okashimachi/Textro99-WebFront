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
  className?: string;
}

export function ResultBoard({
  result,
  defeatedByName,
  defeatedBadges = 0,
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

      {/* 撃破・バッジは戦績の主指標なので大きく2枚 */}
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <BigStat label="KO数" value={`${result.koCount}`} tone="accent" />
        <BigStat label="最終バッジ" value={`${result.finalBadgeCount}`} tone="badge" />
      </div>

      {/* タイピング統計 */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="最大コンボ" value={`${typingStats.maxCombo}`} />
        <Stat label="ダケンクリア" value={`${typingStats.totalDakenCleared}`} />
        <Stat label="ミス" value={`${typingStats.totalMiss}`} />
        <Stat label="正確率" value={`${accuracy.toFixed(1)}%`} />
        <Stat
          label="経過時間"
          value={`${(typingStats.elapsedMs / 1000).toFixed(0)}s`}
        />
      </div>

    </Panel>
  );
}

function BigStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "badge";
}) {
  const c =
    tone === "accent"
      ? { border: "border-red-500", bg: "bg-red-50", text: "text-red-600" }
      : { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600" };
  return (
    <div className={`border-2 px-3 py-2 ${c.border} ${c.bg}`}>
      <div className="text-[11px] font-bold text-zinc-500">{label}</div>
      <div className={`text-4xl font-black leading-tight tabular-nums ${c.text}`}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center border border-zinc-300 bg-white px-3 py-2">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
