// アプリのルート。画面フローと接続/判定を配線する。
//
// 画面フローは入口（entry）で2系統に分かれる:
//   - play（実運用）: title →「プレイする」→ name → in-game（サーバー・クイックマッチ固定）
//   - test（開発用）: title →「テスト用」→ mode（オンライン/練習/[部屋=近日]）→ name → in-game
//   in-game は ScreenRouter がサーバー state から matchmaking/inMatch/spectating/result を描画。
//
// 実運用フローでは開発ツール（送信ログ/生state/切替UI）を出さない。
//
// 実行モード:
//   - online: 実サーバー（VITE_WS_URL）へ WebSocket 接続（autoReconnect でコールドスタート吸収）
//   - practice: フロント完結（src/dev/mockServer がランダム出題）
//
// 試合開始のタイミングはサーバー権威（docs/rules/01 §1,§3）。サーバーが最低人数の到達を
// 検出してカウントダウンを開始し、MatchmakingStatus.countdownMs で残り時間を配信する。
// フロントはそれを表示するだけで、開始を決めない（ローカルで秒数を数えて開始しない）。
// 拡張の継ぎ目: 部屋制は後日（proto に Room 契約が入ってから）。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WsConnection, type ConnectionStatus } from "@/net";
import {
  MessageType,
  type DakenClearReport,
  type Envelope,
  type MatchmakingJoin,
} from "@/proto/types";
import { useGameState } from "@/state";
import {
  ScreenRouter,
  useScreenPhase,
  SESSION_END_COUNTDOWN_MS,
  type ScreenActions,
} from "@/screens";
import { isConnectionFinished } from "@/screens/sessionEnd";
import { TitleScreen, ModeSelectScreen, NameEntryScreen, type PlayMode } from "@/screens/setup";
import { useInputController } from "@/input";
import { useTypingJudge } from "@/typing";
import { useProfile } from "@/profile";
import { startMockServer } from "@/dev/mockServer";
import { InMatchDevTools } from "@/dev/InMatchDevTools";
import { RawStateDebugPane } from "@/components/RawStateDebugPane";
import { MOCK_SEQUENCE } from "@/dev/mockMessages";

type Stage = "title" | "mode" | "name" | "in-game";
type Backend = "server" | "mock";
/** 入口。play=実運用フロー（開発ツール無し）、test=開発用フロー。 */
type Entry = "play" | "test";

/**
 * テストモード（テスト用入口＝モード選択・練習・開発ツール）を出すか。
 * 実装は残したまま通常は非表示にし、URL に `?test=1` を付けたときだけ入口を出す。
 */
const testEntryEnabled =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("test") === "1";

