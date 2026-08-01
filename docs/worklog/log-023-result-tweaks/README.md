# log-023 リザルト・入力まわりのまとめ修正（5件）

このタスクのメタ情報と各記録ファイルへの入口。**1タスク＝1ディレクトリ**、内容は下記ファイルに切り分けて記録する。

| 項目 | 値 |
|---|---|
| ログ番号 | log-023 |
| 状態 | 🚧 実装・ブラウザ（練習モード＋Devモック注入）検証済み／実サーバー検証は未 |
| 担当AI | Claude Code (claude-opus-5) |
| 起票日 | 2026-08-01 |
| 完了日 | — |
| 関連ブランチ / PR | `feature/result-tweaks` |
| 関連ファイル | `src/share/postFormat.ts` / `src/share/shareText.ts` / `src/screens/sessionEnd.ts` / `src/components/hud/LiveRanking.tsx` / `src/components/hud/MatchStatusBar.tsx` / `src/components/PlayerGrid99.tsx` / `src/screens/ResultBoard.tsx` / `src/screens/MatchResultScreen.tsx` / `src/state/reducer.ts` / `src/input/useInputController.ts` / `src/App.tsx` / `src/screens/setup/TitleScreen.tsx` / `src/screens/ScreenRouter.tsx` / `src/dev/mockServer.ts` |

## 扱った5件

| # | 依頼 | 対応 |
|---|---|---|
| 1 | X のポストフォーマットをフロントでハードコードし、変更しやすいよう専用ファイルへ | `src/share/postFormat.ts` を新設 |
| 2 | 試合終了後の猶予 15秒 → 30秒 | `SESSION_END_COUNTDOWN_MS` を変更 |
| 3 | バッジの概念を表示から消す（実装は残す） | ランキング / 個人成績 / 盤面 / 上部バー / イベントログ から削除 |
| 4 | 半角数字と伸ばし棒が打てない | 入力層で `-` を許可、数字はお題に含まれる間だけ打鍵へ |
| 5 | タイトルのテストボタンとマッチングのデバッグログを消す | テストモードを非表示化（`?test=1` でのみ表示） |

## このディレクトリの構成

| ファイル | 内容 | 記入タイミング |
|---|---|---|
| [01-指示.md](./01-指示.md) | 人間 → AI の指示（原文に近い形） | 着手時 |
| [02-背景と前提.md](./02-背景と前提.md) | 背景・参照した上流ドキュメント・制約 | 着手時 |
| [03-判断と決定.md](./03-判断と決定.md) | AI の判断・決定・却下案・人間承認 | 作業中〜完了 |
| [04-成果物.md](./04-成果物.md) | 追加/変更ファイル・実装要点 | 完了時 |
| [05-テスト仕様.md](./05-テスト仕様.md) | 確認項目・手順・期待結果 | テスト時 |
| [06-テスト結果.md](./06-テスト結果.md) | 合否・実挙動・対応 | テスト時 |
| [07-トークン消費.md](./07-トークン消費.md) | 消費量・原因/過程・改善案 | 完了時（必須） |
| [08-振り返り.md](./08-振り返り.md) | 知見・上流への還元候補 | 完了時 |
