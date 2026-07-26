// アプリのルート。接続 → ディスパッチ → ViewModel → タイピング判定(#8) を配線し、
// RawStateDebugPane（#6）を常設する。
//
// 2つの実行モードを GUI で切り替えられる（log-013）:
//   - server: 実サーバー（VITE_WS_URL）へ WebSocket 接続。autoReconnect で
//             コールドスタートを吸収。※現状サーバー側 Origin 許可待ちでブラウザ接続不可。
//   - mock:   フロント完結テスト。ローカル模擬サーバー（src/dev/mockServer）が
//             ランダムなお題を出題し、DakenClearReport を受けて次のお題を返す。
//             サーバー無しで「出題→表示→タイピング→ダケン判定」を試せる。
import { useCallback, useEffect, useMemo, useState } from "react";
import { WsConnection, type ConnectionStatus } from "@/net";
import { MessageType, type DakenClearReport, type Envelope } from "@/proto/types";
import { useGameState } from "@/state";
import { ScreenRouter, useScreenPhase } from "@/screens";
import { useInputController } from "@/input";
import { useTypingJudge } from "@/typing";
import { startMockServer } from "@/dev/mockServer";
import { RawStateDebugPane } from "@/components/RawStateDebugPane";
import { MOCK_SEQUENCE } from "@/dev/mockMessages";

type RunMode = "server" | "mock";

export function App() {
  // 接続インスタンスは1つ。モードに応じて connect / disconnect と模擬サーバーを切り替える。
  const connection = useMemo(() => new WsConnection({ autoReconnect: true }), []);
  // 既定はフロント完結テスト（サーバーは Origin 許可待ちで繋がらないため）。
  const [mode, setMode] = useState<RunMode>("mock");
  const [status, setStatus] = useState<ConnectionStatus>(connection.status);

  const { state, lastEnvelope } = useGameState(connection);
  const { phase, inputActive, actions } = useScreenPhase(state);
  const [step, setStep] = useState(0);
  const [sentLog, setSentLog] = useState<{ envelope: Envelope; sent: boolean }[]>([]);

  // 接続状態を購読（ヘッダ表示のリアクティブ化）。
  useEffect(() => connection.onStatusChange(setStatus), [connection]);

  // モード切替: server は実 WS 接続、mock は WS を閉じてローカル模擬サーバーを起動。
  useEffect(() => {
    if (mode === "server") {
      connection.connect();
      return () => connection.disconnect();
    }
    connection.disconnect();
    const stop = startMockServer(connection);
    return stop;
  }, [mode, connection]);

  // タイピング判定(#8)。現在のお題(activeDaken 先頭)に打鍵を流し、完了で DakenClearReport。
  const onClear = useCallback(
    (report: DakenClearReport) => connection.send(MessageType.DakenClearReport, report),
    [connection],
  );
  const { typed, missCount, registerChar } = useTypingJudge({
    daken: state.activeDaken[0],
    active: inputActive,
    onClear,
  });

  // 入力送信層(#7)。文字キー → 打鍵判定へ、Enter → AttackRequest、0-9 → StrategySelect。
  const { selectedStrategyId } = useInputController({
    connection,
    active: inputActive,
    consumedCombo: state.combo.value,
    onCharKey: registerChar,
  });

  // dev: 送信された C2S を可視化（未接続でも観測）。
  useEffect(() => {
    return connection.onOutbound((envelope, sent) =>
      setSentLog((prev) => [{ envelope, sent }, ...prev].slice(0, 10)),
    );
  }, [connection]);

  const statusLabel = mode === "mock" ? "フロント完結（ローカル）" : status;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold">テキストロ99 — Web テストフロント</h1>
          <div className="flex items-center gap-1 text-xs">
            <span className="mr-1 text-slate-400">モード:</span>
            <ModeButton current={mode} value="mock" onClick={setMode}>
              フロント完結テスト
            </ModeButton>
            <ModeButton current={mode} value="server" onClick={setMode}>
              サーバー接続
            </ModeButton>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          画面: {phase} / 接続状態: {statusLabel} / 自分:{" "}
          {state.selfPlayerId ?? "—"} / 生存: {state.aliveCount}
        </p>
      </header>

      <main className="px-4">
        <ScreenRouter
          phase={phase}
          state={state}
          actions={actions}
          net={{
            join: () => connection.send(MessageType.MatchmakingJoin, {}),
            leave: () => connection.send(MessageType.MatchmakingLeave, {}),
          }}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={typed}
          missCount={missCount}
        />
      </main>

      {/* dev: 送信 C2S ログ ＋ サーバー用の手動クリア報告（お題がかなで打鍵できない場合の疎通用） */}
      <section className="p-4 text-xs">
        <h2 className="mb-1 font-bold text-slate-300">
          入力送信ログ（inputActive: {String(inputActive)} / 選択戦略:{" "}
          {selectedStrategyId ?? "—"} / 打鍵: {typed || "—"} / ミス: {missCount}）
        </h2>

        {/*
          サーバーモードのお題はかな（例「ねこ」）で、直接照合方式では打鍵できないことがある。
          その場合の DakenClearReport 疎通用に、実発行 dakenId で手動報告するボタンを残す。
        */}
        <div className="mb-2">
          <button
            disabled={state.activeDaken.length === 0}
            onClick={() => {
              const daken = state.activeDaken[0];
              if (!daken) return;
              const payload: DakenClearReport = {
                dakenId: daken.dakenId,
                isMiss: false,
                missCount: 0,
                elapsedMs: 0,
              };
              connection.send(MessageType.DakenClearReport, payload);
            }}
            className="rounded bg-indigo-700 px-2 py-1 text-xs enabled:hover:bg-indigo-600 disabled:opacity-40"
          >
            現在のダケンを手動クリア報告（DakenClearReport 疎通）
            {state.activeDaken[0] ? ` [${state.activeDaken[0].dakenId} “${state.activeDaken[0].text}”]` : ""}
          </button>
        </div>
        <ul className="space-y-0.5 font-mono text-slate-400">
          {sentLog.map((s, i) => (
            <li key={i}>
              {s.sent ? "→" : "×"} {s.envelope.type} {JSON.stringify(s.envelope.payload)}
            </li>
          ))}
        </ul>
      </section>

      {/* dev モックハーネス：任意の S2C を手動注入して reducer/表示を単体検証する */}
      <section className="p-4">
        <h2 className="mb-2 text-sm font-bold text-slate-300">
          Dev モック（S2C 手動注入・単体検証）
        </h2>
        <div className="flex flex-wrap gap-2">
          {MOCK_SEQUENCE.map((m, i) => (
            <button
              key={m.label}
              onClick={() => {
                connection.simulateReceive(m.envelope);
                setStep(i + 1);
              }}
              className={`rounded px-2 py-1 text-xs ${
                i < step ? "bg-emerald-700" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {i + 1}. {m.label}
            </button>
          ))}
        </div>
      </section>

      <RawStateDebugPane state={state} lastEnvelope={lastEnvelope} />
    </div>
  );
}

function ModeButton({
  current,
  value,
  onClick,
  children,
}: {
  current: RunMode;
  value: RunMode;
  onClick: (m: RunMode) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded px-2 py-1 ${
        active ? "bg-emerald-600 font-bold text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
