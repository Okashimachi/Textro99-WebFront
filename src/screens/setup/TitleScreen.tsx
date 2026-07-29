// タイトル画面。ゲーム開始への入口だけを持つ（接続はまだしない）。
interface Props {
  onStart: () => void;
}

export function TitleScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 py-20">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-red-600">テキストロ99</h1>
        <p className="mt-2 text-zinc-500">99人バトルロイヤル・タイピング</p>
      </div>
      <button
        onClick={onStart}
        className="border border-red-700 bg-red-600 px-10 py-3 text-lg font-bold text-white hover:bg-red-700"
      >
        はじめる
      </button>
    </div>
  );
}
