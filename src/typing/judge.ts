// ============================================================================
// タイピング判定エンジン（#8 TypingJudge の中核・純関数）
//
// 責務境界（docs/rules/01 §1,§3）: ここが計算してよいのは「打鍵がお題に一致したか」
// だけ。コンボ/威力/相殺/KO 等の戦闘数値は一切算出しない（サーバー確定）。
// 判定結果はダケン単位で集約し、完了時に DakenClearReport を1件出す材料を返す。
//
// 変換方式（今セッションの決定）: お題テキストを「打鍵列そのもの（ローマ字/英字）」と
// みなし、先頭から1文字ずつ直接照合する。かな→ローマ字テーブルは持たない
// （proto/README の方針: RomajiTable は Proto へ人間承認で追加してから取り込む）。
// お題がローマ字/英字である前提。将来かな判定を入れる時はこの層を差し替える。
// ============================================================================

export interface JudgeState {
  /** 判定対象のダケンID（DakenClearReport 用）。 */
  readonly dakenId: string;
  /** お題の打鍵列（ローマ字/英字）。 */
  readonly target: string;
  /** 先頭から連続一致した文字数（＝正しく打てた長さ）。 */
  readonly typedCount: number;
  /** ミス打鍵の累計。 */
  readonly missCount: number;
  /** 最初の打鍵時刻（ms）。未打鍵なら null。 */
  readonly startedAtMs: number | null;
  /** お題を打ち切ったか。 */
  readonly done: boolean;
}

export interface FeedResult {
  readonly state: JudgeState;
  /** 期待文字に一致したか。 */
  readonly accepted: boolean;
  /** この打鍵でお題が完了したか。 */
  readonly justCompleted: boolean;
}

export function createJudge(dakenId: string, target: string): JudgeState {
  return {
    dakenId,
    target,
    typedCount: 0,
    missCount: 0,
    startedAtMs: null,
    done: false,
  };
}

/** 正しく打てた先頭部分（ハイライト表示用）。 */
export function typedPrefix(s: JudgeState): string {
  return s.target.slice(0, s.typedCount);
}

/**
 * 打鍵1文字を与えて判定を進める純関数。
 * 期待文字に一致すれば typedCount を進め、外れれば missCount を増やす（位置は進めない）。
 * @param nowMs 現在時刻（テスト容易性のため注入可能。既定は Date.now()）
 */
export function feedChar(s: JudgeState, ch: string, nowMs: number = Date.now()): FeedResult {
  if (s.done) return { state: s, accepted: false, justCompleted: false };

  const startedAtMs = s.startedAtMs ?? nowMs;
  const expected = s.target[s.typedCount];

  // 大文字小文字は無視して比較（お題は小文字前提だが保険）。
  if (expected !== undefined && ch.toLowerCase() === expected.toLowerCase()) {
    const typedCount = s.typedCount + 1;
    const done = typedCount >= s.target.length;
    return {
      state: { ...s, typedCount, startedAtMs, done },
      accepted: true,
      justCompleted: done,
    };
  }

  return {
    state: { ...s, missCount: s.missCount + 1, startedAtMs },
    accepted: false,
    justCompleted: false,
  };
}

/** 完了時の所要時間（ms）。未打鍵・未完了は 0。 */
export function elapsedMs(s: JudgeState, nowMs: number = Date.now()): number {
  return s.startedAtMs === null ? 0 : nowMs - s.startedAtMs;
}
