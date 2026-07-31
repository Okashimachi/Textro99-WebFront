// 画面フェーズと画面遷移アクションを提供するフック。
// フェーズ導出はサーバー state ベース。ローカル意図（参加表明/リザルト解除）だけを保持する。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameOver } from "@/proto/types";
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
  /**
   * 自分の試合結果（GameOver）。受信時にローカルへ焼き付け、ユーザーが離脱するまで保持する。
   *
   * state.gameOver をそのまま使わないのは、サーバーが（意図せず）次の MatchStart を送ってきた場合に
   * reducer が gameOver を null に戻してしまい、リザルトが勝手に消えるため。焼き付けておけば
   * 「次の試合が始まってもリザルトは出したまま」を保証できる。
   */
  matchResult: GameOver | null;
}

export function useScreenPhase(state: GameViewModel): UseScreenPhase {
  const [intent, setIntent] = useState<LocalIntent>("idle");

  // GameOver をローカルへ焼き付ける（＝この接続の試合はもう終わり、という封印）。
  // 解除は再マッチング／タイトルへ の明示操作だけ。
  const [matchResult, setMatchResult] = useState<GameOver | null>(null);
  useEffect(() => {
    if (state.gameOver) setMatchResult(state.gameOver);
  }, [state.gameOver]);
  const sealed = matchResult !== null;

  // 新しい試合が始まったら（matchId 出現）リザルト解除意図をリセットする。
  // 封印中（自分の試合は終了済み）は戻さない。放置中にサーバーが次の試合へ入れてきても、
  // 画面が勝手に試合中へ切り替わらないようにするための歯止め。
  useEffect(() => {
    if (state.matchId && !state.gameOver && !sealed) {
      setIntent("idle");
    }
  }, [state.matchId, state.gameOver, sealed]);

  // 開始カウントダウンのゲート。MatchStart(matchId 出現)を検出したら
  // START_COUNTDOWN_MS の間だけ matchmaking 画面に留め、経過後に inMatch へ進める。
  const [startGate, setStartGate] = useState<{
    matchId: string;
    deadline: number;
  } | null>(null);
  // 同一 matchId に対してゲートを一度だけ張るための記録（カウントダウン終了後に再突入しない）。
  const gatedMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.matchId && !state.gameOver && !sealed) {
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
  }, [state.matchId, state.gameOver, sealed]);

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
    !state.gameOver &&
    !sealed;

  // 封印中は観戦に固定する（サーバーが次の試合を始めても試合中へ戻さない）。
  // それ以外はゲート中ならマッチング画面、通常はフェーズ導出。
  const phase: ScreenPhase = gateActive
    ? "matchmaking"
    : sealed && intent === "idle"
      ? "spectating"
      : deriveScreenPhase(state, intent);
  const startCountdownDeadlineMs = gateActive ? startGate!.deadline : null;

  // 封印の解除。次の試合へ進む／タイトルへ戻る のどちらも、まずリザルトを捨てる。
  const unseal = useCallback(() => setMatchResult(null), []);

  const actions = useMemo<ScreenActions>(
    () => ({
      seekMatch: () => {
        unseal();
        setIntent("seeking");
      },
      backToTitle: () => {
        unseal();
        setIntent("dismissedResult");
      },
      leaveMatchmaking: () => {
        unseal();
        setIntent("idle");
      },
      rematch: () => {
        unseal();
        setIntent("seeking");
      },
    }),
    [unseal],
  );

  return {
    phase,
    inputActive: isInputActive(phase),
    actions,
    startCountdownDeadlineMs,
    matchResult,
  };
}
