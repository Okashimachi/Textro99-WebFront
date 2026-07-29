// 名前入力画面。決定: 名前はサーバーに送る想定（名前対応）。
// 現状サーバーは名前を受け取る C2S を持たない（p-NN 付与）ため、ここでは
// プロフィールに保存して自分の画面に表示する。サーバー送信は join 時の継ぎ目（App）で対応。
import { useState } from "react";

interface Props {
  initialName: string;
  /** 開始ラベル（オンライン=対戦開始 / 練習=練習開始 など）。 */
  actionLabel: string;
  onSubmit: (name: string) => void;
  onBack: () => void;
}

const MAX = 16;

export function NameEntryScreen({ initialName, actionLabel, onSubmit, onBack }: Props) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const canStart = trimmed.length > 0;

  return (
    <form
      className="mx-auto flex max-w-md flex-col gap-4 py-16"
      onSubmit={(e) => {
        e.preventDefault();
        if (canStart) onSubmit(trimmed.slice(0, MAX));
      }}
    >
      <h2 className="text-center text-xl font-bold">プレイヤー名</h2>

      <input
        autoFocus
        value={name}
        maxLength={MAX}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前を入力"
        className="border border-line bg-panel px-4 py-3 text-lg outline-none focus:border-accent"
      />
      <div className="text-right text-xs text-sub">
        {trimmed.length}/{MAX}
      </div>

      <button
        type="submit"
        disabled={!canStart}
        className="border border-accent-dark bg-accent px-6 py-3 font-bold text-white enabled:hover:bg-accent-dark disabled:opacity-40"
      >
        {actionLabel}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-sub hover:text-ink"
      >
        ← 戻る
      </button>
    </form>
  );
}
