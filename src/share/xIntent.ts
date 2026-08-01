// X（旧Twitter）への共有。Web Intent 方式。
//
// 投稿そのものは X の投稿画面（intent）上でユーザーが確定する。つまりこのモジュールが行くのは
// 「ポストする直前」までで、ここから先はユーザーの操作。
// クライアントから X API を叩くことはしない（API はトークンが要るためサーバー側の仕事。
// フロントに置くと秘密情報がバンドルに載る → rules/02 §4）。
import type { ShareText } from "./shareText";

const INTENT_ENDPOINT = "https://x.com/intent/post";

/** 共有内容から X の投稿画面URLを組み立てる。 */
export function buildXIntentUrl({ text, url }: ShareText): string {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  return `${INTENT_ENDPOINT}?${params.toString()}`;
}

/** X の投稿画面を別タブで開く。開くだけで、投稿は確定しない。 */
export function openXIntent(share: ShareText): void {
  window.open(buildXIntentUrl(share), "_blank", "noopener,noreferrer");
}
