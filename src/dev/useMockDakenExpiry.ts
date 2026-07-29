// ============================================================================
// useMockDakenExpiry — 練習（フロント完結）モードで、お題の制限時間切れを模擬する（dev 専用）
//
// **時間切れの確定はサーバーの責務**（`docs/rules/01`。C2S に時間切れ報告は無い）。
// 実サーバー接続時はサーバーが `DakenExpired` を送ってくるので、クライアントは何もしない。
// 練習モードだけは相手がいないので、模擬サーバーの一部としてここが同じ S2C を流す:
//   制限時間が過ぎたら `DakenExpired` → 次のお題が主ディスプレイに来る。
//   さらに、キューが尽きないよう新しいお題を1件補充する（実サーバーの出題に相当）。
//
// `enabled` が false（＝オンライン対戦）では一切動かない。
// ============================================================================
import { useEffect } from "react";
import { MessageType, type DakenInstance } from "@/proto/types";
import type { WsConnection } from "@/net";
import { createMockDaken } from "./mockServer";

/** これより長い制限時間は「実質無制限」とみなして時間切れにしない。 */
const NO_LIMIT_MS = 600_000;

interface Options {
  connection: WsConnection;
  /** 現在の出題列（先頭＝いま打つお題）。 */
  activeDaken: DakenInstance[];
  /** 練習モードかつ試合中のときだけ true。 */
  enabled: boolean;
}

export function useMockDakenExpiry({ connection, activeDaken, enabled }: Options) {
  const current = activeDaken[0];
  const dakenId = current?.dakenId;
  const timeLimitMs = current?.timeLimitMs ?? 0;

  useEffect(() => {
    if (!enabled || !dakenId) return;
    if (!(timeLimitMs > 0) || timeLimitMs > NO_LIMIT_MS) return;

    // お題が主ディスプレイに出てからの経過で測る（表示の残り時間バーと同じ基準）。
    const timer = window.setTimeout(() => {
      connection.simulateReceive({
        type: MessageType.DakenExpired,
        payload: { dakenId },
      });
      // 実サーバーは出題を絶やさない。練習でもキューが尽きないよう1件足す。
      connection.simulateReceive({
        type: MessageType.DakenIssued,
        payload: { daken: [createMockDaken()] },
      });
    }, timeLimitMs);

    return () => window.clearTimeout(timer);
  }, [connection, enabled, dakenId, timeLimitMs]);
}
