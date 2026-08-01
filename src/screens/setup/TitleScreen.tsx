// タイトル画面。ゲーム開始への入口だけを持つ（接続はまだしない）。
//
// 入口:
//   - プレイする  … 実運用フロー。名前入力 → クイックマッチ（サーバー）へ直行する。
//   - テスト用    … 開発用フロー（モード選択）。**通常は非表示**。onTest が渡された
//                   ときだけボタンを出す（App 側で URL の ?test=1 のときのみ渡す）。
import { DOCS_URL } from "@/links";

interface Props {
  /** 実運用フロー（名前入力 → クイックマッチ）へ進む。 */
  onPlay: () => void;
  /** 開発用フロー（モード選択）へ進む。未指定ならテスト用ボタンを出さない。 */
  onTest?: () => void;
}

export function TitleScreen({ onPlay, onTest }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <img src="/TEXTRO99-Icon.png" alt="テキストロ99" className="h-60 w-60" />

      <div className="w-full text-center">
        <h1 className="text-8xl font-black tracking-tight text-red-600">テキストロ99</h1>
        <p className="mt-2 text-zinc-500">99人バトルロイヤル・タイピング</p>
      </div>

      <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onPlay}
          className="border border-red-700 bg-red-600 px-10 py-4 text-lg font-bold text-white hover:bg-red-700"
        >
          プレイする
        </button>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-zinc-200 bg-transparent px-6 py-1.5 text-center text-xs text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
        >
          説明ページ
        </a>
        {onTest && (
          <button
            onClick={onTest}
            className="border border-zinc-300 bg-white px-10 py-2.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
          >
            テスト用
          </button>
        )}
      </div>
    </div>
  );
}
