// リザルト画面。GameOver DTO を表示し、再マッチング/タイトルへの導線を出す。
// rank==1 で優勝表示、それ以外は脱落表示。数値はサーバー由来（ローカル集計しない）。
import type { GameOver } from "@/proto/types";

interface Props {
  result: GameOver;
  onRematch: () => void;
  onBackToTitle: () => void;
}

export function ResultScreen({ result, onRematch, onBackToTitle }: Props) {
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
        className={`text-center ${isWin ? "text-accent" : "text-ink"}`}
      >
        <div className="text-sm uppercase tracking-widest text-sub">Result</div>
        <div className="mt-1 text-6xl font-black">
          {isWin ? "優勝！" : `${result.rank} 位`}
        </div>
        {!isWin && <div className="mt-1 text-sub">脱落しました</div>}
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

      <div className="flex gap-3">
        <button
          onClick={onRematch}
          className="border border-accent-dark bg-accent px-6 py-2 font-bold text-white hover:bg-accent-dark"
        >
          再マッチング
        </button>
        <button
          onClick={onBackToTitle}
          className="border border-line bg-panel px-6 py-2 hover:bg-head"
        >
          タイトルへ
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-panel px-4 py-3 text-center">
      <div className="text-xs text-sub">{label}</div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
