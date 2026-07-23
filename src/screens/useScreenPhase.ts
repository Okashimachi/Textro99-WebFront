// 画面フェーズと画面遷移アクションを提供するフック。
// フェーズ導出はサーバー state ベース。ローカル意図（参加表明/リザルト解除）だけを保持する。
import { useEffect, useMemo, useState } from "react";
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
  /** リザルト → 再マッチング（待機へ）。 */
  rematch: () => void;
}

export interface UseScreenPhase {
  phase: ScreenPhase;
  inputActive: boolean;
  actions: ScreenActions;
}

export function useScreenPhase(state: GameViewModel): UseScreenPhase {
  const [intent, setIntent] = useState<LocalIntent>("idle");

  // 新しい試合が始まったら（matchId 出現）リザルト解除意図をリセットする。
  useEffect(() => {
    if (state.matchId && !state.gameOver) {
      setIntent("idle");
    }
  }, [state.matchId, state.gameOver]);

  const phase = deriveScreenPhase(state, intent);

  const actions = useMemo<ScreenActions>(
    () => ({
      seekMatch: () => setIntent("seeking"),
      backToTitle: () => setIntent("dismissedResult"),
      rematch: () => setIntent("seeking"),
    }),
    [],
  );

  return { phase, inputActive: isInputActive(phase), actions };
}
