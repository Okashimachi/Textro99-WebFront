// マッチング待機画面。待機人数・待機中のプレイヤー一覧・開始までの残り時間を表示し、離脱を送る。
//
// 試合開始のタイミングはサーバー権威（docs/rules/01 §1,§3）。サーバーが最低人数の到達を
// 検出してカウントダウンを開始し、経過後に MatchStart を配信する。この画面は開始を決めない。
//
// 残り時間について:
//   MatchmakingStatus.countdownMs は **受信時点の残り時間(ms)**（proto textro-main 42fb05e
//   以降）。サーバーは参加・離脱のたびにしか再配信しないため、受信値をそのまま出すと止まって
//   見える。そこで「受信時刻 + countdownMs」を締切として保持し、表示側だけをローカルに
//   補間する（＝表示専用の時計。開始判定はしない）。
//   以前は countdownMs に全体秒数が載っており参加のたびに巻き戻っていたが、サーバー側の
//   修正（server 6c33138）で解消済み。
//
// 表示は MatchmakingStatus DTO と受信済みイベントのみ。送信は props のコールバック。
import type { MatchmakingStatus } from "@/proto/types";
import type { GameEvent } from "@/state";
import { useNow } from "@/components/hud/useNow";

interface Props {
  status: MatchmakingStatus | null;
  /** MatchmakingStatus の受信時刻。countdownMs の起点にする（表示専用）。 */
  statusReceivedAtMs: number | null;
  /** 待機中のイベント（参加/離脱・カウントダウン開始等）。テスト用ログとして表示する。 */
  events?: GameEvent[];
  /** 自分の表示名。待機者一覧で自分の行を強調する。 */
  selfDisplayName?: string;
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
  events,
  selfDisplayName,
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

  // サーバーの開始カウントダウン。受信時刻 + 残り時間 を締切として補間する。
  const counting = status?.countdownMs != null && statusReceivedAtMs != null;
  const countdownRemainMs = counting
    ? Math.max(0, statusReceivedAtMs! + status!.countdownMs! - now)
    : null;

  const waiting = status?.waitingCount ?? 0;
  const minPlayers = status?.minPlayers ?? null;
  const waitingPlayers = status?.players ?? [];
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
          <div className="text-5xl font-black tabular-nums text-red-600">
            {waiting}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            参加中{minPlayers != null && `（最少 ${minPlayers} 人で開始）`}
          </div>

          {counting ? (
            <div className="mt-4">
              {/* 0 に達しても MatchStart が届くまでは待ち。0 を出し続けず文言に切り替える。 */}
              {countdownRemainMs! > 0 ? (
                <>
                  <div className="text-sm text-zinc-500">試合開始まで</div>
                  <div className="text-4xl font-black tabular-nums text-red-600">
                    {Math.ceil(countdownRemainMs! / 1000)}
                    <span className="ml-0.5 text-lg font-bold">秒</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    最低人数に到達。この間も他のプレイヤーが参加できます
                  </div>
                </>
              ) : (
                <div className="text-xl font-bold text-red-600">まもなく開始します…</div>
              )}
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

      {/* 待機中のプレイヤー一覧。サーバーが参加/離脱のたびに再配信する players をそのまま出す。
          Bot はマッチング成立時に補完されるため、ここには人間の参加者だけが並ぶ。
          MatchStart 受信で matchmaking は null に戻る（＝待機プールは解散）ので、
          開始カウントダウン中は出さない。 */}
      {!starting && (
        <section className="w-full max-w-md">
          <h3 className="mb-1 flex items-baseline justify-between text-[11px] font-bold text-zinc-500">
            <span>参加者</span>
            <span className="tabular-nums">{waitingPlayers.length} 人</span>
          </h3>
          <ul className="max-h-56 space-y-0.5 overflow-y-auto border border-zinc-300 bg-white p-2 text-sm">
            {waitingPlayers.length === 0 ? (
              <li className="px-1 py-0.5 text-zinc-400">まだ誰もいません</li>
            ) : (
              waitingPlayers.map((p, i) => {
                const isSelf =
                  !!selfDisplayName && p.displayName === selfDisplayName;
                return (
                  <li
                    key={`${p.displayName}-${i}`}
                    className={`flex items-baseline gap-2 px-1 py-0.5 ${
                      isSelf
                        ? "bg-red-50 font-bold text-red-700"
                        : "text-zinc-700"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="truncate">{p.displayName}</span>
                    {isSelf && (
                      <span className="ml-auto text-[10px]">あなた</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </section>
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
          受け取った順に出す。 */}
      {events && events.length > 0 && (
        <section className="w-full max-w-md">
          <h3 className="mb-1 text-[11px] font-bold text-zinc-500">
            イベントログ（テスト用）
          </h3>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto border border-zinc-300 bg-white p-2 font-mono text-[11px] text-zinc-600">
            {events.map((e) => (
              <li key={e.id}>
                <span className="text-zinc-400">{formatClock(e.atMs)}</span>{" "}
                {e.message}
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
