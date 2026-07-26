# log-016 ローマ字入力（かな→受理ローマ字）判定 — #8 本実装

| 項目 | 値 |
|---|---|
| ログ番号 | log-016 |
| 状態 | ✅ 実装・ブラウザ検証済み |
| 担当AI | Claude Code (claude-opus-4-8) |
| 日付 | 2026-07-27 |
| ブランチ | `feature/romaji-typing`（ベース `develop`）|
| 関連 | #8。方針: 速度優先・最小実装（memory: textro99-work-style）|

## 概要
サーバーが送る**かな**お題を、クライアントで**かな→受理ローマ字**に変換して打鍵判定する（#8 の本丸）。表記ゆれ・拗音・促音・ん に対応。

## 決定
- ローマ字テーブルは本来 Proto 共有データだが、ユーザー指示で**暫定 web 実装**（`src/typing/romaji.ts` に隔離）。Proto 版が入れば **romaji.ts だけ差し替え**れば判定側は不変（`toRomajiUnits` の戻り値の形が契約）。
- §4「やってはいけないこと」に独自ローマ字テーブルは含まれず（打鍵判定は例外）。契約(型/メッセージ)は無改変。

## 成果物
- `src/typing/romaji.ts`（新）: かな→打鍵単位＋受理ローマ字候補。カタカナ正規化・拗音・促音・ん・表記ゆれ。`romajiHint()`。
- `src/typing/judge.ts`: 直接照合 → **候補マッチ（prefix フォールバックで si/shi・っ・ん を解決）** に差し替え。API 不変（`createJudge/feedChar/typedPrefix/elapsedMs`）。
- `src/typing/useTypingJudge.ts`: 変更なし（同 API）。
- `src/components/hud/DakenDisplay.tsx`: かなの下にローマ字ヒント表示。
- `src/dev/mockServer.ts`: 練習モードの出題を**かな**に変更（実サーバーに合わせ判定を実運用）。

## テスト（ブラウザ実機）
- 練習(かな)10問をヒント通り打鍵 → 全クリア・ミス0（でんしゃ/とうきょう/がっこう(促音)/しょうり(拗音)/こんぼ(ん) 等）。
- 表記ゆれ受理: ちゃわん←chawann、しゃしん←shasinn、ふじ←fuzi（sha/cha/fu/ji/tsu/shi 系）。
- **実サーバー**: かなお題「そら」を「sora」で打鍵 → `DakenClearReport{p-73-2,isMiss:false}` を実送信(→)。
- `npm run build`（tsc+vite）成功。

## 申し送り
- 表記ゆれは主要形のみ（暫定）。Proto RomajiTable 取り込み時に `romaji.ts` を差し替え。
- サーバーモードで「クリア済みお題が次へ進む」表示挙動は、サーバーの DakenExpired/DakenIssued 送出に依存（reducer 既存挙動）。要観察（別途）。
