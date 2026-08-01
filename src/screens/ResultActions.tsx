// 決着画面の操作ブロック。戦績（ResultBoard）とは別のグリッドに置き、
// 「読むところ」と「押すところ」を見た目から分ける。
//
// セッション終了カウントダウン（試合が完全に終わってからタイトルへ戻るまで）も
// ここに出す。行き先を決める操作と同じ場所にあるほうが意味が通るため。
// 0 到達で onSessionEnd を1回だけ呼ぶ。
import { useEffect, useRef } from "react";
import { useNow } from "@/components/hud/useNow";
import { openXIntent, type ShareText } from "@/share";
import { SESSION_END_COUNTDOWN_MS } from "./sessionEnd";

interface Props {
  /** X 共有の内容（現状はモック生成。将来はサーバー配信）。 */
  share: ShareText;
  /** セッション終了時刻(ms epoch)。試合が完全に終わるまでは null。 */
  sessionEndDeadlineMs: number | null;
  onRematch: () => void;
  onBackToTitle: () => void;
  /** カウントダウンが 0 に達した。セッションを切ってタイトルへ戻す。 */
  onSessionEnd: () => void;
  className?: string;
}

export function ResultActions({
  share,
  sessionEndDeadlineMs,
  onRematch,
  onBackToTitle,
  onSessionEnd,
  className = "",
}: Props) {
  const now = useNow(200);
  const remainMs =
    sessionEndDeadlineMs == null ? null : Math.max(0, sessionEndDeadlineMs - now);
  const remainSec = remainMs == null ? null : Math.ceil(remainMs / 1000);

  // 0 到達で1回だけ通知する（再描画のたびに呼ばない）。
  const firedRef = useRef(false);
  useEffect(() => {
    if (sessionEndDeadlineMs == null) {
      firedRef.current = false;
      return;
    }
    if (remainSec === 0 && !firedRef.current) {
      firedRef.current = true;
      onSessionEnd();
    }
  }, [sessionEndDeadlineMs, remainSec, onSessionEnd]);

  return (
    // 戦績パネル（白地・細枠）と差をつけるため、操作は暗い地の帯にまとめる。
    <section className={`border-2 border-zinc-900 bg-zinc-900 p-3 ${className}`}>
      {remainMs != null && (
        <div className="mb-3">
          <div className="flex items-baseline justify-between text-xs font-bold text-zinc-300">
            <span>試合終了。まもなくタイトルへ戻ります</span>
            <span className="text-3xl font-black tabular-nums text-red-400">
              {remainSec}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-zinc-700">
            <div
              className="h-full bg-red-500 transition-[width] duration-200 ease-linear"
              style={{ width: `${(remainMs / SESSION_END_COUNTDOWN_MS) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRematch}
          className="border-2 border-red-400 bg-red-600 px-4 py-4 text-xl font-black tracking-wide text-white shadow-lg transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          再マッチング
        </button>
        <button
          onClick={onBackToTitle}
          className="border-2 border-zinc-400 bg-white px-4 py-4 text-xl font-black tracking-wide text-zinc-900 transition hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          タイトルへ
        </button>
      </div>

      {/* 共有は主導線（再マッチング/タイトルへ）より弱く、右下に小さく置く。
          押すと X の投稿画面が別タブで開くだけで、投稿の確定はユーザーが行う。 */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => openXIntent(share)}
          title={share.text}
          className="flex items-center gap-2 border border-zinc-600 bg-black px-3 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <XLogo />
          結果をポスト
        </button>
      </div>
    </section>
  );
}

/** X のロゴ。 */
function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
