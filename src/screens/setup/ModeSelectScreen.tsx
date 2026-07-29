// モード選択画面。
// 決定: いまは「99人グローバルキュー（オンライン）」と「練習（フロント完結）」。
// 拡張の継ぎ目: 部屋制（作成/参加）はサーバー&Proto拡張後に有効化する。今は disabled で枠だけ置く。
export type PlayMode = "online" | "practice";

interface Props {
  onSelect: (mode: PlayMode) => void;
  onBack: () => void;
}

export function ModeSelectScreen({ onSelect, onBack }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 py-16">
      <h2 className="mb-2 text-center text-xl font-bold">モード選択</h2>

      <ModeButton
        title="オンライン対戦"
        desc="サーバーに接続して試合（クイックマッチ）"
        onClick={() => onSelect("online")}
      />
      <ModeButton
        title="練習（フロント完結）"
        desc="サーバー無しでタイピングを試す"
        onClick={() => onSelect("practice")}
      />
      <ModeButton
        title="部屋を作る / 参加する"
        desc="近日対応（サーバー拡張後）"
        disabled
      />

      <button onClick={onBack} className="mt-2 text-sm text-sub hover:text-ink">
        ← タイトルへ戻る
      </button>
    </div>
  );
}

function ModeButton({
  title,
  desc,
  onClick,
  disabled = false,
}: {
  title: string;
  desc: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border border-line bg-panel px-5 py-4 text-left enabled:hover:border-accent enabled:hover:bg-accent-soft disabled:opacity-40"
    >
      <div className="font-bold">
        {title}
        {disabled && (
          <span className="ml-2 border border-line bg-head px-1.5 py-0.5 text-[10px] text-sub">
            近日
          </span>
        )}
      </div>
      <div className="mt-0.5 text-sm text-sub">{desc}</div>
    </button>
  );
}
