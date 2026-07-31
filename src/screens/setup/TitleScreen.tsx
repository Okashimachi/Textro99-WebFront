// タイトル画面。ゲーム開始への入口だけを持つ（接続はまだしない）。
//
// 入口は2つ:
//   - プレイする  … 実運用フロー。名前入力 → クイックマッチ（サーバー）へ直行する。
//   - テスト用    … 従来の開発用フロー。モード選択（オンライン/練習）を挟む。
interface Props {
  /** 実運用フロー（名前入力 → クイックマッチ）へ進む。 */
  onPlay: () => void;
  /** 開発用フロー（モード選択）へ進む。 */
  onTest: () => void;
}

export function TitleScreen({ onPlay, onTest }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 py-20">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-red-600">テキストロ99</h1>
        <p className="mt-2 text-zinc-500">99人バトルロイヤル・タイピング</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onPlay}
          className="border border-red-700 bg-red-600 px-10 py-4 text-lg font-bold text-white hover:bg-red-700"
        >
          プレイする
        </button>
        <button
          onClick={onTest}
          className="border border-zinc-300 bg-white px-10 py-2.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
        >
          テスト用
        </button>
      </div>
    </div>
  );
}
