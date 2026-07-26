// 受信ディスパッチ層(#4)と reducer(#5) を接続する React フック。
// すべての S2C type を購読し、reducer に畳み込む。直近 Envelope も保持（#6 デバッグ用）。
import { useEffect, useReducer, useRef, useState } from "react";
import { MessageType, type Envelope } from "@/proto/types";
import type { WsConnection } from "@/net";
import { gameReducer } from "./reducer";
import { createInitialViewModel, type GameViewModel } from "./viewModel";

// reducer が実際に処理する S2C。ここに列挙した type だけを購読する。
const S2C_TYPES: MessageType[] = [
  MessageType.Welcome,
  MessageType.MatchStart,
  MessageType.DakenIssued,
  MessageType.DakenExpired,
  MessageType.ComboUpdated,
  MessageType.DifficultyUpdated,
  MessageType.AttackIncoming,
  MessageType.AttackFailed,
  MessageType.OffsetResolved,
  MessageType.DakenStackUpdated,
  MessageType.KoNotified,
  MessageType.PlayerListUpdated,
  MessageType.PlayerListDelta,
  MessageType.GameOver,
  MessageType.MatchmakingStatus,
];

export interface UseGameState {
  state: GameViewModel;
  /** デバッグ表示用の直近受信 Envelope。 */
  lastEnvelope: Envelope | null;
}

export function useGameState(connection: WsConnection): UseGameState {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialViewModel);
  const [lastEnvelope, setLastEnvelope] = useState<Envelope | null>(null);
  // 最新 dispatch/set を保持し、登録は接続単位で1回だけにする。
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    const offs = S2C_TYPES.map((type) =>
      connection.on(type, (payload, envelope) => {
        setLastEnvelope(envelope);
        dispatchRef.current({ type, payload, receivedAtMs: Date.now() });
      }),
    );
    return () => offs.forEach((off) => off());
  }, [connection]);

  return { state, lastEnvelope };
}
