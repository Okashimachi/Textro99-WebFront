// ============================================================================
// reducer — S2C メッセージを ViewModel に畳み込む唯一の場所
//
// ここは「サーバーが言ったことを写す」だけ。派生計算・戦闘ロジックは書かない
// （docs/rules/01 §1,§3）。コンボ/スタック/難易度はサーバー値をそのまま格納する。
// ============================================================================

import {
  MessageType,
  type AttackIncoming,
  type ComboUpdated,
  type DakenExpired,
  type DakenIssued,
  type DakenStackUpdated,
  type DifficultyUpdated,
  type GameOver,
  type KoNotified,
  type MatchStart,
  type MatchmakingStatus,
  type PlayerId,
  type PlayerListDelta,
  type PlayerListUpdated,
  type Welcome,
} from "@/proto/types";
import {
  MAX_EVENTS,
  type GameEvent,
  type GameEventKind,
  type GameViewModel,
  type PlayerView,
} from "./viewModel";

/** reducer への入力。ディスパッチ層(#4)が受信した Envelope をそのまま渡す。 */
export interface S2CAction {
  type: MessageType;
  payload: unknown;
  /** クライアント受信時刻（表示専用。カウントダウン等の基準に使う）。 */
  receivedAtMs: number;
}

function pushEvent(
  state: GameViewModel,
  kind: GameEventKind,
  message: string,
  atMs: number,
): Pick<GameViewModel, "events" | "eventSeq"> {
  const event: GameEvent = { id: state.eventSeq, kind, atMs, message };
  return {
    events: [event, ...state.events].slice(0, MAX_EVENTS),
    eventSeq: state.eventSeq + 1,
  };
}

