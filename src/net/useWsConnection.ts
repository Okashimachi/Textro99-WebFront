// React から WsConnection を使うための薄いフック。
// 接続の生成・破棄と status の購読だけを担う。ディスパッチ登録は呼び出し側が on() で行う。
import { useEffect, useMemo, useState } from "react";
import {
  WsConnection,
  type ConnectionStatus,
  type WsConnectionOptions,
} from "./connection";

export interface UseWsConnection {
  connection: WsConnection;
  status: ConnectionStatus;
}

/**
 * WsConnection を1つ生成して返す。マウント時に connect、アンマウント時に disconnect。
 * options は初回のみ使う（再生成しない）。
 */
export function useWsConnection(
  options: WsConnectionOptions = {},
  autoConnect = true,
): UseWsConnection {
  // options は初回マウント時の値で固定する（依存に入れて再生成しない）。
  const connection = useMemo(() => new WsConnection(options), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [status, setStatus] = useState<ConnectionStatus>(connection.status);

  useEffect(() => {
    const off = connection.onStatusChange(setStatus);
    if (autoConnect) connection.connect();
    return () => {
      off();
      connection.disconnect();
    };
  }, [connection, autoConnect]);

  return { connection, status };
}
