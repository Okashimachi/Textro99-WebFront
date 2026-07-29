// 被弾スタックの溜まり具合を表示用の3段階に落とす（しきい値による色分けのみ）。
//
// NEXT パネルの地色と、画面全体の警告フラッシュで**同じ基準**を使うためにここへ切り出す。
// 戦闘判定ではない（脱落の確定はサーバー権威 / docs/rules/01 §3）。
import type { DakenStackState } from "@/state";

export type StackLevel = "safe" | "warn" | "danger";

export const STACK_WARN_RATIO = 0.6;
export const STACK_DANGER_RATIO = 0.85;

export function stackRatio(stack: DakenStackState): number {
  return stack.limit > 0 ? Math.min(1, stack.count / stack.limit) : 0;
}

export function stackLevel(stack: DakenStackState): StackLevel {
  const r = stackRatio(stack);
  if (r >= STACK_DANGER_RATIO) return "danger";
  if (r >= STACK_WARN_RATIO) return "warn";
  return "safe";
}
