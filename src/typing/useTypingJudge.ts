// タイピング判定(#8)を React から使うフック。
// 現在のお題ダケンに対して打鍵を流し込み、完了で DakenClearReport の材料を1件返す。
// 判定の中核は judge.ts（純関数）。ここは「お題が変わったらリセット」「完了で通知」だけ。
import { useCallback, useEffect, useRef, useState } from "react";
import type { DakenClearReport, DakenInstance } from "@/proto/types";
import { createJudge, elapsedMs, feedChar, typedPrefix, type JudgeState } from "./judge";

export interface UseTypingJudgeOptions {
  /** 現在打つべきお題（activeDaken の先頭を渡す）。無ければ判定停止。 */
  daken: DakenInstance | undefined;
  /** 自操作が有効か（inMatch のみ true）。false の間は打鍵を無視。 */
  active: boolean;
  /** お題を打ち切った時に呼ばれる。DakenClearReport を送る配線は呼び出し側。 */
  onClear: (report: DakenClearReport) => void;
}

export interface UseTypingJudge {
  /** 正しく打てた先頭部分（ハイライト表示用）。 */
  typed: string;
  /** ミス打鍵の累計（表示用）。 */
  missCount: number;
  /** 打鍵1文字を判定へ渡す（useInputController の onCharKey に接続）。 */
  registerChar: (char: string) => void;
}

export function useTypingJudge({
  daken,
  active,
  onClear,
}: UseTypingJudgeOptions): UseTypingJudge {
  const [snapshot, setSnapshot] = useState({ typed: "", missCount: 0 });
  const judgeRef = useRef<JudgeState | null>(null);
  // onClear は最新参照を保持（registerChar を安定化するため依存に入れない）。
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  // お題が変わったら判定をリセット。
  useEffect(() => {
    judgeRef.current = daken ? createJudge(daken.dakenId, daken.text) : null;
    setSnapshot({ typed: "", missCount: 0 });
  }, [daken?.dakenId, daken?.text]);

  const registerChar = useCallback((char: string) => {
    if (!active) return;
    const judge = judgeRef.current;
    if (!judge || judge.done) return;

    const { state, justCompleted } = feedChar(judge, char);
    judgeRef.current = state;
    setSnapshot({ typed: typedPrefix(state), missCount: state.missCount });

    if (justCompleted) {
      onClearRef.current({
        dakenId: state.dakenId,
        isMiss: state.missCount > 0,
        missCount: state.missCount,
        elapsedMs: elapsedMs(state),
      });
    }
  }, [active]);

  return { typed: snapshot.typed, missCount: snapshot.missCount, registerChar };
}
