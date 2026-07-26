// マッチング待機画面。待機人数・カウントダウンを表示し、参加/離脱を送る。
// 表示は MatchmakingStatus DTO のみ。送信は props のコールバック（実体は入力/ネット層）。
import type { MatchmakingStatus } from "@/proto/types";
import { useNow } from "@/components/hud/useNow";

interface Props {
  status: MatchmakingStatus | null;
  /** 受信時刻（カウントダウン残時間の表示基準）。 */
  statusReceivedAtMs: number | null;
  onLeave: () => void;
}

export function MatchmakingScreen({ status, statusReceivedAtMs, onLeave }: Props) {
  const now = useNow(200);

  // カウントダウンは表示のみ（サーバー countdownMs を基準に残り時間を描画）。
  const remainMs =
    status?.countdownMs != null && statusReceivedAtMs != null
      ? Math.max(0, status.countdownMs - (now - statusReceivedAtMs))
      : null;

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-xl font-bold">マッチング待機</h2>

      <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-8 py-6 text-center">
        <div className="text-5xl font-bold tabular-nums text-emerald-400">
          {status?.waitingCount ?? 0}
        </div>
        <div className="mt-1 text-sm text-slate-400">
          待機人数（最少 {status?.minPlayers ?? "—"} 人）
        </div>

        {remainMs != null && (
          <div className="mt-4 text-2xl font-bold text-sky-300 tabular-nums">
            開始まで {(remainMs / 1000).toFixed(1)}s
          </div>
        )}
        {remainMs == null && (
          <div className="mt-4 text-sm text-slate-500">プレイヤーを待っています…</div>
        )}
      </div>

      <button
        onClick={onLeave}
        className="rounded bg-slate-600 px-4 py-2 hover:bg-slate-500"
      >
        マッチングを離脱
      </button>
    </div>
  );
}
