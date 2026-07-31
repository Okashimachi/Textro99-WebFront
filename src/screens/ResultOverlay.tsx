// 観戦画面の上に重ねるリザルトモーダル。
//
// リザルトを「別画面」にすると、その後の試合（ランキング・敵の状況）が見えなくなる。
// そのため観戦画面はそのまま描画し続け、リザルトはこのモーダルで重ねる。
// 「戦況を見る」で閉じると背後が見え、右下のボタンでいつでも開き直せる。
//
// 試合が完全に終わった（サーバーが接続を切った）ら、残り秒数を表示する。
// 0 になったら onSessionEnd（＝セッション切断してタイトルへ）を1回だけ呼ぶ。
import { useEffect, useRef, useState } from "react";
import type { GameOver } from "@/proto/types";
import { useNow } from "@/components/hud/useNow";
import { ResultScreen } from "./ResultScreen";

interface Props {
  result: GameOver;
  /** セッション終了時刻(ms epoch)。試合が完全に終わるまでは null。 */
  sessionEndDeadlineMs: number | null;
  onRematch: () => void;
  onBackToTitle: () => void;
  /** カウントダウンが 0 に達した。セッションを切ってタイトルへ戻す。 */
  onSessionEnd: () => void;
}

export function ResultOverlay({
  result,
  sessionEndDeadlineMs,
  onRematch,
  onBackToTitle,
  onSessionEnd,
}: Props) {
  const [open, setOpen] = useState(true);
  const now = useNow(200);

  const remainSec =
    sessionEndDeadlineMs == null
      ? null
      : Math.max(0, Math.ceil((sessionEndDeadlineMs - now) / 1000));

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

  // 試合が完全に終わったらリザルトを開き直す（閉じたまま放置されても気づける）。
  useEffect(() => {
    if (sessionEndDeadlineMs != null) setOpen(true);
  }, [sessionEndDeadlineMs]);

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {remainSec != null && (
          <span className="border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-500">
            タイトルまで
            <span className="mx-1 font-bold tabular-nums text-red-600">{remainSec}</span>
            秒
          </span>
        )}
        <button
          onClick={() => setOpen(true)}
          className="border border-red-700 bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          リザルトを見る
        </button>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="リザルト"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/60 px-3 py-6"
    >
      <div className="w-full max-w-3xl border border-zinc-300 bg-zinc-100 shadow-xl">
        <ResultScreen
          result={result}
          onRematch={onRematch}
          onBackToTitle={onBackToTitle}
          onClose={() => setOpen(false)}
          sessionEndInSec={remainSec}
        />
      </div>
    </div>
  );
}
