// ============================================================================
// VENDORED FILE — 手コピー（改変禁止）
//
//   取得元 : Textro99-Proto / ts/types.ts
//   版     : v0.1.0 (commit f47fcf5)
//   取得日 : 2026-07-23
//
// このファイルは Textro99-Proto の写しです。契約の正典は Proto 側であり、
// **このリポジトリでは内容を編集しません**（docs/rules/01-責務と絶対原則.md）。
// proto を更新したら src/proto/README.md の手順に従って丸ごと同期し、版を更新すること。
// ============================================================================

// textro99 WebSocket 契約（メッセージDTO）の TypeScript ミラー。
//
// これは proto/messages.go（Go 正典）の手ミラー。3言語のどれか1つを変えたら
// 3言語すべてを同じ変更で揃える（AGENTS §2）。json は camelCase（TSはネイティブ）。
// 判定の権威は常にサーバー側。クライアントは打鍵判定と表示のみ（プロトコル仕様 0章）。
//
// 正典ドキュメント: Textro99-Docs/02_共通仕様/01_プロトコル仕様.md

// ── 共通型 ────────────────────────────────────────────────

export type PlayerId = string;
export type MatchId = string;
export type DakenId = string; // サーバー発行の一意ID
export type WarningId = string; // 攻撃予告（AttackIncoming）の一意ID

export type DakenType = "Normal" | "EnemySent" | "Trap";

export interface DakenInstance {
  dakenId: DakenId;
  type: DakenType;
  text: string; // 表示・打鍵対象の文字列
  difficultyLevel: number; // 実効難易度段階（0〜10）
  timeLimitMs: number; // このダケン固有の制限時間
  issuedAtServerTimeMs: number; // サーバー基準の発行時刻（試合開始起点の単調ms）
}

export interface PlayerSummary {
  playerId: PlayerId;
  displayName: string;
  comboValue: number;
  dakenStackCount: number;
  dakenStackLimit: number;
  badgeCount: number;
  alive: boolean;
}

// GameParameters の唯一の on-wire 契約（公開サブセット）。
// フルスキーマ（威力係数など内部通貨）はサーバー内部にのみ持つ（AGENTS §4）。
export interface GameParametersPublicSubset {
  stackLimit: number; // stack.limit（X/20 表示用）
  trapTriggerInterval: number; // stack.trapTriggerInterval
  personalDifficultyStep: number; // combo.personalDifficultyStep
  difficultyMaxLevel: number; // difficulty.maxLevel
}

// ── メッセージ封筒 ────────────────────────────────────────
// WS 上は { type: "<MessageName>", payload: {...} } で送受信する。

export interface Envelope {
  type: MessageType;
  payload: unknown;
}

