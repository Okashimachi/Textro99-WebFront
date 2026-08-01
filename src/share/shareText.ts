// リザルトの共有テキスト。
//
// ⚠️ ここは **モック（暫定）** である。
// 最終的に投稿テキストは **サーバーが生成して配信する**（GameOver か、その後続メッセージに
// 共有用の文面が乗る想定）。このモジュールはその差し替え地点を1か所に固定するために置いている。
//
// サーバー配信に切り替えるときの手順:
//   1. Proto 側で GameOver（等）に共有テキストのフィールドを追加（→ Proto の人間承認フロー。rules/01 §6）
//   2. buildShareTextMock() の呼び出しを、受信した値をそのまま ShareText に詰める処理へ置き換える
//   3. このファイルの文面組み立てを削除する（クライアントに文面を残さない）
//
// 責務の注意（rules/01 §1,§3）: ここは受信済みの確定値を**文字列に整形するだけ**。
// 順位・撃破数を数え直したり、勝敗を判定したりしない。
import type { GameOver } from "@/proto/types";

/** X に渡す共有内容。text と url は分離して持つ（intent の仕様に合わせる）。 */
export interface ShareText {
  /** 投稿本文（ハッシュタグ込み・URL は含めない）。 */
  text: string;
  /** 本文の末尾に付くリンク。未設定なら空文字。 */
  url: string;
}

/** ハッシュタグ。将来サーバー配信になれば文面ごと差し替わる。 */
const HASHTAG = "#テキストロ99";

/**
 * 共有テキストのモック生成。
 *
 * 出力例（優勝時 / それ以外）:
 *   👑 テキストロ99 で優勝しました！        テキストロ99 で 3位 でした
 *   撃破 12人 / 最大コンボ 47               撃破 12人 / 最大コンボ 47
 *                                           (空行)
 *   #テキストロ99                           #テキストロ99
 */
export function buildShareTextMock(result: GameOver): ShareText {
  const headline =
    result.rank === 1
      ? "👑 テキストロ99 で優勝しました！"
      : `テキストロ99 で ${result.rank}位 でした`;
  const stats = `撃破 ${result.koCount}人 / 最大コンボ ${result.typingStats.maxCombo}`;

  return {
    text: `${headline}\n${stats}\n\n${HASHTAG}`,
    // 共有先URLはコードに直書きせず環境変数で切り替える（rules/02 §4）。
    url: import.meta.env.VITE_SHARE_URL ?? "",
  };
}
