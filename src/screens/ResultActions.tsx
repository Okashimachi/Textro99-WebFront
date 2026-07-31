// 決着画面の操作ブロック。戦績（ResultBoard）とは別のグリッドに置き、
// 「読むところ」と「押すところ」を見た目から分ける。
//
// セッション終了カウントダウン（試合が完全に終わってからタイトルへ戻るまで）も
// ここに出す。行き先を決める操作と同じ場所にあるほうが意味が通るため。
// 0 到達で onSessionEnd を1回だけ呼ぶ。
import { useEffect, useRef } from "react";
import { useNow } from "@/components/hud/useNow";
import { SESSION_END_COUNTDOWN_MS } from "./sessionEnd";

interface Props {
  /** セッション終了時刻(ms epoch)。試合が完全に終わるまでは null。 */
  sessionEndDeadlineMs: number | null;
  onRematch: () => void;
  onBackToTitle: () => void;
  /** カウントダウンが 0 に達した。セッションを切ってタイトルへ戻す。 */
  onSessionEnd: () => void;
  className?: string;
}

export function ResultActions({
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
    </section>
  );
}
