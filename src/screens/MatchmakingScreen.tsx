// マッチング待機画面。待機人数と待機中のイベントを表示し、離脱を送る。
//
// 試合開始のタイミングはサーバー権威（docs/rules/01 §1,§3）。サーバーが最低人数の到達を
// 検出してカウントダウンを開始し、経過後に MatchStart を配信する。この画面は開始を決めない。
//
// **残り秒数は表示しない。** サーバーは参加・離脱のたびに現在値を再配信し、その際
// countdownMs に「残り時間」ではなく「全体秒数」を載せ直すため（server: matchmaking.go
// broadcast）、受信値から残り時間を復元できない（人が参加するたび表示が巻き戻る）。
// サーバーが残り時間を配信するようになったら、ここに残り秒数表示を戻す。
// それまでは「カウントダウン中かどうか」だけを使い、進行はイベントログで伝える。
//
// 表示は MatchmakingStatus DTO と受信済みイベントのみ。送信は props のコールバック。
import type { MatchmakingStatus } from "@/proto/types";
import type { GameEvent } from "@/state";
import { useNow } from "@/components/hud/useNow";

interface Props {
  status: MatchmakingStatus | null;
  /** 受信時刻（現状は未使用。残り時間配信が入ったときの継ぎ目として残す）。 */
  statusReceivedAtMs: number | null;
  /** 待機中のイベント（参加/離脱・カウントダウン開始等）。テスト用ログとして表示する。 */
  events?: GameEvent[];
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
  events,
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

  // countdownMs の有無＝カウントダウン中かどうか。値（秒数）は残り時間ではないので使わない。
  const counting = status?.countdownMs != null;

  const waiting = status?.waitingCount ?? 0;
  const minPlayers = status?.minPlayers ?? null;
  // 最低人数までの残り。カウントダウン中は「到達済み」なので出さない。
  const shortBy =
    minPlayers != null && !counting ? Math.max(0, minPlayers - waiting) : 0;

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

          {counting ? (
            <div className="mt-4">
              <div className="text-xl font-bold text-red-600">まもなく開始します</div>
              <div className="mt-1 text-xs text-zinc-500">
                最低人数に到達。この間も他のプレイヤーが参加できます
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

      {/* テスト用ログ。サーバー通知（参加/離脱・カウントダウン開始/中止・試合開始）を
          受け取った順に出す。残り時間の配信が入るまでの進行確認用。 */}
      {events && events.length > 0 && (
        <section className="w-full max-w-md">
          <h3 className="mb-1 text-[11px] font-bold text-zinc-500">
            イベントログ（テスト用）
          </h3>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto border border-zinc-300 bg-white p-2 font-mono text-[11px] text-zinc-600">
            {events.map((e) => (
              <li key={e.id}>
                <span className="text-zinc-400">{formatClock(e.atMs)}</span> {e.message}
              </li>
            ))}
          </ul>
        </section>
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

/** ms epoch を hh:mm:ss にする（ログの時刻表示用）。 */
function formatClock(atMs: number): string {
  return new Date(atMs).toLocaleTimeString("ja-JP", { hour12: false });
}