export function App() {
  const connection = useMemo(() => new WsConnection({ autoReconnect: true }), []);
  const [stage, setStage] = useState<Stage>("title");
  const [entry, setEntry] = useState<Entry>("play");
  const [pendingMode, setPendingMode] = useState<PlayMode>("online");
  const [backend, setBackend] = useState<Backend>("server");
  const [status, setStatus] = useState<ConnectionStatus>(connection.status);
  // 開発ツール（デバッグ行 / 送信ログ / Devモック / RawStateDebugPane）の表示。
  // test 入口では既定 ON（マッチング中に切替可能）。play 入口では常に OFF で切替UIも出さない。
  // 手動クリア報告ボタンだけは、この値に関わらず常に表示する。
  const [showDevToolsPref, setShowDevToolsPref] = useState(true);
  const devToolsAvailable = entry === "test";
  const showDevTools = devToolsAvailable && showDevToolsPref;

  const { profile, setDisplayName } = useProfile();
  const { state, lastEnvelope, reset: resetGameState } = useGameState(connection);
  const { phase, inputActive, actions, matchResult } =
    useScreenPhase(state);
  const [step, setStep] = useState(0);
  const [sentLog, setSentLog] = useState<{ envelope: Envelope; sent: boolean }[]>([]);

  useEffect(() => connection.onStatusChange(setStatus), [connection]);

  // 接続が開いたら MatchmakingJoin{displayName} を1回送る。
  // サーバーは接続後の最初の1通を参加メッセージとして読み、そこで盤面の表示名を確定する
  // （送らない・遅いと接続IDへフォールバックする）。再接続＝新しい試合登録なので、
  // open するたびに送る（1接続=1試合の契約）。
  //
  // ただし送るのは「参加する意思があるとき」だけ（joinArmed）。リザルト表示中に
  // 送ってしまうと、放置しているだけで次の試合へ登録されてしまう（自動で次試合に
  // 送り込まれるバグの原因）。自分の GameOver を受け取った時点で意思を降ろす。
  const displayNameRef = useRef(profile.displayName);
  displayNameRef.current = profile.displayName;
  const joinArmedRef = useRef(false);
  useEffect(() => {
    return connection.onStatusChange((s) => {
      if (s !== "open") return;
      if (!joinArmedRef.current) return;
      connection.send(MessageType.MatchmakingJoin, {
        displayName: displayNameRef.current,
      } satisfies MatchmakingJoin);
    });
  }, [connection]);

  // 自分の試合が終わったら、この接続で次の試合へ行かないよう封をする。
  //   - 参加意思を降ろす（再接続しても MatchmakingJoin を送らない）
  //   - 自動再接続も止める（サーバーが切ったらそのまま切れたままにする）
  useEffect(() => {
    if (!matchResult) return;
    joinArmedRef.current = false;
    connection.setAutoReconnect(false);
  }, [matchResult, connection]);

  // タブを閉じる/リロードするときも待機列から抜ける。
  // 接続の close だけに任せると、サーバーが close を検知するまでの間、待機列に自分が残る。
  // pagehide は bfcache 退避でも発火するため、送るのは開いている時だけにする。
  useEffect(() => {
    const onPageHide = () => {
      if (connection.status === "open") {
        connection.send(MessageType.MatchmakingLeave, {});
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [connection]);

  // 接続/モックは in-game の間だけ動かす。title/mode/name では接続しない。
  useEffect(() => {
    if (stage !== "in-game") return;
    if (backend === "server") {
      connection.connect();
      return () => connection.disconnect();
    }
    connection.disconnect();
    const stop = startMockServer(connection, {
      selfId: profile.displayName || "you",
      displayName: profile.displayName,
    });
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

  const { selectedStrategyId } = useInputController({
    connection,
    active: inputActive,
    onCharKey: registerChar,
    // 数字を含むお題の間だけ 0-9 を打鍵に回す（それ以外は StrategySelect のまま）。
    digitsAsDaken: /[0-9]/.test(state.activeDaken[0]?.text ?? ""),
  });

  useEffect(() => {
    return connection.onOutbound((envelope, sent) =>
      setSentLog((prev) => [{ envelope, sent }, ...prev].slice(0, 10)),
    );
  }, [connection]);

  // --- 画面遷移ハンドラ ---
  // play 入口はクイックマッチ固定（サーバー）。test 入口は選んだモードに従う。
  const startPlay = useCallback(
    (name: string) => {
      setDisplayName(name);
      setBackend(entry === "play" || pendingMode === "online" ? "server" : "mock");
      // 名前は接続 open 時の MatchmakingJoin で送る（上の onStatusChange）。
      joinArmedRef.current = true;
      connection.setAutoReconnect(true);
      actions.seekMatch(); // MatchStart までは matchmaking 表示
      setStage("in-game");
    },
    [entry, pendingMode, actions, setDisplayName, connection],
  );

  // 試合が完全に終わった時刻（サーバーが接続を切った時点）から数える終了カウントダウン。
  // 到達でセッションを切ってタイトルへ戻す。練習（mock）は接続が無いので対象外。
  const [sessionEndDeadlineMs, setSessionEndDeadlineMs] = useState<number | null>(null);
  useEffect(() => {
    if (!matchResult || backend !== "server" || stage !== "in-game") {
      setSessionEndDeadlineMs(null);
      return;
    }
    if (!isConnectionFinished(status)) return;
    // 一度決めた期限は据え置く（status が揺れても伸ばさない）。
    setSessionEndDeadlineMs((prev) => prev ?? Date.now() + SESSION_END_COUNTDOWN_MS);
  }, [matchResult, backend, stage, status]);

  // マッチングから抜ける共通処理。**待機列を離れる経路は必ずここを通す。**
  //
  // サーバーは接続時にのみマッチング登録する（1接続=1試合）。つまり待機列の在籍＝接続の
  // 生存であり、接続を残したまま画面だけ戻ると待機列に自分が残る。その状態で入り直すと
  // 新しい接続がもう1件登録され、同じ名前が2人以上並ぶ（報告されたバグ）。
  //
  // 順序に意味がある:
  //   1. 参加意思を降ろす  … 以降 open しても MatchmakingJoin を送らない
  //   2. 自動再接続を止める … 切った直後に再接続して再登録されるのを防ぐ
  //   3. MatchmakingLeave  … 接続が開いている間に送る（サーバーが即座に待機列から外す）
  //   4. 接続を切る        … 在籍の実体を消す。close が遅れても 3 で先に外れている
  const leaveRoom = useCallback(() => {
    joinArmedRef.current = false;
    connection.setAutoReconnect(false);
    // 閉じた接続への送信は警告になるだけなので、開いている時だけ送る。
    if (connection.status === "open") {
      connection.send(MessageType.MatchmakingLeave, {});
    }
    connection.disconnect();
    // 前のセッションの待機者一覧・盤面を残さない（入り直した直後に古い一覧が出る）。
    resetGameState();
  }, [connection, resetGameState]);

  const exitToTitle = useCallback(() => {
    // セッションを明示的に切ってから戻る（待機列にも残さない）。
    leaveRoom();
    setSessionEndDeadlineMs(null);
    actions.backToTitle();
    setStage("title");
  }, [actions, leaveRoom]);

  // ScreenRouter に渡す合成 actions（stage 遷移を織り込む）。
  const routerActions: ScreenActions = useMemo(
    () => ({
      seekMatch: () => {
        joinArmedRef.current = true;
        connection.setAutoReconnect(true);
        actions.seekMatch();
      },
      backToTitle: exitToTitle,
      // 離脱の送信・切断は net.leave（＝leaveRoom）が済ませている。ここは画面の後始末だけ。
      leaveMatchmaking: () => {
        actions.leaveMatchmaking();
        setStage("title");
      },
      // 再マッチング＝新しいセッションを張り直す。参加意思を立て直してから join する
      // （net.join は ScreenRouter 側でこの直後に呼ばれる）。
      rematch: () => {
        joinArmedRef.current = true;
        connection.setAutoReconnect(true);
        setSessionEndDeadlineMs(null);
        actions.rematch();
      },
    }),
    [actions, exitToTitle, connection],
  );

  let body: React.ReactNode;
  if (stage === "title") {
    body = (
      <TitleScreen
        onPlay={() => {
          setEntry("play");
          setStage("name");
        }}
        // テストモードは通常非表示。URL に ?test=1 を付けたときだけ入口を出す。
        onTest={
          testEntryEnabled
            ? () => {
                setEntry("test");
                setStage("mode");
              }
            : undefined
        }
      />
    );
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
        actionLabel={
          entry === "play" ? "対戦開始" : pendingMode === "online" ? "対戦開始" : "練習開始"
        }
        // play 入口はモード選択を挟まないのでタイトルへ戻す。
        onBack={() => setStage(entry === "play" ? "title" : "mode")}
        onSubmit={startPlay}
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
              ? connection.reconnect() // open 時に MatchmakingJoin を送り直す
              : connection.send(MessageType.MatchmakingJoin, {
                  displayName: profile.displayName,
                } satisfies MatchmakingJoin),
          // 離脱は「MatchmakingLeave を送って接続も切る」までを1つの操作として扱う
          // （接続が残ると待機列に自分が残り、入り直しで二重登録になる）。
          leave: leaveRoom,
        }}
        selectedStrategyId={selectedStrategyId}
        typedPrefix={typed}
        missCount={missCount}
        selfDisplayName={profile.displayName}
        showDevTools={showDevTools}
        // play 入口では切替UI自体を出さない（本番のプレイヤーが触る画面）。
        onToggleDevTools={devToolsAvailable ? setShowDevToolsPref : undefined}
        matchResult={matchResult}
        sessionEndDeadlineMs={sessionEndDeadlineMs}
        onSessionEnd={exitToTitle}
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
          {/* 画面名・接続・生存数は開発用の情報。実運用フローでは名前だけ出す。 */}
          {devToolsAvailable && `画面: ${stage === "in-game" ? phase : stage}`}
          {devToolsAvailable &&
            stage === "in-game" &&
            showDevTools &&
            ` / 接続: ${statusLabel} / 生存: ${state.aliveCount}`}
          {profile.displayName &&
            (devToolsAvailable ? ` / 名前: ${profile.displayName}` : profile.displayName)}
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
