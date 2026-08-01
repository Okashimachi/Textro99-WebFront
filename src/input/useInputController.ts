// ============================================================================
// 入力送信層 — 操作3種のみをサーバーへ送る
//
// 操作は「文字キー（打鍵）／0-9（StrategySelect）」の2種のみ。それ以外のキーは無視する。
//
// **重要（docs/rules/01 §2）**: raw keydown を1文字ずつサーバーへ送らない。
//   - 文字キーは打鍵判定 (#8 TypingJudge) へ渡すだけ（`onCharKey`）。判定結果は
//     ダケン単位で `DakenClearReport` に集約して送る（この層の責務外）。
//   - 0-9 → `StrategySelect` のみ即時送信する。
//
// 攻撃は「Enter で撃つ」をやめ、サーバーがノーミスクリアを起点に自動発火する契約になった
// （AttackRequest 廃止・server #77）。クライアントから攻撃を送る経路は無い。
// ============================================================================

import { useEffect, useState } from "react";
import { MessageType, type StrategySelect } from "@/proto/types";
import type { WsConnection } from "@/net";

export interface InputControllerOptions {
  connection: WsConnection;
  /** その画面で自操作が有効か（観戦・非対戦画面では false）。false の間はキーを無視。 */
  active: boolean;
  /** 文字キー（打鍵）の受け渡し先。#8 TypingJudge が実装するまでは呼び出しのみ。 */
  onCharKey?: (char: string) => void;
  /**
   * 0-9 を打鍵として扱うか。**現在のお題に半角数字が含まれる間だけ true** にする。
   *
   * 0-9 は本来 StrategySelect 専用（docs/rules/01 §7）だが、それだと数字を含むお題が
   * 打てない。お題に数字がある時だけ打鍵へ回し、それ以外は従来どおり作戦選択に使う。
   * 判定は呼び出し側（お題を知っている側）が行い、この層は渡された通りに振り分ける。
   */
  digitsAsDaken?: boolean;
}

export interface InputController {
  /** 直近に送信した戦略ID（0-9）。未選択は null。StrategySelector のハイライト用。 */
  selectedStrategyId: number | null;
}

/** 単一の印字可能文字か（Enter/矢印/Fキー等の複数文字キー名を除外）。 */
function isSingleChar(key: string): boolean {
  return key.length === 1;
}

/**
 * 打鍵対象の文字か（ローマ字入力想定）。
 *
 * 英字に加えて `-`（伸ばし棒 ー の受理綴り）を含める。`ー` は romaji.ts で `-` に対応
 * づけているのに、ここで弾いていたため打てなかった。
 * 数字は原則 StrategySelect 側で消費するため、ここには含めない（→ digitsAsDaken）。
 */
function isDakenChar(key: string): boolean {
  return /^[a-zA-Z-]$/.test(key);
}

export function useInputController(
  options: InputControllerOptions,
): InputController {
  const { connection, active, onCharKey, digitsAsDaken = false } = options;
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      // 修飾キー付き（ショートカット）は無視。IME 変換中も無視。
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;

      // 数字を含むお題を打っている間は、0-9 を打鍵として扱う（作戦選択より優先）。
      if (digitsAsDaken && isSingleChar(e.key) && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        onCharKey?.(e.key);
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
  }, [connection, active, onCharKey, digitsAsDaken]);

  return { selectedStrategyId };
}
