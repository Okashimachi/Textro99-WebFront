// ============================================================================
// X ポストの文面定義（フロントでハードコード）
//
// **文面を変えたいときはこのファイルだけを編集する。** 他のファイルを触る必要はない。
// 組み立ての配線は shareText.ts、X への遷移は xIntent.ts が持つ。
//
// 使える値は「サーバーが確定した戦績」だけ（docs/rules/01 §1,§3）。ここで順位を数え直す・
// 勝敗を判定し直す等はしない。文字列に整形するだけに留めること。
// ============================================================================
import type { GameOver } from "@/proto/types";

/** ハッシュタグ。複数付けたい場合は半角スペース区切りで並べる。 */
export const HASHTAG = "#テキストロ99 #demo_stage_summer";

/** ゲーム表示名。テーマ変更時はここだけ差し替える（コード上の名称は変えない）。 */
export const GAME_LABEL = "テキストロ99";

/**
 * 文面に載せる値。GameOver から取り出した確定値だけを持つ。
 * 項目を増やしたいときは shareText.ts の呼び出し側で詰めてから、下のテンプレで使う。
 */
export interface PostValues {
  /** 最終順位。1 が優勝。 */
  rank: number;
  /** トドメを刺した人数。 */
  koCount: number;
  /** 最大コンボ。 */
  maxCombo: number;
}

/** GameOver から文面用の値を取り出す。 */
export function toPostValues(result: GameOver): PostValues {
  return {
    rank: result.rank,
    koCount: result.koCount,
    maxCombo: result.typingStats.maxCombo,
  };
}

/**
 * 投稿本文を組み立てる（URL は含めない。intent の url パラメータで別に付く）。
 *
 * 出力例:
 *   優勝時                              それ以外
 *   ─────────────────────────────────   ─────────────────────────────────
 *   👑 テキストロ99 で優勝しました！      テキストロ99 で 42位 でした
 *   撃破 8人 / 最大コンボ 45             撃破 2人 / 最大コンボ 18
 *   (空行)                              (空行)
 *   #テキストロ99                        #テキストロ99
 */
export function formatPostText(v: PostValues): string {
  const headline =
    v.rank === 1
      ? `👑 ${GAME_LABEL} で優勝しました！`
      : `${GAME_LABEL} で ${v.rank}位 でした`;

  const stats = `撃破 ${v.koCount}人 / 最大コンボ ${v.maxCombo}`;

  return [headline, stats, "", HASHTAG].join("\n");
}
