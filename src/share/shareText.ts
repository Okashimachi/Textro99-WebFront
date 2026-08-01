// リザルトの共有テキストの組み立て（配線のみ）。
//
// **文面そのものは postFormat.ts に切り出してある。** 文言・並び・ハッシュタグを変えたい
// ときはそちらだけを編集する。このファイルは GameOver → ShareText の受け渡しを担う。
//
// 責務の注意（docs/rules/01 §1,§3）: 受信済みの確定値を文字列に整形するだけ。
// 順位・撃破数を数え直したり、勝敗を判定したりしない。
import type { GameOver } from "@/proto/types";
import { formatPostText, toPostValues } from "./postFormat";

/** X に渡す共有内容。text と url は分離して持つ（intent の仕様に合わせる）。 */
export interface ShareText {
  /** 投稿本文（ハッシュタグ込み・URL は含めない）。 */
  text: string;
  /** 本文の末尾に付くリンク。未設定なら空文字。 */
  url: string;
}

/** リザルト（GameOver）から X の共有内容を作る。 */
export function buildShareText(result: GameOver): ShareText {
  return {
    text: formatPostText(toPostValues(result)),
    // 共有先URLはコードに直書きせず環境変数で切り替える（rules/02 §4）。
    url: import.meta.env.VITE_SHARE_URL ?? "",
  };
}
