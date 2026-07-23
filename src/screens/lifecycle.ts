// ============================================================================
// 画面ライフサイクル状態機械
//
// タイトル → マッチング待機 → 試合中 → 観戦 → リザルト の共通ステートマシン。
// 画面フェーズは基本的に **サーバー state（ViewModel）から導出** する（描画は受信 state 経由）。
// ローカル意図（タイトルから待機へ進む / リザルトからタイトルへ戻る）だけを併用する。
//
// 観戦は「試合中だが自分が脱落 → 自操作無効化」として表す（暫定・Issue #9）。
// ============================================================================

import type { GameViewModel } from "@/state";

export type ScreenPhase =
  | "title"
  | "matchmaking"
  | "inMatch"
  | "spectating"
  | "result";

/** タイトル/待機の分岐に使うローカル意図。サーバー state では表せない部分だけを持つ。 */
export type LocalIntent =
  | "idle" // タイトルに留まる
  | "seeking" // マッチング参加を表明済み（待機画面へ）
  | "dismissedResult"; // リザルトを閉じてタイトルへ戻った

/** self プレイヤーが生存しているか。未参加・不明時は true（試合前は観戦扱いにしない）。 */
export function isSelfAlive(state: GameViewModel): boolean {
  if (!state.selfPlayerId) return true;
  const self = state.players.find((p) => p.playerId === state.selfPlayerId);
  return self ? self.alive : true;
}

/**
 * ViewModel とローカル意図から現在の画面フェーズを導出する純関数。
 * 優先順位: リザルト > 試合中/観戦 > 待機 > タイトル。
 */
export function deriveScreenPhase(
  state: GameViewModel,
  intent: LocalIntent,
): ScreenPhase {
  // リザルト：GameOver 受信後、ユーザーが操作するまで表示。
  // 再マッチング(seeking)・タイトルへ(dismissedResult) を選ぶと、GameOver が残っていても離脱する。
  if (state.gameOver && intent === "idle") {
    return "result";
  }
  // 試合中：MatchStart 済み（matchId 有り）かつ GameOver 前。
  if (state.matchId && !state.gameOver) {
    return isSelfAlive(state) ? "inMatch" : "spectating";
  }
  // 待機：マッチング状態を受信中、または参加表明済み。
  if (state.matchmaking || intent === "seeking") {
    return "matchmaking";
  }
  return "title";
}

/** そのフェーズで自分の操作（打鍵/攻撃/戦略選択）が有効か。観戦・非対戦画面では無効。 */
export function isInputActive(phase: ScreenPhase): boolean {
  return phase === "inMatch";
}
