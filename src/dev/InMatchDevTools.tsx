// ============================================================================
// InMatchDevTools — 練習（フロント完結）モード専用の試合中デベロッパーツール（dev 専用）
//
// 試合画面ヘッダーの右側に置き、模擬サーバー相手に状況を手で作れるようにする。
//   ・ダケンを1つ自分に与える（通常 / トラップ）
//   ・出題キューを空にして短い制限時間のお題を出す（残り時間の警告表示の確認）
//   ・現在のお題を時間切れにする（DakenExpired）
//   ・トラップ失敗のペナルティを再現（スタック増加＋被弾ダケン発行）
//   ・現在のお題を手動でクリア報告（かなお題の疎通確認用）
//   ・攻撃力（コンボ）を任意の値に設定
//
// これは検証用スタブ。S2C を simulateReceive で流しているだけで、戦闘ロジックではない。
// オンライン対戦では表示しない（実サーバーの権威を侵さないため）。
// ============================================================================
import { useState } from "react";
import {
  MessageType,
  type DakenInstance,
  type DakenClearReport,
} from "@/proto/types";
import type { WsConnection } from "@/net";
import type { DakenStackState } from "@/state";
import { randomWord } from "./mockServer";

interface Props {
  connection: WsConnection;
  /** 現在の出題列（先頭＝クリア報告の対象）。 */
  activeDaken: DakenInstance[];
  /** 現在の被弾スタック（ペナルティ再現時の増分計算に使う）。 */
  dakenStack: DakenStackState;
  /** 現在の攻撃力（コンボ）。入力欄の初期値・差分計算に使う。 */
  comboValue: number;
  /** 手動クリア報告（App の onClear をそのまま渡す）。 */
  onManualClear: (report: DakenClearReport) => void;
}

let devSeq = 0;

// トラップ失敗のペナルティで積む被弾ダケンの数（練習用の目安。正典はサーバー）。
const TRAP_PENALTY_DAKEN = 2;

