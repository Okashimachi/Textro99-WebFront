// ============================================================================
// WebSocket 接続・メッセージディスパッチ層（薄い contract 駆動レイヤ）
//
// この層は **Unity(C#) がミラーする参照実装** を兼ねる（docs/rules/01 §5）。
// そのため独自解釈・ゲームロジックを一切持たず、以下だけを行う:
//   - 接続確立 / 切断 / 自動再接続
//   - C2S を Envelope { type, payload } として送信
//   - 受信 Envelope を type ごとに登録済みハンドラへ振り分け（未知 type は無視）
//
// state 畳み込み(#5)・UI・打鍵判定(#8) はここに書かない。
// ============================================================================

import { MessageType, type Envelope } from "@/proto/types";

/** 受信ハンドラ。payload は proto の各メッセージ DTO（呼び出し側でキャストする）。 */
export type MessageHandler = (payload: unknown, envelope: Envelope) => void;

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "reconnecting";

export type StatusListener = (status: ConnectionStatus) => void;

/** 送信（またはその試行）を観測するリスナ。sent=false は未接続で実送信されなかった場合。 */
export type OutboundListener = (envelope: Envelope, sent: boolean) => void;

export interface WsConnectionOptions {
  /** 接続先 URL。既定は import.meta.env.VITE_WS_URL。 */
  url?: string;
  /** 自動再接続を行うか（既定 true）。 */
  autoReconnect?: boolean;
  /** 再接続の初期待機時間（ms, 既定 1000）。失敗ごとに倍増し maxReconnectDelayMs で頭打ち。 */
  reconnectDelayMs?: number;
  /** 再接続の最大待機時間（ms, 既定 30000）。 */
  maxReconnectDelayMs?: number;
}

/**
 * proto 契約に忠実な薄い WebSocket ラッパ。
 * on(type, handler) でハンドラを登録し、send(type, payload) で C2S を送る。
 */
export class WsConnection {
  private ws: WebSocket | null = null;
  private readonly url: string;
  // 試合終了後は自動再接続を止める（＝勝手に次の試合へ登録されない）ため可変。
  private autoReconnect: boolean;
  private readonly baseReconnectDelayMs: number;
  private readonly maxReconnectDelayMs: number;

  private readonly handlers = new Map<string, Set<MessageHandler>>();
  private readonly statusListeners = new Set<StatusListener>();
  private readonly outboundListeners = new Set<OutboundListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private _status: ConnectionStatus = "idle";
  private reconnectAttempts = 0;

  constructor(options: WsConnectionOptions = {}) {
    this.url = options.url ?? import.meta.env.VITE_WS_URL;
    this.autoReconnect = options.autoReconnect ?? true;
    this.baseReconnectDelayMs = options.reconnectDelayMs ?? 1000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 30_000;
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  /** 接続を開始する。既に開いている場合は何もしない。 */
  connect(): void {
    if (this.ws && (this._status === "open" || this._status === "connecting")) {
      return;
    }
    if (!this.url) {
      console.error(
        "[WsConnection] VITE_WS_URL が未設定です。接続先を .env で指定してください。",
      );
      return;
    }
    this.manuallyClosed = false;
    this.setStatus(this._status === "closed" ? "reconnecting" : "connecting");

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus("open");
    };
    ws.onmessage = (ev) => this.handleRawMessage(ev.data);
    ws.onerror = () => {
      // onclose が続けて呼ばれるため、ここでは状態遷移しない。
      console.warn("[WsConnection] WebSocket error");
    };
    ws.onclose = () => {
      this.ws = null;
      this.setStatus("closed");
      if (this.autoReconnect && !this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * 既存接続を閉じて新しい接続を張り直す。
   *
   * サーバーは **WebSocket 接続時にのみマッチング登録** する契約のため（1接続=1試合）、
   * 試合終了後の再戦には「同じ接続に再参加メッセージを送る」のではなく、
   * **新しい接続を開く**必要がある。旧ソケットの onclose を無効化してから閉じ、
   * autoReconnect による二重接続を防ぐ。
   */
  reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const old = this.ws;
    this.ws = null;
    if (old) {
      // 旧ソケットのハンドラを外し、閉鎖に伴う再接続スケジュールを止める。
      old.onopen = null;
      old.onmessage = null;
      old.onerror = null;
      old.onclose = null;
      old.close();
    }
    this.reconnectAttempts = 0;
    this.setStatus("closed");
    this.connect();
  }

  /**
   * 自動再接続の可否を切り替える。
   *
   * サーバーは接続時にのみマッチング登録する（1接続=1試合）。そのため試合終了後に
   * 自動再接続すると、そのまま次の試合へ送り込まれてしまう。リザルト表示に入ったら
   * false にして「切れたら切れたまま」にする（次の試合へ行くのはユーザーの明示操作のみ）。
   */
  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
    if (!enabled && this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** 明示的に切断する（自動再接続はしない）。 */
  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setStatus("closed");
  }

  /** C2S を Envelope { type, payload } として送る。未接続時は false を返す。 */
  send(type: MessageType, payload: unknown): boolean {
    const envelope: Envelope = { type, payload };
    const open = !!this.ws && this._status === "open";
    if (open) {
      this.ws!.send(JSON.stringify(envelope));
    } else {
      console.warn(`[WsConnection] 未接続のため送信できません: ${type}`);
    }
    // 未接続でも観測はできるようにする（dev 表示・テスト用）。
    for (const l of this.outboundListeners) l(envelope, open);
    return open;
  }

  /**
   * 受信 type にハンドラを登録する。戻り値は解除関数。
   * 同じ type に複数登録できる。
   */
  on(type: MessageType, handler: MessageHandler): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  /**
   * サーバー無しでの検証・リプレイ用。受信したかのように Envelope をディスパッチする。
   * 実通信経路（handleRawMessage）と同一の分岐を通す。
   */
  simulateReceive(envelope: Envelope): void {
    this.handleRawMessage(JSON.stringify(envelope));
  }

  /** 接続状態の変化を購読する。戻り値は解除関数。 */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** 送信（試行含む）を購読する。戻り値は解除関数。dev 表示・テスト用。 */
  onOutbound(listener: OutboundListener): () => void {
    this.outboundListeners.add(listener);
    return () => {
      this.outboundListeners.delete(listener);
    };
  }

  // ── 内部 ──────────────────────────────────────────────

  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    for (const l of this.statusListeners) l(status);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.setStatus("reconnecting");
    const delay = Math.min(
      this.baseReconnectDelayMs * 2 ** this.reconnectAttempts,
      this.maxReconnectDelayMs,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleRawMessage(raw: unknown): void {
    if (typeof raw !== "string") {
      // Blob/ArrayBuffer は現契約では使わない。安全に無視。
      console.warn("[WsConnection] 文字列以外のフレームを無視しました");
      return;
    }
    let envelope: Envelope;
    try {
      envelope = JSON.parse(raw) as Envelope;
    } catch {
      console.warn("[WsConnection] JSON parse 失敗。フレームを無視:", raw);
      return;
    }
    if (!envelope || typeof envelope.type !== "string") {
      console.warn("[WsConnection] type を持たないフレームを無視:", envelope);
      return;
    }
    const set = this.handlers.get(envelope.type);
    if (!set || set.size === 0) {
      // 未知 / 未購読の type はクラッシュせず無視（contract 前方互換）。
      return;
    }
    for (const handler of set) handler(envelope.payload, envelope);
  }
}
