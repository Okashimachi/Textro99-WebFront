// 決着画面の操作ブロック。戦績（ResultBoard）とは別のグリッドに置き、
// 「読むところ」と「押すところ」を見た目から分ける。
//
// 試合が完全に終わった後にタイトルへ戻るかどうかはプレイヤーの操作に委ねる
// （自動遷移や猶予時間は設けない。タイトルへ戻る操作は下のボタンのみ）。
import { openXIntent, type ShareText } from "@/share";

interface Props {
  /** X 共有の内容（現状はモック生成。将来はサーバー配信）。 */
  share: ShareText;
  onRematch: () => void;
  onBackToTitle: () => void;
  className?: string;
}

export function ResultActions({
  share,
  onRematch,
  onBackToTitle,
  className = "",
}: Props) {
  return (
    // 戦績パネル（白地・細枠）と差をつけるため、操作は暗い地の帯にまとめる。
    <section className={`border-2 border-zinc-900 bg-zinc-900 p-3 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRematch}
          className="border-2 border-red-400 bg-red-600 px-4 py-4 text-xl font-black tracking-wide text-white shadow-lg transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          再マッチング
        </button>
        <button
          onClick={onBackToTitle}
          className="border-2 border-zinc-400 bg-white px-4 py-4 text-xl font-black tracking-wide text-zinc-900 transition hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          タイトルへ
        </button>
      </div>

      {/* 共有は主導線（再マッチング/タイトルへ）より弱く、右下に小さく置く。
          押すと X の投稿画面が別タブで開くだけで、投稿の確定はユーザーが行う。 */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => openXIntent(share)}
          title={share.text}
          className="flex items-center gap-2 border border-zinc-600 bg-black px-3 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <XLogo />
          結果をポスト
        </button>
      </div>
    </section>
  );
}

/** X のロゴ。 */
function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
