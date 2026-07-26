// ============================================================================
// タイピング判定エンジン（#8 TypingJudge の中核・純関数）
//
// 責務境界（docs/rules/01 §1,§3）: 判定してよいのは「打鍵がお題に一致したか」だけ。
// コンボ/威力/相殺/KO 等の戦闘数値は算出しない（サーバー確定）。完了時に
// DakenClearReport{dakenId,isMiss,missCount,elapsedMs} の材料を返す。
//
// 変換: お題（かな）を romaji.ts で「打鍵単位＋受理ローマ字候補」に分割し、
// キーを1文字ずつ候補にマッチさせる。表記ゆれ（し=si/shi 等）・拗音・促音・ん に対応。
// ローマ字テーブルは暫定 web 実装（romaji.ts）。Proto 版が入ればそこだけ差し替える。
// ============================================================================

import { toRomajiUnits, type RomajiUnit } from "./romaji";

export interface JudgeState {
  readonly dakenId: string;
  /** お題の原文（かな/英字）。 */
  readonly source: string;
  readonly units: RomajiUnit[];
  /** 現在打っている unit の index。 */
  readonly unitIndex: number;
  /** 現在 unit の未確定入力（候補の途中）。 */
  readonly buffer: string;
  readonly missCount: number;
  readonly startedAtMs: number | null;
  readonly done: boolean;
}

export interface FeedResult {
  readonly state: JudgeState;
  readonly accepted: boolean;
  readonly justCompleted: boolean;
}

export function createJudge(dakenId: string, source: string): JudgeState {
  const units = toRomajiUnits(source);
  return {
    dakenId,
    source,
    units,
    unitIndex: 0,
    buffer: "",
    missCount: 0,
    startedAtMs: null,
    done: units.length === 0,
  };
}

/** 確定済み unit がカバーする原文（かな）の先頭部分。ハイライト表示用。 */
export function typedPrefix(s: JudgeState): string {
  let n = 0;
  for (let i = 0; i < s.unitIndex && i < s.units.length; i++) n += s.units[i].source.length;
  return s.source.slice(0, n);
}

/** 完了時の所要時間（ms）。未打鍵・未完了は 0。 */
export function elapsedMs(s: JudgeState, nowMs: number = Date.now()): number {
  return s.startedAtMs === null ? 0 : nowMs - s.startedAtMs;
}

/**
 * 打鍵1文字を与えて判定を進める純関数。
 * - 現在 unit の候補に prefix 一致すれば buffer を伸ばす。完全一致（かつより長い候補が無い）で unit 確定。
 * - 一致しない時、buffer が既にある候補と完全一致なら unit を確定して、その文字を次 unit で処理し直す
 *   （ん の "n"/"nn" のような prefix 競合をこれで解消）。それでも駄目ならミス。
 */
export function feedChar(s: JudgeState, ch: string, nowMs: number = Date.now()): FeedResult {
  if (s.done) return { state: s, accepted: false, justCompleted: false };

  const startedAtMs = s.startedAtMs ?? nowMs;
  const c = ch.toLowerCase();

  // 1打鍵を、必要なら unit をまたいで処理する内部ループ。
  let unitIndex = s.unitIndex;
  let buffer = s.buffer;

  // フォールバック用: 現 buffer が候補完全一致なら unit 確定して次へ送る、を最大 units 回。
  for (let guard = 0; guard <= s.units.length; guard++) {
    const unit = s.units[unitIndex];
    if (!unit) break; // お題を超えた

    const tentative = buffer + c;
    const viable = unit.candidates.filter((cand) => cand.startsWith(tentative));

    if (viable.length > 0) {
      const nextBuffer = tentative;
      const exact = unit.candidates.includes(tentative);
      const hasLonger = viable.some((cand) => cand.length > tentative.length);
      if (exact && !hasLonger) {
        // unit 確定
        const nextIndex = unitIndex + 1;
        const done = nextIndex >= s.units.length;
        return {
          state: { ...s, unitIndex: nextIndex, buffer: "", startedAtMs, done },
          accepted: true,
          justCompleted: done,
        };
      }
      // まだ途中
      return {
        state: { ...s, unitIndex, buffer: nextBuffer, startedAtMs },
        accepted: true,
        justCompleted: false,
      };
    }

    // tentative が伸ばせない。buffer が既に候補完全一致なら unit を確定して次 unit で c を再処理。
    if (buffer !== "" && unit.candidates.includes(buffer)) {
      unitIndex += 1;
      buffer = "";
      continue; // 次 unit で c を試す
    }

    break; // ミス
  }

  return {
    state: { ...s, missCount: s.missCount + 1, startedAtMs },
    accepted: false,
    justCompleted: false,
  };
}