// メッセージ種別タグ（Envelope.type に入る値）。
export const MessageType = {
  // C2S
  DakenClearReport: "DakenClearReport",
  AttackRequest: "AttackRequest",
  StrategySelect: "StrategySelect",
  MatchmakingJoin: "MatchmakingJoin",
  MatchmakingLeave: "MatchmakingLeave",
  // S2C
  Welcome: "Welcome",
  MatchStart: "MatchStart",
  DakenIssued: "DakenIssued",
  DakenExpired: "DakenExpired",
  ComboUpdated: "ComboUpdated",
  DifficultyUpdated: "DifficultyUpdated",
  AttackIncoming: "AttackIncoming",
  AttackFailed: "AttackFailed",
  OffsetResolved: "OffsetResolved",
  DakenStackUpdated: "DakenStackUpdated",
  KoNotified: "KoNotified",
  PlayerListUpdated: "PlayerListUpdated",
  PlayerListDelta: "PlayerListDelta",
  GameOver: "GameOver",
  MatchmakingStatus: "MatchmakingStatus",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

// ── C2S メッセージ ───────────────────────────────────────
// 送らないもの：ダケン時間切れ報告・脱落報告（サーバー自律確定。0章3-4）。

// 正典は missCount。isMiss は missCount>0 の冗長フィールド（将来削除候補）。
export interface DakenClearReport {
  dakenId: DakenId;
  isMiss: boolean;
  missCount: number;
  elapsedMs: number; // 主に表示・統計用
}

// consumedCombo は将来の部分消費UI用。現状サーバーは無視し全消費（Enter=全消費）。
export interface AttackRequest {
  consumedCombo: number;
}

// strategyId は 0-9。未選択時の既定は 4（ランダム）。
export interface StrategySelect {
  strategyId: number;
}

export type MatchmakingJoin = Record<string, never>;
export type MatchmakingLeave = Record<string, never>;

// ── S2C メッセージ ───────────────────────────────────────

// 接続確立直後に本人へ1回。MatchStart より前に自分のIDを確定させる。
export interface Welcome {
  playerId: PlayerId;
}

export interface MatchStart {
  matchId: MatchId;
  selfPlayerId: PlayerId; // players[] の中で自分がどれか
  players: PlayerSummary[];
  initialDaken: DakenInstance;
  parameters: GameParametersPublicSubset;
}

// 1回の被弾で複数ダケンを一括送出するため配列。
export interface DakenIssued {
  daken: DakenInstance[];
}

export interface DakenExpired {
  dakenId: DakenId;
}

export type ComboReason = "Clear" | "Miss" | "Consumed";

export interface ComboUpdated {
  comboValue: number;
  delta: number;
  reason: ComboReason;
}

export interface DifficultyUpdated {
  globalLevel: number;
  personalLevel: number;
  effectiveLevel: number; // min(global+personal, maxLevel)
}

// power は威力単位（内部通貨）。着弾ダケン個数への変換は着弾時。
export interface AttackIncoming {
  warningId: WarningId;
  attackerId: PlayerId;
  power: number;
  graceMs: number;
}

export type AttackFailReason = "NoTarget" | "NoCombo";

// コンボは消費されない旨のフィードバック。
export interface AttackFailed {
  reason: AttackFailReason;
}

// offsetAmount は威力単位、remainderDakenCount は変換後の着弾個数。
// 撃ち返しが成立した場合のみ counterAttackWarningId で新規予告を紐付ける（不成立なら省略）。
export interface OffsetResolved {
  warningId: WarningId;
  offsetAmount: number;
  remainderDakenCount: number;
  counterAttackWarningId?: WarningId;
}

export interface DakenStackUpdated {
  count: number;
  limit: number;
  trapPending: boolean; // トラップ誘発待ちの有無
}

// attackerId が null の脱落は自滅（KO実行者なし）。その場合 badgesTransferred=0。
// null は明示送出する（キー省略ではない）。
export interface KoNotified {
  attackerId: PlayerId | null;
  victimId: PlayerId;
  badgesTransferred: number;
}

// フルスナップ。帯域が重い（O(N^2)）ため低頻度スナップ用。高頻度更新は PlayerListDelta（3.1）。
export interface PlayerListUpdated {
  players: PlayerSummary[];
  aliveCount: number;
}

// 前回から変化したフィールドのみ。undefined は変化なし。
// displayName は MatchStart で初回配布済みのため差分には含めない。
export interface PlayerDelta {
  playerId: PlayerId;
  stackRatio?: number; // count/limit の量子化段階
  badgeCount?: number;
  alive?: boolean;
}

// 帯域対策版。変化プレイヤーのみを送る（3.1）。
export interface PlayerListDelta {
  changed: PlayerDelta[];
  aliveCount: number;
}

export interface TypingStats {
  totalDakenCleared: number;
  totalMiss: number;
  maxCombo: number;
  elapsedMs: number;
}

// rank==1 で優勝、それ以外は脱落。自分の脱落時にも配信される。
export interface GameOver {
  rank: number;
  koCount: number;
  finalBadgeCount: number;
  typingStats: TypingStats;
}

// countdownMs はカウントダウン中のみ（Waiting 中は省略）。
export interface MatchmakingStatus {
  waitingCount: number;
  minPlayers: number;
  countdownMs?: number;
}
