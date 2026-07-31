# log-021 リザルトのモーダル化とマッチングセッションの終端制御

このタスクのメタ情報と各記録ファイルへの入口。**1タスク＝1ディレクトリ**、内容は下記ファイルに切り分けて記録する。

| 項目 | 値 |
|---|---|
| ログ番号 | log-021 |
| 状態 | 🚧 実装・ブラウザ（練習モード）検証済み／実サーバー検証は未 |
| 担当AI | Claude Code (claude-opus-5) |
| 起票日 | 2026-08-01 |
| 完了日 | — |
| 関連ブランチ / PR | `feature/matchmaking-waiting-info` |
| 関連ファイル | `src/App.tsx` / `src/net/connection.ts` / `src/screens/lifecycle.ts` / `src/screens/useScreenPhase.ts` / `src/screens/ScreenRouter.tsx` / `src/screens/ResultScreen.tsx` / `src/screens/ResultOverlay.tsx` / `src/screens/sessionEnd.ts` / `src/screens/InMatchScreen.tsx` / `src/screens/index.ts` |

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
