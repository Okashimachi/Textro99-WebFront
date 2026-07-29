// NextQueue — これから出るお題（NEXT）を「下から積み上がる」形で見せるパネル。
// 主ディスプレイの右に置き、次に何が来るかを先読みできるようにする。
//
// 表示方針:
//   ・下端が「次のお題」。上へ行くほど遠い（＝主ディスプレイに近い側が直近）。
//   ・近いものほど大きく・濃く。遠いものは小さく淡く。
// 入力は DakenInstance[] のみ。並べ替え以外の判定・算出はしない（docs/rules/01 §3）。
import type { DakenInstance } from "@/proto/types";
import { romajiHint } from "@/typing/romaji";
import { Panel } from "./Panel";

interface Props {
  /** 現在のお題を含む出題列（先頭＝現在）。 */
  activeDaken: DakenInstance[];
  /** 何件先まで見せるか（既定 5）。 */
  limit?: number;
}

const TYPE_LABEL: Record<DakenInstance["type"], string> = {
  Normal: "通常",
  EnemySent: "被弾",
  Trap: "トラップ",
};

const TYPE_CHIP: Record<DakenInstance["type"], string> = {
  Normal: "border-sky-400 bg-sky-50 text-sky-700",
  EnemySent: "border-amber-500 bg-amber-50 text-amber-700",
  Trap: "border-red-500 bg-red-50 text-red-700",
};

// 近さ（下から数えた位置）ごとの見た目。0 = 次のお題。
const NEARNESS = [
  "border-zinc-400 bg-white text-2xl",
  "border-zinc-300 bg-white text-xl",
  "border-zinc-300 bg-zinc-50 text-lg",
  "border-zinc-200 bg-zinc-50 text-base",
  "border-zinc-200 bg-zinc-50 text-sm",
];

export function NextQueue({ activeDaken, limit = 5 }: Props) {
  // 先頭（現在のお題）は主ディスプレイ側で出すので除く。
  const upcoming = activeDaken.slice(1, 1 + limit);

  return (
    <Panel
      label="NEXT — 次のお題"
      tone="info"
      right={`${upcoming.length} 件`}
      className="h-full"
      bodyClassName="p-2 flex flex-col justify-end gap-1"
    >
      {upcoming.length === 0 ? (
        <div className="my-auto border border-dashed border-zinc-300 px-2 py-6 text-center text-[11px] text-zinc-400">
          次のお題を待っています
        </div>
      ) : (
        // 遠い順に上から並べる＝下端が「次」。
        upcoming
          .slice()
          .reverse()
          .map((d, revIdx) => {
            const nearness = upcoming.length - 1 - revIdx; // 0 が最も近い
            const look = NEARNESS[Math.min(nearness, NEARNESS.length - 1)];
            return (
              <div
                key={d.dakenId}
                className={`animate-queue-in border px-3 py-2 ${look} ${
                  nearness === 0 ? "" : "opacity-80"
                }`}
              >
                <div className="mb-0.5 flex items-center gap-1.5 text-[10px]">
                  <span
                    className={`border px-1 font-bold ${TYPE_CHIP[d.type]}`}
                  >
                    {TYPE_LABEL[d.type]}
                  </span>
                  <span className="text-zinc-400 tabular-nums">Lv{d.difficultyLevel}</span>
                  {nearness === 0 && (
                    <span className="ml-auto border border-sky-500 bg-sky-500 px-1 font-bold text-white">
                      NEXT
                    </span>
                  )}
                </div>
                <div className="truncate font-black leading-tight text-zinc-900">
                  {d.text}
                </div>
                <div className="truncate font-mono text-[11px] tracking-widest text-zinc-400">
                  {romajiHint(d.text)}
                </div>
              </div>
            );
          })
      )}
    </Panel>
  );
}
