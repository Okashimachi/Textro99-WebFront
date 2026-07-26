// ============================================================================
// 入力送信層 — 操作3種のみをサーバーへ送る
//
// docs/rules/01 §7: 操作は「文字キー（打鍵）／Enter（AttackRequest）／0-9（StrategySelect）」の
// 3種のみ。それ以外のキーは無視する。
//
// **重要（docs/rules/01 §2）**: raw keydown を1文字ずつサーバーへ送らない。
//   - 文字キーは打鍵判定 (#8 TypingJudge) へ渡すだけ（`onCharKey`）。判定結果は
//     ダケン単位で `DakenClearReport` に集約して送る（この層の責務外）。
//   - Enter → `AttackRequest`、0-9 → `StrategySelect` のみ即時送信する。
//
// 戦闘数値（consumedCombo）はローカル算出しない。サーバーが全消費し consumedCombo は
// 現状無視される（proto 注記）。表示中コンボ値をそのまま添える。
// ============================================================================

import { useEffect, useState } from "react";
import { MessageType, type AttackRequest, type StrategySelect } from "@/proto/types";
import type { WsConnection } from "@/net";

export interface InputControllerOptions {
  connection: WsConnection;
  /** その画面で自操作が有効か（観戦・非対戦画面では false）。false の間はキーを無視。 */
  active: boolean;
  /** 文字キー（打鍵）の受け渡し先。#8 TypingJudge が実装するまでは呼び出しのみ。 */
  onCharKey?: (char: string) => void;
  /** AttackRequest に添える表示中コンボ値（サーバーは現状無視・全消費）。 */
  consumedCombo?: number;
}

export interface InputController {
  /** 直近に送信した戦略ID（0-9）。未選択は null。StrategySelector のハイライト用。 */
  selectedStrategyId: number | null;
}

/** 単一の印字可能文字か（Enter/矢印/Fキー等の複数文字キー名を除外）。 */
function isSingleChar(key: string): boolean {
  return key.length === 1;
}

/** 打鍵対象の文字か（ローマ字入力想定。英字を基本とする）。 */
function isDakenChar(key: string): boolean {
  return /^[a-zA-Z]$/.test(key);
}

export function useInputController(
  options: InputControllerOptions,
): InputController {
  const { connection, active, onCharKey, consumedCombo = 0 } = options;
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      // 修飾キー付き（ショートカット）は無視。IME 変換中も無視。
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;

      // Enter → AttackRequest
      if (e.key === "Enter") {
        e.preventDefault();
        const payload: AttackRequest = { consumedCombo };
        connection.send(MessageType.AttackRequest, payload);
        return;
      }

      // 0-9 → StrategySelect
      if (isSingleChar(e.key) && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const strategyId = Number(e.key);
        const payload: StrategySelect = { strategyId };
        connection.send(MessageType.StrategySelect, payload);
        setSelectedStrategyId(strategyId);
        return;
      }

      // 文字キー → 打鍵判定へ渡すだけ（1文字ごとに送信しない）
      if (isSingleChar(e.key) && isDakenChar(e.key)) {
        e.preventDefault();
        onCharKey?.(e.key);
        return;
      }

      // それ以外は無視
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [connection, active, onCharKey, consumedCombo]);

  return { selectedStrategyId };
}
