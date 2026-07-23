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

export interface WsConnectionOptions {
  /** 接続先 URL。既定は import.meta.env.VITE_WS_URL。 */
  url?: string;
  /** 自動再接続を行うか（既定 true）。 */
  autoReconnect?: boolean;
  /** 再接続の待機時間（ms, 既定 1000）。 */
  reconnectDelayMs?: number;
}

/**
 * proto 契約に忠実な薄い WebSocket ラッパ。
 * on(type, handler) でハンドラを登録し、send(type, payload) で C2S を送る。
 */
export class WsConnection {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly autoReconnect: boolean;
  private readonly reconnectDelayMs: number;

  private readonly handlers = new Map<string, Set<MessageHandler>>();
  private readonly statusListeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private _status: ConnectionStatus = "idle";

  constructor(options: WsConnectionOptions = {}) {
    this.url = options.url ?? import.meta.env.VITE_WS_URL;
    this.autoReconnect = options.autoReconnect ?? true;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1000;
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

    ws.onopen = () => this.setStatus("open");
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
    if (!this.ws || this._status !== "open") {
      console.warn(`[WsConnection] 未接続のため送信できません: ${type}`);
      return false;
    }
    const envelope: Envelope = { type, payload };
    this.ws.send(JSON.stringify(envelope));
    return true;
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

  /** 接続状態の変化を購読する。戻り値は解除関数。 */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
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
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelayMs);
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
