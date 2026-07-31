// 試合中ランキングの並べ替え（純関数・表示専用）。
//
// 順位は **サーバー確定値**（PlayerSummary.rank / server #80）をそのまま使う。
// クライアントでの近似順位算出（旧 deriveRanking）は廃止した。ここは「サーバーが言った
// 順位で並べ直す」だけで、順位の決定に関与しない（docs/rules/01 §1,§3）。
import type { PlayerView } from "./viewModel";

export interface RankedPlayer {
  /** サーバー確定順位（1=首位）。0 は未確定。 */
  rank: number;
  player: PlayerView;
  isSelf: boolean;
}

/**
 * サーバー順位の昇順に並べる。rank=0（未確定）は末尾へ回し、同値は playerId で安定させる。
 */
export function sortByServerRank(
  players: PlayerView[],
  selfPlayerId: string | null,
): RankedPlayer[] {
  return [...players]
    .sort((a, b) => {
      // 0 は未確定なので最下位扱い。それ以外は数値の小さい方が上位。
      const ra = a.rank > 0 ? a.rank : Number.MAX_SAFE_INTEGER;
      const rb = b.rank > 0 ? b.rank : Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;
      return a.playerId.localeCompare(b.playerId);
    })
    .map((player) => ({
      rank: player.rank,
      player,
      isSelf: player.playerId === selfPlayerId,
    }));
}
