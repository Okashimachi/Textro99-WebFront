# log-015 画面フロー（title→mode→name→in-game）＋名前・ランキング土台

| 項目 | 値 |
|---|---|
| ログ番号 | log-015 |
| 状態 | ✅ 実装・ブラウザ検証済み（オンライン/練習 両経路） |
| 担当AI | Claude Code (claude-opus-4-8) |
| 日付 | 2026-07-26 |
| ブランチ | `feature/screen-flow`（ベース `develop`） |

> 方針: 速度優先・最小実装・拡張の継ぎ目のみ確保（memory: textro99-work-style / textro99-screen-flow-decisions）。

## 指示（要約）
早さ優先でサーバーテスト可能な状態を保ちつつ、画面遷移を実装。将来の拡張（部屋制・名前サーバー送信・厳密順位）を見越して最小実装。決定: 部屋は「まず99人キュー、後で部屋制」／名前は「サーバーに送る想定」／順位は「厳密リアルタイム（当面は近似）」。

## 成果物
- `src/screens/setup/`（TitleScreen / ModeSelectScreen / NameEntryScreen）: タイトル→モード選択→名前入力。
- `src/profile/useProfile.ts`: 表示名を localStorage 永続化。**継ぎ目**: 名前のサーバー送信 C2S が出来たら join 時に送る。
- `src/state/ranking.ts` + `src/components/hud/LiveRanking.tsx`: 試合中ランキング（近似）。**継ぎ目**: サーバー順位配信で `deriveRanking` を差し替え。
- `src/App.tsx`: stage 機械（title/mode/name/in-game）。in-game のみ接続。online=実サーバー / practice=モック。既定はタイトルから選択（本番は online 経路）。
- 部屋制は ModeSelect に「近日」枠のみ（拡張の継ぎ目）。

## テスト結果（ブラウザ実機）
- オンライン: title→mode→name(「テスター」)→対戦開始 → **実サーバー接続 open・実お題「ねこ」・生存6・名前表示** → リザルト → タイトル復帰 ✅
- 練習: →inMatch(フロント完結)・**ランキング「1 れんしゅう」**・タイピング「ramen」→「combo」 ✅
- `npm run build`（tsc+vite）成功 ✅

## 申し送り（未実装＝拡張の継ぎ目）
- 名前のサーバー送信（C2S 追加待ち）／部屋制（サーバー&Proto 拡張）／厳密リアルタイム順位（サーバー順位配信）／開始予告(⑥)は match モードの countdownMs 活用で後日。
