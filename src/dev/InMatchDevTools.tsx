// ============================================================================
// InMatchDevTools — 練習（フロント完結）モード専用の試合中デベロッパーツール（dev 専用）
//
// 試合画面ヘッダーの右側に置き、模擬サーバー相手に状況を手で作れるようにする。
//   ・ダケンを1つ自分に与える（通常 / トラップ）
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
import { randomWord } from "./mockServer";

interface Props {
  connection: WsConnection;
  /** 現在の出題列（先頭＝クリア報告の対象）。 */
  activeDaken: DakenInstance[];
  /** 現在の攻撃力（コンボ）。入力欄の初期値・差分計算に使う。 */
  comboValue: number;
  /** 手動クリア報告（App の onClear をそのまま渡す）。 */
  onManualClear: (report: DakenClearReport) => void;
}

let devSeq = 0;

export function InMatchDevTools({
  connection,
  activeDaken,
  comboValue,
  onManualClear,
}: Props) {
  const [comboInput, setComboInput] = useState("");
  const current = activeDaken[0];

  /** 自分に対してダケンを1つ発行する（S2C DakenIssued を注入）。 */
  const giveDaken = (type: DakenInstance["type"]) => {
    devSeq += 1;
    connection.simulateReceive({
      type: MessageType.DakenIssued,
      payload: {
        daken: [
          {
            dakenId: `dev-${devSeq}`,
            type,
            text: randomWord(),
            difficultyLevel: 0,
            timeLimitMs: 999_999,
            issuedAtServerTimeMs: Date.now(),
          },
        ],
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
