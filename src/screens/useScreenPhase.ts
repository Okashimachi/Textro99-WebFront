// 画面フェーズと画面遷移アクションを提供するフック。
// フェーズ導出はサーバー state ベース。ローカル意図（参加表明/リザルト解除）だけを保持する。
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameOver } from "@/proto/types";
import type { GameViewModel } from "@/state";
import {
  deriveScreenPhase,
  isInputActive,
  type LocalIntent,
  type ScreenPhase,
} from "./lifecycle";

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

  // 封印中は観戦に固定する（サーバーが次の試合を始めても試合中へ戻さない）。
  // それ以外は素直にフェーズ導出。MatchStart を受けたらそのまま試合へ入る
  // （フロント側で開始を遅らせるゲートは持たない）。
  const phase: ScreenPhase =
    sealed && intent === "idle"
      ? "spectating"
      : deriveScreenPhase(state, intent);

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
    matchResult,
  };
}
