// useDakenTimer — 現在のお題の残り時間（表示専用）。
//
// 基準は「そのお題が画面に出た時刻」。サーバーの単調時刻 `issuedAtServerTimeMs` とは
// 突き合わせない（クロックが別基準のため）。
//
// **時間切れの確定はサーバー権威**（DakenExpired）。ここは警告表示のための目安であり、
// 残り 0 になってもクライアント側でお題を消したり判定したりしない（docs/rules/01 §3）。
import { useRef } from "react";
import type { DakenInstance } from "@/proto/types";
import { useNow } from "./useNow";

/** この値より長い制限時間は「実質無制限」とみなして表示しない（練習用スタブ対策）。 */
const TIMER_VISIBLE_MAX_MS = 60_000;

export interface DakenTimer {
  /** 残り時間を表示する対象かどうか。 */
  show: boolean;
  remainMs: number;
  /** 残り時間の割合（1→0）。 */
  ratio: number;
  /** 残り 50% 以下。 */
  warn: boolean;
  /** 残り 25% 以下。 */
  danger: boolean;
}

export function useDakenTimer(daken: DakenInstance | undefined): DakenTimer {
  const now = useNow(100);
  const seenRef = useRef<{ dakenId: string; atMs: number } | null>(null);

  if (daken && seenRef.current?.dakenId !== daken.dakenId) {
    seenRef.current = { dakenId: daken.dakenId, atMs: Date.now() };
  }

  const limitMs = daken?.timeLimitMs ?? 0;
  const show = !!daken && limitMs > 0 && limitMs <= TIMER_VISIBLE_MAX_MS;
  const remainMs = show
    ? Math.max(0, limitMs - (now - (seenRef.current?.atMs ?? now)))
    : 0;
  const ratio = show && limitMs > 0 ? remainMs / limitMs : 1;

  return {
    show,
    remainMs,
    ratio,
    warn: show && ratio <= 0.5,
    danger: show && ratio <= 0.25,
  };
}
