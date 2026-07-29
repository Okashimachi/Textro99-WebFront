// アプリのルート。画面フローと接続/判定を配線する。
//
// 画面フロー（クライアント設定 → サーバー駆動）:
//   title → mode（オンライン/練習/[部屋=近日]）→ name → in-game
//   in-game は ScreenRouter がサーバー state から matchmaking/inMatch/spectating/result を描画。
//
// 実行モード:
//   - online: 実サーバー（VITE_WS_URL）へ WebSocket 接続（autoReconnect でコールドスタート吸収）
//   - practice: フロント完結（src/dev/mockServer がランダム出題）
// 拡張の継ぎ目: 部屋制・名前のサーバー送信・厳密順位は後日（memory: textro99-screen-flow-decisions）。
import { useCallback, useEffect, useMemo, useState } from "react";
import { WsConnection, type ConnectionStatus } from "@/net";
import { MessageType, type DakenClearReport, type Envelope } from "@/proto/types";
import { useGameState } from "@/state";
import { ScreenRouter, useScreenPhase, type ScreenActions } from "@/screens";
import { TitleScreen, ModeSelectScreen, NameEntryScreen, type PlayMode } from "@/screens/setup";
import { useInputController } from "@/input";
import { useTypingJudge } from "@/typing";
import { useProfile } from "@/profile";
import { startMockServer } from "@/dev/mockServer";
import { InMatchDevTools } from "@/dev/InMatchDevTools";
import { useMockDakenExpiry } from "@/dev/useMockDakenExpiry";
import { RawStateDebugPane } from "@/components/RawStateDebugPane";
import { MOCK_SEQUENCE } from "@/dev/mockMessages";

type Stage = "title" | "mode" | "name" | "in-game";
type Backend = "server" | "mock";