export function gameReducer(
  state: GameViewModel,
  action: S2CAction,
): GameViewModel {
  const { payload, receivedAtMs } = action;

  switch (action.type) {
    case MessageType.Welcome: {
      const p = payload as Welcome;
      return {
        ...state,
        selfPlayerId: p.playerId,
        ...pushEvent(state, "Welcome", `接続確立（自分: ${p.playerId}）`, receivedAtMs),
      };
    }

    case MessageType.MatchmakingStatus: {
      return {
        ...state,
        matchmaking: payload as MatchmakingStatus,
        matchmakingReceivedAtMs: receivedAtMs,
      };
    }

    case MessageType.MatchStart: {
      const p = payload as MatchStart;
      return {
        ...state,
        matchId: p.matchId,
        selfPlayerId: p.selfPlayerId,
        parameters: p.parameters,
        players: p.players.map((s) => ({ ...s }) as PlayerView),
        aliveCount: p.players.filter((s) => s.alive).length,
        activeDaken: [p.initialDaken],
        gameOver: null,
        matchmaking: null,
        // 試合ごとの値は MatchStart で初期化する。前の試合の値が残っていると、
        // 新しい試合の開始直後に前試合の被弾スタック（＝危険警告）やコンボが見えてしまう。
        // limit だけはサーバーの GameParameters をそのまま写す（クライアントで決めない）。
        dakenStack: { count: 0, limit: p.parameters.stackLimit, trapPending: false },
        combo: { value: 0, lastDelta: 0, lastReason: null },
        difficulty: { globalLevel: 0, personalLevel: 0, effectiveLevel: 0 },
        incomingAttacks: [],
      };
    }

    case MessageType.DakenIssued: {
      const p = payload as DakenIssued;
      // insertIndex はサーバー指定の挿入位置（被弾を列の途中へ割り込ませる用）。
      // 省略なら従来どおり末尾に積む。位置の決定はサーバー権威で、ここでは写すだけ。
      const next = [...state.activeDaken];
      const at =
        p.insertIndex === undefined
          ? next.length
          : Math.min(Math.max(p.insertIndex, 0), next.length);
      next.splice(at, 0, ...p.daken);
      return { ...state, activeDaken: next };
    }

    case MessageType.DakenExpired: {
      const p = payload as DakenExpired;
      return {
        ...state,
        activeDaken: state.activeDaken.filter((d) => d.dakenId !== p.dakenId),
      };
    }

    case MessageType.ComboUpdated: {
      const p = payload as ComboUpdated;
      return {
        ...state,
        combo: { value: p.comboValue, lastDelta: p.delta, lastReason: p.reason },
      };
    }

    case MessageType.DifficultyUpdated: {
      const p = payload as DifficultyUpdated;
      return {
        ...state,
        difficulty: {
          globalLevel: p.globalLevel,
          personalLevel: p.personalLevel,
          effectiveLevel: p.effectiveLevel,
        },
      };
    }

    case MessageType.DakenStackUpdated: {
      const p = payload as DakenStackUpdated;
      return {
        ...state,
        dakenStack: { count: p.count, limit: p.limit, trapPending: p.trapPending },
      };
    }

    case MessageType.AttackIncoming: {
      const p = payload as AttackIncoming;
      // 予告の消化を知らせる S2C は無い（着弾はサーバーが DakenIssued / DakenStackUpdated で示す）。
      // そのため grace 経過ぶんは表示側で落とす。ここでは配列が伸び続けないよう、
      // 新しい予告を積むついでに期限切れを掃除するだけ（表示専用・戦闘判定はしない）。
      return {
        ...state,
        incomingAttacks: [
          ...state.incomingAttacks.filter(
            (a) => a.receivedAtMs + a.graceMs > receivedAtMs,
          ),
          {
            warningId: p.warningId,
            attackerId: p.attackerId,
            power: p.power,
            graceMs: p.graceMs,
            receivedAtMs,
          },
        ],
      };
    }

    case MessageType.KoNotified: {
      const p = payload as KoNotified;
      // attackerId が null の脱落は自滅（KO実行者なし）。
      const victim = displayNameOf(state.players, p.victimId);
      const msg =
        p.attackerId === null
          ? `${victim} が自滅`
          : `${displayNameOf(state.players, p.attackerId)} が ${victim} を撃破（+${p.badgesTransferred}）`;
      // alive フラグは PlayerListUpdated/Delta が正典。ここではイベント記録のみ。
      return { ...state, ...pushEvent(state, "Ko", msg, receivedAtMs) };
    }

    case MessageType.PlayerListUpdated: {
      const p = payload as PlayerListUpdated;
      return {
        ...state,
        players: p.players.map((s) => ({ ...s }) as PlayerView),
        aliveCount: p.aliveCount,
      };
    }

    case MessageType.PlayerListDelta: {
      const p = payload as PlayerListDelta;
      return { ...state, ...applyPlayerDelta(state.players, p), aliveCount: p.aliveCount };
    }

    case MessageType.GameOver: {
      const p = payload as GameOver;
      return {
        ...state,
        gameOver: p,
        incomingAttacks: [],
        ...pushEvent(
          state,
          "GameOver",
          p.rank === 1 ? "優勝！" : `脱落（${p.rank}位）`,
          receivedAtMs,
        ),
      };
    }

    default:
      // 未対応 S2C（DifficultyUpdated 以外の将来型など）は state を変えない。
      return state;
  }
}

/** playerId から表示名を引く（未知IDは ID をそのまま出す）。表示専用。 */
function displayNameOf(players: PlayerView[], playerId: PlayerId): string {
  return players.find((p) => p.playerId === playerId)?.displayName ?? playerId;
}

/**
 * PlayerListDelta を既存 players に適用する差分マージ。
 * undefined のフィールドは「変化なし」。displayName は差分に含まれない（MatchStart 配布済み）。
 */
function applyPlayerDelta(
  players: PlayerView[],
  delta: PlayerListDelta,
): Pick<GameViewModel, "players"> {
  if (delta.changed.length === 0) return { players };
  const byId = new Map(players.map((pl) => [pl.playerId, pl]));
  for (const d of delta.changed) {
    const cur = byId.get(d.playerId);
    if (!cur) continue; // 未知プレイヤーの差分は無視（フルスナップ待ち）
    byId.set(d.playerId, {
      ...cur,
      stackRatio: d.stackRatio ?? cur.stackRatio,
      badgeCount: d.badgeCount ?? cur.badgeCount,
      alive: d.alive ?? cur.alive,
    });
  }
  // 元の並び順を保つ。
  return { players: players.map((pl) => byId.get(pl.playerId) ?? pl) };
}
