// 開発検証用のモック S2C 群（サーバー無しで reducer/UI を確認するため）。
// これは dev ハーネス専用。ゲームロジックではなく「サーバーが送ってくるであろう例」。
import { MessageType, type Envelope, type PlayerSummary } from "@/proto/types";

function player(i: number, alive = true): PlayerSummary {
  return {
    playerId: `p${i}`,
    displayName: `Player ${i}`,
    comboValue: 0,
    dakenStackCount: 0,
    dakenStackLimit: 20,
    badgeCount: 0,
    alive,
    rank: i, // 順位はサーバー確定値（#80）。モックでは並び順そのまま。
  };
}

const players99 = Array.from({ length: 99 }, (_, i) => player(i + 1));

export const MOCK_SEQUENCE: { label: string; envelope: Envelope }[] = [
  {
    label: "Welcome",
    envelope: { type: MessageType.Welcome, payload: { playerId: "p1" } },
  },
  {
    label: "MatchmakingStatus (待機)",
    envelope: {
      type: MessageType.MatchmakingStatus,
      payload: {
        waitingCount: 3,
        minPlayers: 20,
        players: [
          { displayName: "あなた" },
          { displayName: "たろう" },
          { displayName: "はなこ" },
        ],
      },
    },
  },
  {
    label: "MatchmakingStatus (カウントダウン)",
    envelope: {
      type: MessageType.MatchmakingStatus,
      // countdownMs は受信時点の残り時間(ms)。画面側が受信時刻を起点に補間する。
      payload: {
        waitingCount: 4,
        minPlayers: 20,
        countdownMs: 15000,
        players: [
          { displayName: "あなた" },
          { displayName: "たろう" },
          { displayName: "はなこ" },
          { displayName: "じろう" },
        ],
      },
    },
  },
  {
    label: "MatchStart",
    envelope: {
      type: MessageType.MatchStart,
      payload: {
        matchId: "m1",
        selfPlayerId: "p1",
        players: players99,
        initialDaken: {
          dakenId: "d1",
          type: "Normal",
          text: "すし",
          difficultyLevel: 0,
          timeLimitMs: 5000,
          issuedAtServerTimeMs: 0,
        },
        parameters: {
          stackLimit: 20,
          trapTriggerInterval: 5,
          personalDifficultyStep: 3,
          difficultyMaxLevel: 10,
        },
      },
    },
  },
  {
    label: "ComboUpdated (+1)",
    envelope: {
      type: MessageType.ComboUpdated,
      payload: { comboValue: 12, delta: 1, reason: "Clear" },
    },
  },
  {
    label: "DakenStackUpdated",
    envelope: {
      type: MessageType.DakenStackUpdated,
      payload: { count: 15, limit: 20, trapPending: true },
    },
  },
  {
    label: "AttackIncoming",
    envelope: {
      type: MessageType.AttackIncoming,
      payload: { warningId: "w1", attackerId: "p7", power: 30, graceMs: 3000 },
    },
  },
  {
    label: "DakenIssued (被弾を3手先へ割り込み)",
    envelope: {
      type: MessageType.DakenIssued,
      payload: {
        daken: [
          {
            dakenId: "d-in-1",
            type: "EnemySent",
            text: "ばとる",
            difficultyLevel: 0,
            timeLimitMs: 5000,
            issuedAtServerTimeMs: 0,
          },
        ],
        insertIndex: 3,
      },
    },
  },
  {
    label: "PlayerListDelta (p2脱落, p3スタック上昇)",
    envelope: {
      type: MessageType.PlayerListDelta,
      payload: {
        changed: [
          { playerId: "p2", alive: false },
          { playerId: "p3", stackRatio: 0.9, badgeCount: 2 },
        ],
        aliveCount: 98,
      },
    },
  },
  {
    label: "ComboUpdated (ミス/時間切れで0リセット)",
    envelope: {
      type: MessageType.ComboUpdated,
      payload: { comboValue: 0, delta: -12, reason: "Miss" },
    },
  },
  {
    label: "KoNotified",
    envelope: {
      type: MessageType.KoNotified,
      payload: { attackerId: "p1", victimId: "p2", badgesTransferred: 1 },
    },
  },
  {
    label: "KoNotified (自滅・attackerId=null)",
    envelope: {
      type: MessageType.KoNotified,
      payload: { attackerId: null, victimId: "p3", badgesTransferred: 0 },
    },
  },
  {
    // 自分（p1）が倒される KO。リザルトの「トドメを刺した相手」表示の検証用。
    label: "KoNotified (自分が撃破される)",
    envelope: {
      type: MessageType.KoNotified,
      payload: { attackerId: "p7", victimId: "p1", badgesTransferred: 3 },
    },
  },
  {
    label: "GameOver (脱落 42位)",
    envelope: {
      type: MessageType.GameOver,
      payload: {
        rank: 42,
        koCount: 2,
        finalBadgeCount: 3,
        typingStats: { totalDakenCleared: 64, totalMiss: 11, maxCombo: 18, elapsedMs: 96000 },
      },
    },
  },
  {
    label: "GameOver (優勝)",
    envelope: {
      type: MessageType.GameOver,
      payload: {
        rank: 1,
        koCount: 8,
        finalBadgeCount: 12,
        typingStats: { totalDakenCleared: 120, totalMiss: 9, maxCombo: 45, elapsedMs: 183000 },
      },
    },
  },
];