export function App() {
  const connection = useMemo(() => new WsConnection({ autoReconnect: true }), []);
  const [stage, setStage] = useState<Stage>("title");
  const [pendingMode, setPendingMode] = useState<PlayMode>("online");
  const [backend, setBackend] = useState<Backend>("server");
  const [status, setStatus] = useState<ConnectionStatus>(connection.status);
  // 開発ツール（デバッグ行 / 送信ログ / Devモック / RawStateDebugPane）の表示。
  // OFF にすると本番でプレイヤーが触る画面相当になる（マッチング中に切替可能）。
  // 手動クリア報告ボタンだけは、この値に関わらず常に表示する。
  const [showDevTools, setShowDevTools] = useState(true);

  const { profile, setDisplayName } = useProfile();
  const { state, lastEnvelope } = useGameState(connection);
  const { phase, inputActive, actions, startCountdownDeadlineMs } = useScreenPhase(state);
  const [step, setStep] = useState(0);
  const [sentLog, setSentLog] = useState<{ envelope: Envelope; sent: boolean }[]>([]);

  useEffect(() => connection.onStatusChange(setStatus), [connection]);

  // 接続/モックは in-game の間だけ動かす。title/mode/name では接続しない。
  useEffect(() => {
    if (stage !== "in-game") return;
    if (backend === "server") {
      connection.connect();
      return () => connection.disconnect();
    }
    connection.disconnect();
    const stop = startMockServer(connection, { selfId: profile.displayName || "you" });
    return stop;
    // profile.displayName は開始時に確定済み。依存に入れて再起動させない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, backend, connection]);

  // タイピング判定(#8)。完了で DakenClearReport を送る。
  const onClear = useCallback(
    (report: DakenClearReport) => {
      connection.send(MessageType.DakenClearReport, report);
      // サーバーはクリアしたお題を DakenExpired しない（次の DakenIssued のみ送る）。
      // 打鍵判定はクライアントの権威なので、確定したお題をローカルで active から除去して次へ進める。
      connection.simulateReceive({
        type: MessageType.DakenExpired,
        payload: { dakenId: report.dakenId },
      });
    },
    [connection],
  );
  const { typed, missCount, registerChar } = useTypingJudge({
    daken: state.activeDaken[0],
    active: inputActive,
    onClear,
  });

  // 練習モードのみ: 制限時間切れをサーバーの代わりに流す（オンラインではサーバーが送る）。
  useMockDakenExpiry({
    connection,
    activeDaken: state.activeDaken,
    enabled: backend === "mock" && stage === "in-game",
  });

  const { selectedStrategyId } = useInputController({
    connection,
    active: inputActive,
    consumedCombo: state.combo.value,
    onCharKey: registerChar,
  });

  useEffect(() => {
    return connection.onOutbound((envelope, sent) =>
      setSentLog((prev) => [{ envelope, sent }, ...prev].slice(0, 10)),
    );
  }, [connection]);

  // --- 画面遷移ハンドラ ---
  const startPlay = useCallback(
    (name: string) => {
      setDisplayName(name);
      setBackend(pendingMode === "online" ? "server" : "mock");
      // 拡張の継ぎ目: サーバーが名前対応 C2S を持ったら、ここで join 時に profile を送る。
      actions.seekMatch(); // MatchStart までは matchmaking 表示
      setStage("in-game");
    },
    [pendingMode, actions, setDisplayName],
  );

  const exitToTitle = useCallback(() => {
    actions.backToTitle();
    setStage("title");
  }, [actions]);

  // ScreenRouter に渡す合成 actions（stage 遷移を織り込む）。
  const routerActions: ScreenActions = useMemo(
    () => ({
      seekMatch: actions.seekMatch,
      backToTitle: exitToTitle,
      leaveMatchmaking: () => {
        actions.leaveMatchmaking();
        setStage("title");
      },
      rematch: actions.rematch,
    }),
    [actions, exitToTitle],
  );

  let body: React.ReactNode;
  if (stage === "title") {
    body = <TitleScreen onStart={() => setStage("mode")} />;
  } else if (stage === "mode") {
    body = (
      <ModeSelectScreen
        onSelect={(m) => {
          setPendingMode(m);
          setStage("name");
        }}
        onBack={() => setStage("title")}
      />
    );
  } else if (stage === "name") {
    body = (
      <NameEntryScreen
        initialName={profile.displayName}
        actionLabel={pendingMode === "online" ? "対戦開始" : "練習開始"}
        onSubmit={startPlay}
        onBack={() => setStage("mode")}
      />
    );
  } else {
    body = (
      <ScreenRouter
        phase={phase}
        state={state}
        actions={routerActions}
        net={{
          // 再マッチング。サーバー接続時は「接続を張り直す」ことで再登録する
          // （サーバーは接続時のみ matchmaking へ Join するため、同一接続への
          // MatchmakingJoin 送信では再戦できない）。mock はメッセージで新試合を開始する。
          join: () =>
            backend === "server"
              ? connection.reconnect()
              : connection.send(MessageType.MatchmakingJoin, {}),
          leave: () => connection.send(MessageType.MatchmakingLeave, {}),
        }}
        selectedStrategyId={selectedStrategyId}
        typedPrefix={typed}
        missCount={missCount}
        selfDisplayName={profile.displayName}
        showDevTools={showDevTools}
        onToggleDevTools={setShowDevTools}
        startCountdownDeadlineMs={startCountdownDeadlineMs}
        inMatchDevTools={
          // 練習（フロント完結）モードのみ。オンライン対戦では出さない。
          backend === "mock" ? (
            <InMatchDevTools
              connection={connection}
              activeDaken={state.activeDaken}
              dakenStack={state.dakenStack}
              comboValue={state.combo.value}
              onManualClear={onClear}
            />
          ) : undefined
        }
      />
    );
  }

  const statusLabel = backend === "mock" ? "フロント完結（ローカル）" : status;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="flex items-center gap-2 border-b border-zinc-300 bg-white px-3 py-1.5">
        <span className="text-xs font-black tracking-wide text-red-600">テキストロ99</span>
        <p className="text-[11px] text-zinc-500">
          画面: {stage === "in-game" ? phase : stage}
          {stage === "in-game" &&
            showDevTools &&
            ` / 接続: ${statusLabel} / 生存: ${state.aliveCount}`}
          {profile.displayName && ` / 名前: ${profile.displayName}`}
        </p>
      </header>

      <main className="px-3">{body}</main>

      {/* dev: 送信ログ・S2C 注入・生 state（in-game かつ 開発ツール表示 ON のときのみ） */}
      {stage === "in-game" && showDevTools && (
        <>
          <section className="px-4 pb-4 text-xs">
            <h2 className="mb-1 font-bold text-zinc-900">
              入力送信ログ（inputActive: {String(inputActive)} / 戦略:{" "}
              {selectedStrategyId ?? "—"} / 打鍵: {typed || "—"} / ミス: {missCount}）
            </h2>
            <ul className="space-y-0.5 font-mono text-zinc-500">
              {sentLog.map((s, i) => (
                <li key={i}>
                  {s.sent ? "→" : "×"} {s.envelope.type} {JSON.stringify(s.envelope.payload)}
                </li>
              ))}
            </ul>
          </section>

          <section className="p-4">
            <h2 className="mb-2 text-sm font-bold text-zinc-900">
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
                  className={`px-2 py-1 text-xs ${
                    i < step ? "border border-red-700 bg-red-600 text-white" : "border border-zinc-300 bg-white hover:bg-zinc-100"
                  }`}
                >
                  {i + 1}. {m.label}
                </button>
              ))}
            </div>
          </section>

          <RawStateDebugPane state={state} lastEnvelope={lastEnvelope} />
        </>
      )}
    </div>
  );
}
