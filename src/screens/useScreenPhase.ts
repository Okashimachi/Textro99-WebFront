// 画面フェーズと画面遷移アクションを提供するフック。
// フェーズ導出はサーバー state ベース。ローカル意図（参加表明/リザルト解除）だけを保持する。
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameViewModel } from "@/state";
import {
  deriveScreenPhase,
  isInputActive,
  type LocalIntent,
  type ScreenPhase,
} from "./lifecycle";

/** マッチング完了(MatchStart)後、マッチング画面のまま表示する開始カウントダウン(ms)。 */
export const START_COUNTDOWN_MS = 3000;

export interface ScreenActions {
  /** タイトル → マッチング待機（参加表明）。 */
  seekMatch: () => void;
  /** リザルト → タイトルへ戻る。 */
  backToTitle: () => void;
  /** 待機 → タイトル（マッチング離脱）。 */
  leaveMatchmaking: () => void;
  /** リザルト → 再マッチング（待機へ）。 */
  rematch: () => void;
}

export interface UseScreenPhase {
  phase: ScreenPhase;
  inputActive: boolean;
  actions: ScreenActions;
  /**
   * 開始カウントダウンの終了時刻(ms epoch)。マッチング完了直後の 3 秒間だけ非 null。
   * この間はフェーズを matchmaking に留め、マッチング画面でカウントダウンを表示する。
   */
  startCountdownDeadlineMs: number | null;
}

export function useScreenPhase(state: GameViewModel): UseScreenPhase {
  const [intent, setIntent] = useState<LocalIntent>("idle");

  // 新しい試合が始まったら（matchId 出現）リザルト解除意図をリセットする。
  useEffect(() => {
    if (state.matchId && !state.gameOver) {
      setIntent("idle");
    }
  }, [state.matchId, state.gameOver]);

  // 開始カウントダウンのゲート。MatchStart(matchId 出現)を検出したら
  // START_COUNTDOWN_MS の間だけ matchmaking 画面に留め、経過後に inMatch へ進める。
  const [startGate, setStartGate] = useState<{
    matchId: string;
    deadline: number;
  } | null>(null);
  // 同一 matchId に対してゲートを一度だけ張るための記録（カウントダウン終了後に再突入しない）。
  const gatedMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.matchId && !state.gameOver) {
      if (gatedMatchIdRef.current !== state.matchId) {
        gatedMatchIdRef.current = state.matchId;
        setStartGate({
          matchId: state.matchId,
          deadline: Date.now() + START_COUNTDOWN_MS,
        });
      }
    } else {
      // 試合終了/離脱時はゲートを解除し、次の matchId で再度カウントダウンできるようにする。
      setStartGate(null);
      gatedMatchIdRef.current = null;
    }
  }, [state.matchId, state.gameOver]);

  // カウントダウン終了でゲートを外す（→ フェーズが inMatch に切り替わる）。
  useEffect(() => {
    if (!startGate) return;
    const remain = startGate.deadline - Date.now();
    if (remain <= 0) {
      setStartGate(null);
      return;
    }
    const timer = setTimeout(() => setStartGate(null), remain);
    return () => clearTimeout(timer);
  }, [startGate]);

  const gateActive =
    startGate != null &&
    startGate.matchId === state.matchId &&
    !state.gameOver;

  // ゲート中はマッチング画面に留める。それ以外は通常のフェーズ導出。
  const phase = gateActive ? "matchmaking" : deriveScreenPhase(state, intent);
  const startCountdownDeadlineMs = gateActive ? startGate!.deadline : null;

  const actions = useMemo<ScreenActions>(
    () => ({
      seekMatch: () => setIntent("seeking"),
      backToTitle: () => setIntent("dismissedResult"),
      leaveMatchmaking: () => setIntent("idle"),
      rematch: () => setIntent("seeking"),
    }),
    [],
  );

  return {
    phase,
    inputActive: isInputActive(phase),
    actions,
    startCountdownDeadlineMs,
  };
}
