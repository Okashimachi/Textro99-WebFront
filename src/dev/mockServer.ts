// ============================================================================
// フロント完結テスト用のローカル模擬サーバー（dev 専用）
//
// 目的: サーバー未接続でも「お題がランダムに送られてくる → 表示 → タイピング →
// ダケン判定」のループを GUI で試せるようにする。実サーバーの代わりに、
// WsConnection.simulateReceive で S2C を流し、onOutbound で C2S を受けて応答する。
//
// これは検証用のスタブであり、ゲームロジック（コンボ/威力/相殺/KO）の正典ではない。
// 実挙動は必ず実サーバーで確認すること（docs/rules/02 §2）。
// ============================================================================

import {
  MessageType,
  type DakenInstance,
  type Envelope,
  type PlayerSummary,
} from "@/proto/types";
import type { WsConnection } from "@/net";

// お題は実サーバーに合わせて「かな」。判定側（judge.ts + romaji.ts）が
// かな→受理ローマ字へ変換して打鍵判定する。表記ゆれ・拗音・促音・ん も含めて出題。
const WORDS = [
  "ねこ", "いぬ", "とり", "すし", "らーめん", "とうきょう", "きょうと", "さくら",
  "まっちゃ", "にんじゃ", "さむらい", "ふじ", "きもの", "せんせい", "ありがとう",
  "こんにちは", "しゃしん", "きゅうり", "がっこう", "でんしゃ", "ちゃわん", "しんぶん",
  "たいぴんぐ", "こんぼ", "こうげき", "しょうり", "ぷれいやー", "ばとる",
];

/** かなお題をランダムに1件返す（dev ツールからも使う）。 */
export const randomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

export interface MockServerOptions {
  /** 自分の表示上の playerId。 */
  selfId?: string;
}

/**
 * ローカル模擬サーバーを起動する。戻り値を呼ぶと停止する。
 * 起動時に Welcome → MatchStart（初期お題つき）を流し、以降は
 * DakenClearReport を受けるたびに ComboUpdated＋次のお題を返す。
 */
export function startMockServer(
  connection: WsConnection,
  options: MockServerOptions = {},
): () => void {
  const selfId = options.selfId ?? "you";
  let stopped = false;
  let seq = 0;
  let combo = 0;

  const recv = (type: MessageType, payload: unknown) => {
    if (!stopped) connection.simulateReceive({ type, payload } as Envelope);
  };

  // 練習モードでも種別ごとの色分け（通常/被弾/トラップ）を確認できるよう、
  // 数件に1件だけ被弾・トラップを混ぜる（開発用スタブの見た目確認用）。
  const nextDaken = (): DakenInstance => {
    seq += 1;
    const type: DakenInstance["type"] =
      seq % 7 === 0 ? "Trap" : seq % 3 === 0 ? "EnemySent" : "Normal";
    return {
      dakenId: `mock-${seq}`,
      type,
      text: randomWord(),
      difficultyLevel: 0,
      timeLimitMs: 999_999, // ローカルテストでは時間切れさせない
      issuedAtServerTimeMs: Date.now(),
    };
  };

  const self: PlayerSummary = {
    playerId: selfId,
    displayName: "あなた",
    comboValue: 0,
    dakenStackCount: 0,
    dakenStackLimit: 20,
    badgeCount: 0,
    alive: true,
  };

  // 試合開始シーケンス（初期化・再マッチング双方から呼ぶ）。
  // matchId を毎回変えることで reducer の MatchStart が gameOver をクリアし、
  // リザルト → マッチング → 試合中 の再マッチングループが練習モードでも回る。
  let matchSeq = 0;
  const startMatch = () => {
    matchSeq += 1;
    combo = 0;
    recv(MessageType.MatchStart, {
      matchId: `mock-match-${matchSeq}`,
      selfPlayerId: selfId,
      players: [{ ...self }],
      initialDaken: nextDaken(),
      parameters: {
        stackLimit: 20,
        trapTriggerInterval: 5,
        personalDifficultyStep: 20,
        difficultyMaxLevel: 10,
      },
    });
    // 先読み分（NEXT 表示の確認用）。実サーバーも複数のお題を保持するため、
    // 練習モードでも常に数件先まで積んだ状態にしておく。
    recv(MessageType.DakenIssued, {
      daken: [nextDaken(), nextDaken(), nextDaken(), nextDaken()],
    });
  };

  // 初期化: Welcome → MatchStart（初期お題つき）。
  recv(MessageType.Welcome, { playerId: selfId });
  startMatch();

  // C2S を監視して応答する（未接続でも onOutbound は発火する）。
  const off = connection.onOutbound((env) => {
    if (stopped) return;

    if (env.type === MessageType.MatchmakingJoin) {
      // 再マッチング: 実サーバーの MatchmakingJoin → MatchStart に相当する応答。
      // （マッチング待機をスキップして即開始する簡易スタブ。）
      startMatch();
    } else if (env.type === MessageType.DakenClearReport) {
      // 実サーバーに合わせる: クリアしたお題は DakenExpired せず、次の DakenIssued のみ返す。
      // クリア済みお題の active からの除去はクライアント（App.onClear）が行う。
      combo += 1;
      recv(MessageType.ComboUpdated, { comboValue: combo, delta: 1, reason: "Clear" });
      recv(MessageType.DakenStackUpdated, { count: 0, limit: 20, trapPending: false });
      recv(MessageType.DakenIssued, { daken: [nextDaken()] });
    } else if (env.type === MessageType.AttackRequest) {
      // Enter=攻撃。コンボ全消費（模擬）。
      const consumed = combo;
      combo = 0;
      recv(MessageType.ComboUpdated, { comboValue: 0, delta: -consumed, reason: "Consumed" });
    }
    // StrategySelect はローカルでは応答不要（選択表示は入力層が持つ）。
  });

  return () => {
    stopped = true;
    off();
  };
}
