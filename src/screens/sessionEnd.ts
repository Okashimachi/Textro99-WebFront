// セッション終端（試合が完全に終わったこと）の判定。
//
// 「試合が完全に終わった」の判定はクライアントでは行わない（勝敗ルールはサーバー権威・
// docs/rules/01 §1,§3）。proto に MatchEnd 相当のメッセージが無いため、
// **サーバーが接続を切ったこと**を試合完全終了のシグナルとして扱う。
// 自分の GameOver 後は自動再接続を止めてあるので、closed は「サーバーが終端を告げた」に等しい。
//
// 試合が完全に終わった後、タイトルへ戻るかどうかはプレイヤーの操作に委ねる
// （自動遷移や猶予時間は設けない）。
import type { ConnectionStatus } from "@/net";

/** 接続がもう戻らない（＝サーバーが切った）状態か。 */
export function isConnectionFinished(status: ConnectionStatus): boolean {
  return status === "closed" || status === "reconnecting";
}
