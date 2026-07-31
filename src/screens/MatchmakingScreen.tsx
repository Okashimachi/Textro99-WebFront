// マッチング待機画面。待機人数・カウントダウンを表示し、離脱を送る。
//
// 試合開始のタイミングはサーバー権威（docs/rules/01 §1,§3）。サーバーが最低人数の到達を
// 検出してカウントダウンを開始し、MatchmakingStatus.countdownMs で残り時間を配信する。
// この画面は**受け取った残り時間を描画するだけ**で、開始を決めない。
// （countdownMs が来なければ「人数待ち」表示のまま。ローカルで秒数を数え始めない。）
//
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
  /** 開発ツールの表示切替。未指定なら切替UIを出さない（実運用フロー）。 */
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

  // 開始待ちカウントダウン。サーバー countdownMs を基準に残り時間を描画するだけ。
  const remainMs =
    status?.countdownMs != null && statusReceivedAtMs != null
      ? Math.max(0, status.countdownMs - (now - statusReceivedAtMs))
      : null;

  const waiting = status?.waitingCount ?? 0;
  const minPlayers = status?.minPlayers ?? null;
  // 最低人数までの残り。カウントダウン中は「到達済み」なので出さない。
  const shortBy =
    minPlayers != null && remainMs == null ? Math.max(0, minPlayers - waiting) : 0;

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-xl font-bold">
        {starting ? "まもなく開始" : "マッチング待機"}
      </h2>

      {starting ? (
        <div className="border-2 border-red-500 bg-white px-12 py-8 text-center">
          <div className="text-7xl font-black tabular-nums text-red-600">
            {Math.ceil(startRemainMs! / 1000)}
          </div>
          <div className="mt-2 text-sm text-zinc-500">スタートまで</div>
        </div>
      ) : (
        <div className="border border-zinc-300 bg-white px-8 py-6 text-center">
          <div className="text-5xl font-black tabular-nums text-red-600">{waiting}</div>
          <div className="mt-1 text-sm text-zinc-500">
            参加中{minPlayers != null && `（最少 ${minPlayers} 人で開始）`}
          </div>

          {remainMs != null ? (
            <div className="mt-4">
              <div className="text-3xl font-bold tabular-nums text-zinc-900">
                開始まで {Math.ceil(remainMs / 1000)}s
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                この間も他のプレイヤーが参加できます
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-500">
              {shortBy > 0
                ? `あと ${shortBy} 人でカウントダウン開始`
                : "プレイヤーを待っています…"}
            </div>
          )}
        </div>
      )}

      {!starting && (
        <button
          onClick={onLeave}
          className="border border-zinc-300 bg-white px-4 py-2 hover:bg-zinc-100"
        >
          マッチングを離脱
        </button>
      )}

      {onToggleDevTools && (
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-500">
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
