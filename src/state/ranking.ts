// 試合中ランキングの算出（純関数）。
//
// 決定: 厳密なリアルタイム順位が理想。ただし現行プロトコルは順位を配信しないため、
// ここでは PlayerListUpdated/Delta が持つ値（生存・バッジ・コンボ）から**近似順位**を出す。
// 拡張の継ぎ目: サーバーが順位（rank）を配信するようになったら、この関数を
// 「サーバー順位をそのまま並べる」実装に差し替えるだけでよい（呼び出し側は変えない）。
import type { PlayerView } from "./viewModel";

export interface RankedPlayer {
  rank: number;
  player: PlayerView;
  isSelf: boolean;
}

/**
 * 生存者を上位、脱落者を下位に置き、生存者はバッジ数→コンボ→スタック少ない順で並べる（近似）。
 * 同値は playerId で安定ソート。
 */
export function deriveRanking(
  players: PlayerView[],
  selfPlayerId: string | null,
): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount;
    if (b.comboValue !== a.comboValue) return b.comboValue - a.comboValue;
    if (a.dakenStackCount !== b.dakenStackCount)
      return a.dakenStackCount - b.dakenStackCount;
    return a.playerId.localeCompare(b.playerId);
  });
  return sorted.map((player, i) => ({
    rank: i + 1,
    player,
    isSelf: player.playerId === selfPlayerId,
  }));
}
