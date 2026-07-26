// ============================================================================
// ViewModel — サーバー state のミラー（single source of truth）
//
// 描画は必ずこの ViewModel 経由（docs/rules/01 §3）。
// **戦闘数値はここで算出しない**。サーバーの S2C をそのまま写すだけ。
// 楽観的更新で戦闘値を先取りしない。
// ============================================================================

import type {
  DakenInstance,
  GameParametersPublicSubset,
  MatchId,
  PlayerId,
  PlayerSummary,
} from "@/proto/types";

/** グリッド表示用にサーバー由来の値だけを持つプレイヤー行。 */
export interface PlayerView extends PlayerSummary {
  // PlayerListDelta の量子化スタック比（count/limit の段階）。Delta 受信時のみ更新。
  stackRatio?: number;
}

/** 進行中の被弾予告（AttackIncoming）。OffsetResolved で除去する。 */
export interface IncomingAttack {
  warningId: string;
  attackerId: PlayerId;
  power: number;
  graceMs: number;
  receivedAtMs: number; // クライアント受信時刻（表示カウントダウンの基準・表示専用）
}

export type GameEventKind =
  | "Welcome"
  | "Ko"
  | "AttackFailed"
  | "OffsetResolved"
  | "GameOver";

/** EventLog 表示用の直近イベント（サーバー通知を写しただけ・派生計算なし）。 */
export interface GameEvent {
  id: number;
  kind: GameEventKind;
  atMs: number;
  message: string;
}

export interface ComboState {
  value: number;
  lastDelta: number;
  lastReason: string | null;
}

export interface DifficultyState {
  globalLevel: number;
  personalLevel: number;
  effectiveLevel: number;
}

export interface DakenStackState {
  count: number;
  limit: number;
  trapPending: boolean;
}

export interface GameViewModel {
  // 接続・自己同定
  selfPlayerId: PlayerId | null;
  matchId: MatchId | null;
  parameters: GameParametersPublicSubset | null;

  // プレイヤー一覧
  players: PlayerView[];
  aliveCount: number;

  // 出題ダケン（表示対象）
  activeDaken: DakenInstance[];

  // 戦闘表示値（すべてサーバー由来）
  combo: ComboState;
  difficulty: DifficultyState;
  dakenStack: DakenStackState;

  // 被弾予告
  incomingAttacks: IncomingAttack[];

  // マッチング / リザルト
  matchmaking: import("@/proto/types").MatchmakingStatus | null;
  // MatchmakingStatus の受信時刻（カウントダウン残時間の表示基準・表示専用）
  matchmakingReceivedAtMs: number | null;
  gameOver: import("@/proto/types").GameOver | null;

  // 直近イベント（新しいものが先頭）
  events: GameEvent[];
  // イベント採番用の単調カウンタ（React key の安定化用・純粋な reducer を保つ）
  eventSeq: number;
}

export const MAX_EVENTS = 50;

export function createInitialViewModel(): GameViewModel {
  return {
    selfPlayerId: null,
    matchId: null,
    parameters: null,
    players: [],
    aliveCount: 0,
    activeDaken: [],
    combo: { value: 0, lastDelta: 0, lastReason: null },
    difficulty: { globalLevel: 0, personalLevel: 0, effectiveLevel: 0 },
    dakenStack: { count: 0, limit: 0, trapPending: false },
    incomingAttacks: [],
    matchmaking: null,
    matchmakingReceivedAtMs: null,
    gameOver: null,
    events: [],
    eventSeq: 0,
  };
}
