// アプリのルート。接続 → ディスパッチ → ViewModel を配線し、
// RawStateDebugPane（#6）を常設する。画面遷移や HUD は後続 Issue（#9〜）で追加。
import { useEffect, useMemo, useState } from "react";
import { WsConnection } from "@/net";
import type { Envelope } from "@/proto/types";
import { useGameState } from "@/state";
import { ScreenRouter, useScreenPhase } from "@/screens";
import { useInputController } from "@/input";
import { RawStateDebugPane } from "@/components/RawStateDebugPane";
import { MOCK_SEQUENCE } from "@/dev/mockMessages";

export function App() {
  // 接続は生成のみ（自動接続はしない）。実サーバ疎通は統合フェーズで有効化する。
  const connection = useMemo(() => new WsConnection({ autoReconnect: false }), []);
  const { state, lastEnvelope } = useGameState(connection);
  const { phase, inputActive, actions } = useScreenPhase(state);
  const [step, setStep] = useState(0);
  const [sentLog, setSentLog] = useState<{ envelope: Envelope; sent: boolean }[]>([]);
  const [lastChar, setLastChar] = useState<string | null>(null);

  // 入力送信層（#7）。inMatch のみ有効。文字キーは #8 TypingJudge へ渡す想定（現状は表示のみ）。
  const { selectedStrategyId } = useInputController({
    connection,
    active: inputActive,
    consumedCombo: state.combo.value,
    onCharKey: (c) => setLastChar(c),
  });

  // dev: 送信された C2S を可視化（未接続でも観測）。
  useEffect(() => {
    return connection.onOutbound((envelope, sent) =>
      setSentLog((prev) => [{ envelope, sent }, ...prev].slice(0, 10)),
    );
  }, [connection]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 px-4 py-3">
        <h1 className="text-lg font-bold">テキストロ99 — Web テストフロント</h1>
        <p className="text-xs text-slate-400">
          画面: {phase} / 接続状態: {connection.status} / 自分:{" "}
          {state.selfPlayerId ?? "—"} / 生存: {state.aliveCount}
        </p>
      </header>

      <main className="px-4">
        <ScreenRouter
          phase={phase}
          state={state}
          actions={actions}
          selectedStrategyId={selectedStrategyId}
          typedPrefix={lastChar ?? ""}
        />
      </main>

      {/* dev: 入力送信層の可視化（#7 検証用）。inMatch のとき Enter/0-9/文字キーを試せる */}
      <section className="p-4 text-xs">
        <h2 className="mb-1 font-bold text-slate-300">
          入力送信ログ（inputActive: {String(inputActive)} / 選択戦略:{" "}
          {selectedStrategyId ?? "—"} / 最終打鍵: {lastChar ?? "—"}）
        </h2>
        <ul className="space-y-0.5 font-mono text-slate-400">
          {sentLog.map((s, i) => (
            <li key={i}>
              {s.sent ? "→" : "×"} {s.envelope.type} {JSON.stringify(s.envelope.payload)}
            </li>
          ))}
        </ul>
      </section>

      {/* dev モックハーネス：サーバー無しで reducer/表示を検証する（docs/rules/02 §2 の切り分け目的） */}
      <section className="p-4">
        <h2 className="mb-2 text-sm font-bold text-slate-300">
          Dev モック（サーバー無し検証）
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