export function InMatchDevTools({
  connection,
  activeDaken,
  dakenStack,
  comboValue,
  onManualClear,
}: Props) {
  const [comboInput, setComboInput] = useState("");
  const current = activeDaken[0];

  /** dev 用のダケンを1件つくる。 */
  const makeDaken = (
    type: DakenInstance["type"],
    timeLimitMs = 999_999,
  ): DakenInstance => {
    devSeq += 1;
    return {
      dakenId: `dev-${devSeq}`,
      type,
      text: randomWord(),
      difficultyLevel: 0,
      timeLimitMs,
      issuedAtServerTimeMs: Date.now(),
    };
  };

  /** 自分に対してダケンを発行する（S2C DakenIssued を注入）。 */
  const giveDaken = (type: DakenInstance["type"], timeLimitMs?: number) => {
    connection.simulateReceive({
      type: MessageType.DakenIssued,
      payload: { daken: [makeDaken(type, timeLimitMs)] },
    });
  };

  /**
   * 出題キューを空にして、制限時間の短いお題を1件だけ出す。
   * DakenIssued は末尾に積まれる（reducer）ため、先頭に置くには一度空にする必要がある。
   */
  const showWarningDaken = (timeLimitMs: number) => {
    for (const d of activeDaken) {
      connection.simulateReceive({
        type: MessageType.DakenExpired,
        payload: { dakenId: d.dakenId },
      });
    }
    connection.simulateReceive({
      type: MessageType.DakenIssued,
      payload: { daken: [makeDaken("Normal", timeLimitMs)] },
    });
  };

  /** 現在のお題を時間切れにする（サーバーが送る DakenExpired 相当）。 */
  const expireCurrent = () => {
    if (!current) return;
    connection.simulateReceive({
      type: MessageType.DakenExpired,
      payload: { dakenId: current.dakenId },
    });
  };

  /**
   * トラップダケン失敗時のペナルティを再現する。
   * サーバー実装の正典ではなく「クライアント表示がどう変わるか」を見るためのスタブ:
   *   失敗したお題を消す → 被弾スタックが増える → ペナルティの被弾ダケンが積まれる。
   */
  const triggerTrapPenalty = () => {
    // トラップが現在のお題でなくても、失敗の見え方を再現できるよう先頭を落とす。
    expireCurrent();
    const limit = dakenStack.limit || 20;
    connection.simulateReceive({
      type: MessageType.DakenStackUpdated,
      payload: {
        count: Math.min(limit, dakenStack.count + TRAP_PENALTY_DAKEN),
        limit,
        trapPending: false,
      },
    });
    connection.simulateReceive({
      type: MessageType.DakenIssued,
      payload: {
        daken: Array.from({ length: TRAP_PENALTY_DAKEN }, () => makeDaken("EnemySent")),
      },
    });
  };

  /** トラップ誘発待ち（trapPending）の表示だけを立てる。 */
  const toggleTrapPending = () => {
    connection.simulateReceive({
      type: MessageType.DakenStackUpdated,
      payload: {
        count: dakenStack.count,
        limit: dakenStack.limit || 20,
        trapPending: !dakenStack.trapPending,
      },
    });
  };

  /** 攻撃力（コンボ）を指定値にする（S2C ComboUpdated を注入）。 */
  const applyCombo = (blurTarget?: HTMLElement | null) => {
    const next = Number(comboInput);
    if (!Number.isFinite(next) || comboInput.trim() === "") return;
    const value = Math.max(0, Math.floor(next));
    connection.simulateReceive({
      type: MessageType.ComboUpdated,
      payload: {
        comboValue: value,
        delta: value - comboValue,
        reason: value >= comboValue ? "Clear" : "Consumed",
      },
    });
    // 入力欄にフォーカスが残っていると打鍵がゲームに届かないので外す。
    blurTarget?.blur();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-2 border-dashed border-zinc-400 bg-zinc-50 px-2 py-1">
      <span className="mr-1 text-[10px] font-black tracking-widest text-zinc-500">
        DEV（練習）
      </span>

      <DevButton onClick={() => giveDaken("Normal")}>＋ダケン</DevButton>
      <DevButton onClick={() => giveDaken("Trap")} tone="danger">
        ＋トラップ
      </DevButton>
      <DevButton
        onClick={() => showWarningDaken(5_000)}
        title="出題キューを空にして制限時間5秒のお題を出す（残り時間の警告表示を確認する）"
      >
        警告お題(5秒)
      </DevButton>
      <DevButton
        disabled={!current}
        onClick={expireCurrent}
        title="現在のお題を時間切れにする（DakenExpired 相当）"
      >
        時間切れ
      </DevButton>
      <DevButton onClick={triggerTrapPenalty} tone="danger" title="トラップ失敗のペナルティを再現">
        トラップ失敗
      </DevButton>
      <DevButton
        onClick={toggleTrapPending}
        title="トラップ誘発待ちの表示を切り替える"
      >
        誘発待ち{dakenStack.trapPending ? "解除" : ""}
      </DevButton>

      <DevButton
        disabled={!current}
        onClick={() => {
          if (!current) return;
          // onClear 経由で送る（送信＋現在お題の active 除去をまとめて行う）。
          onManualClear({
            dakenId: current.dakenId,
            isMiss: false,
            missCount: 0,
            elapsedMs: 0,
          } satisfies DakenClearReport);
        }}
        title={current ? `${current.dakenId} “${current.text}”` : "お題なし"}
      >
        クリア報告
      </DevButton>

      <span className="ml-1 flex items-center gap-1">
        <label className="text-[10px] text-zinc-500" htmlFor="dev-combo">
          攻撃力
        </label>
        <input
          id="dev-combo"
          type="number"
          min={0}
          value={comboInput}
          placeholder={String(comboValue)}
          onChange={(e) => setComboInput(e.target.value)}
          onKeyDown={(e) => {
            // 試合中のキー入力（打鍵判定・作戦選択）へ流さない。
            e.stopPropagation();
            if (e.key === "Enter") applyCombo(e.currentTarget);
          }}
          className="w-16 border border-zinc-300 px-1 py-0.5 text-xs tabular-nums"
        />
        <DevButton
          onClick={() =>
            applyCombo(document.getElementById("dev-combo") as HTMLInputElement | null)
          }
        >
          反映
        </DevButton>
      </span>
    </div>
  );
}

function DevButton({
  children,
  onClick,
  disabled = false,
  tone = "normal",
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "normal" | "danger";
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      // 押した後もキー入力が本体に戻るようフォーカスを外す（打鍵が止まらないように）。
      onMouseUp={(e) => e.currentTarget.blur()}
      className={`border px-2 py-0.5 text-xs font-bold disabled:opacity-40 ${
        tone === "danger"
          ? "border-red-500 bg-red-50 text-red-700 enabled:hover:bg-red-100"
          : "border-zinc-400 bg-white text-zinc-700 enabled:hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}
