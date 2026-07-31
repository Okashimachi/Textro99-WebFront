// ============================================================================
// 画面ライフサイクル状態機械
//
// タイトル → マッチング待機 → 試合中 → 観戦 の共通ステートマシン。
// 画面フェーズは基本的に **サーバー state（ViewModel）から導出** する（描画は受信 state 経由）。
// ローカル意図（タイトルから待機へ進む / リザルトを閉じてタイトルへ戻る）だけを併用する。
//
// 観戦は「試合中だが自分は打てない → 自操作無効化」として表す（暫定・Issue #9）。
// 自分の脱落だけでなく **自分の GameOver 受信後（リザルト表示中）** も観戦に含める。
// リザルトは画面フェーズではなく観戦画面の上のモーダルとして重ねる（log-021）。
// こうすることで、リザルトを見ている間もランキング・敵の状況のブロードキャストが
// そのまま画面に反映され続ける。
// ============================================================================

import type { GameViewModel } from "@/state";

export type ScreenPhase = "title" | "matchmaking" | "inMatch" | "spectating";

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
 * 優先順位: 離脱意図 > 試合中/観戦 > 待機 > タイトル。
 *
 * GameOver を受け取っても画面は観戦に留まる（リザルトはモーダルで重ねる）。
 * リザルトを閉じてタイトルへ戻る(dismissedResult)・再マッチング(seeking)を選んだときだけ離脱する。
 */
export function deriveScreenPhase(
  state: GameViewModel,
  intent: LocalIntent,
): ScreenPhase {
  // 離脱意図が立っていれば、GameOver / matchId が残っていても試合画面へは戻さない。
  if (intent === "dismissedResult") {
    return "title";
  }
  // 試合中／観戦：MatchStart 済み（matchId 有り）。
  // 自分が脱落済み、または GameOver 受信済みなら観戦（自操作は無効）。
  if (state.matchId && intent !== "seeking") {
    return isSelfAlive(state) && !state.gameOver ? "inMatch" : "spectating";
  }
  // 待機：ユーザーが参加表明中のみ。離脱(idle)でタイトルへ戻る。
  // サーバーの MatchmakingStatus 値は seeking 中に画面へ反映する。
  if (intent === "seeking") {
    return "matchmaking";
  }
  return "title";
}

/** そのフェーズで自分の操作（打鍵/攻撃/戦略選択）が有効か。観戦・非対戦画面では無効。 */
export function isInputActive(phase: ScreenPhase): boolean {
  return phase === "inMatch";
}
