// リザルト表示。GameOver DTO を表示し、再マッチング/タイトルへの導線を出す。
// rank==1 で優勝表示、それ以外は脱落表示。数値はサーバー由来（ローカル集計しない）。
//
// 観戦画面の上にモーダルとして重ねて使う（ResultOverlay）。閉じると背後のランキング・
// 敵の状況が見える。試合が完全に終わる（サーバーが接続を切る）と、下部に
// セッション終了までのカウントダウンが出る。
import type { GameOver } from "@/proto/types";

interface Props {
  result: GameOver;
  onRematch: () => void;
  onBackToTitle: () => void;
  /** リザルトを閉じて観戦画面（ランキング・敵の状況）を見る。 */
  onClose?: () => void;
  /** セッション終了までの残り秒数。試合が完全に終わったときだけ非 null。 */
  sessionEndInSec?: number | null;
}

export function ResultScreen({
  result,
  onRematch,
  onBackToTitle,
  onClose,
  sessionEndInSec = null,
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
    <div className="flex flex-col items-center gap-6 py-12">
      <div
        className={`text-center ${isWin ? "text-red-600" : "text-zinc-900"}`}
      >
        <div className="text-sm uppercase tracking-widest text-zinc-500">Result</div>
        <div className="mt-1 text-6xl font-black">
          {isWin ? "優勝！" : `${result.rank} 位`}
        </div>
        {!isWin && <div className="mt-1 text-zinc-500">脱落しました</div>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="順位" value={`${result.rank}`} />
        <Stat label="KO数" value={`${result.koCount}`} />
        <Stat label="最終バッジ" value={`${result.finalBadgeCount}`} />
        <Stat label="最大コンボ" value={`${typingStats.maxCombo}`} />
        <Stat label="ダケンクリア" value={`${typingStats.totalDakenCleared}`} />
        <Stat label="ミス" value={`${typingStats.totalMiss}`} />
        <Stat label="正確率" value={`${accuracy.toFixed(1)}%`} />
        <Stat label="経過時間" value={`${(typingStats.elapsedMs / 1000).toFixed(0)}s`} />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="border border-zinc-300 bg-white px-6 py-2 hover:bg-zinc-100"
          >
            戦況を見る
          </button>
        )}
        <button
          onClick={onRematch}
          className="border border-red-700 bg-red-600 px-6 py-2 font-bold text-white hover:bg-red-700"
        >
          再マッチング
        </button>
        <button
          onClick={onBackToTitle}
          className="border border-zinc-300 bg-white px-6 py-2 hover:bg-zinc-100"
        >
          タイトルへ
        </button>
      </div>

      {sessionEndInSec != null && (
        <p className="text-sm text-zinc-500">
          試合が終了しました。
          <span className="mx-1 text-lg font-bold tabular-nums text-red-600">
            {sessionEndInSec}
          </span>
          秒後にタイトルへ戻ります
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-300 bg-white px-4 py-3 text-center">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
