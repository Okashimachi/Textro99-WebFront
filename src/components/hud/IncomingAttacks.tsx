// ============================================================================
// IncomingAttacks — 被弾予告（AttackIncoming）のカウントダウン表示。
//
// サーバーは「誰から / 威力 / graceMs（着弾までの猶予）」を予告として送る。着弾自体は
// サーバーが grace 経過後に DakenIssued（insertIndex つき）／DakenStackUpdated で示すので、
// ここは**残り時間を見せるだけ**。相殺・撃ち返しの概念は廃止された（server #77）。
//
// 判定・着弾処理は一切しない（docs/rules/01 §1,§3）。期限切れの予告は表示から落とす。
// ============================================================================
import type { IncomingAttack, PlayerView } from "@/state";
import { Panel } from "./Panel";
import { useNow } from "./useNow";

interface Props {
  incomingAttacks: IncomingAttack[];
  /** 攻撃者の表示名を引くための一覧（サーバー由来）。 */
  players: PlayerView[];
  /** 表示する最大件数（既定 3）。 */
  limit?: number;
}

export function IncomingAttacks({ incomingAttacks, players, limit = 3 }: Props) {
  const now = useNow();

  // 猶予が切れたものは表示から落とす（消化を知らせる S2C は無い）。残り時間の短い順。
  const shown = incomingAttacks
    .map((a) => ({ attack: a, remainMs: a.receivedAtMs + a.graceMs - now }))
    .filter((x) => x.remainMs > 0)
    .sort((x, y) => x.remainMs - y.remainMs)
    .slice(0, limit);

  if (shown.length === 0) return null;

  return (
    <Panel
      label="被弾予告"
      tone="accent"
      right={`${shown.length}件`}
      bodyClassName="space-y-1 p-2"
    >
      {shown.map(({ attack, remainMs }) => {
        const ratio = Math.min(1, Math.max(0, remainMs / attack.graceMs));
        const urgent = remainMs <= 1000;
        return (
          <div
            key={attack.warningId}
            className={`border-2 px-2 py-1 ${
              urgent
                ? "animate-danger-pulse border-red-500 bg-red-100"
                : "border-amber-500 bg-amber-50"
            }`}
          >
            <div className="flex items-baseline gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate font-bold text-zinc-900">
                {displayNameOf(players, attack.attackerId)} から
              </span>
              <span className="shrink-0 font-black tabular-nums text-red-600">
                威力 {attack.power}
              </span>
              <span
                className={`shrink-0 font-black tabular-nums ${
                  urgent ? "text-red-600" : "text-amber-700"
                }`}
              >
                {(remainMs / 1000).toFixed(1)}秒
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-white">
              <div
                className={`h-full transition-[width] duration-100 ${
                  urgent ? "bg-red-500" : "bg-amber-400"
                }`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

/** playerId から表示名を引く（未知IDは ID をそのまま出す）。 */
function displayNameOf(players: PlayerView[], playerId: string): string {
  return players.find((p) => p.playerId === playerId)?.displayName ?? playerId;
}
