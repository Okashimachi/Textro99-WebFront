// マッチング待機画面。待機人数・カウントダウンを表示し、参加/離脱を送る。
// 表示は MatchmakingStatus DTO のみ。送信は props のコールバック（実体は入力/ネット層）。
import type { MatchmakingStatus } from "@/proto/types";
import { useNow } from "@/components/hud/useNow";

interface Props {
  status: MatchmakingStatus | null;
  /** 受信時刻（カウントダウン残時間の表示基準）。 */
  statusReceivedAtMs: number | null;
  onLeave: () => void;
  /** 開発ツール（ログ/デバッグペイン等）の表示状態。 */
  showDevTools?: boolean;
  /** 開発ツールの表示切替（マッチング中に本番相当の画面へ切り替えるため）。 */
  onToggleDevTools?: (show: boolean) => void;
  /**
   * 開始カウントダウンの終了時刻(ms epoch)。マッチング完了直後の 3 秒間だけ非 null。
   * この間はこの画面のまま「まもなく開始」のカウントダウンを表示する。
   */
  startCountdownDeadlineMs?: number | null;
}

export function MatchmakingScreen({
  status,
  statusReceivedAtMs,
  onLeave,
  showDevTools,
  onToggleDevTools,
  startCountdownDeadlineMs,
}: Props) {
  const now = useNow(100);

  // マッチング完了 → 開始までのローカルカウントダウン（残り秒。切り上げで 3→2→1 表示）。
  const startRemainMs =
    startCountdownDeadlineMs != null
      ? Math.max(0, startCountdownDeadlineMs - now)
      : null;
  const starting = startRemainMs != null;

  // カウントダウンは表示のみ（サーバー countdownMs を基準に残り時間を描画）。
  const remainMs =
    status?.countdownMs != null && statusReceivedAtMs != null
      ? Math.max(0, status.countdownMs - (now - statusReceivedAtMs))
      : null;

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-xl font-bold">
        {starting ? "まもなく開始" : "マッチング待機"}
      </h2>

      {starting ? (
        <div className="border-2 border-accent bg-panel px-12 py-8 text-center">
          <div className="text-7xl font-black tabular-nums text-accent">
            {Math.ceil(startRemainMs! / 1000)}
          </div>
          <div className="mt-2 text-sm text-sub">スタートまで</div>
        </div>
      ) : (
        <div className="border border-line bg-panel px-8 py-6 text-center">
          <div className="text-5xl font-black tabular-nums text-accent">
            {status?.waitingCount ?? 0}
          </div>
          <div className="mt-1 text-sm text-sub">
            待機人数（最少 {status?.minPlayers ?? "—"} 人）
          </div>

          {remainMs != null && (
            <div className="mt-4 text-2xl font-bold text-ink tabular-nums">
              開始まで {(remainMs / 1000).toFixed(1)}s
            </div>
          )}
          {remainMs == null && (
            <div className="mt-4 text-sm text-sub">プレイヤーを待っています…</div>
          )}
        </div>
      )}

      {!starting && (
        <button
          onClick={onLeave}
          className="border border-line bg-panel px-4 py-2 hover:bg-head"
        >
          マッチングを離脱
        </button>
      )}

      {onToggleDevTools && (
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-sub">
          <input
            type="checkbox"
            checked={showDevTools ?? true}
            onChange={(e) => onToggleDevTools(e.target.checked)}
            className="h-4 w-4"
          />
          開発ツールを表示（ログ / デバッグ表示。OFF で本番相当のプレイ画面）
        </label>
      )}
    </div>
  );
}
