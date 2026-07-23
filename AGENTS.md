# AGENTS.md — textro99-web

AIエージェント（Claude Code / Codex / Cursor 等）が毎セッション最初に読む索引。**ルール本体は [`docs/rules/`](./docs/rules/) に分冊**。該当作業の前に必ず読むこと。

## このリポジトリは何か

「テキストロ99」（99人タイピングバトロワ）の **Webテストフロント（React + TS + Vite + Tailwind）**。サーバー（Go）を検証する開発期間中の主力テストハーネスで、本番は Unity（このリポは本番ではない）。接続・プロトコル層は **Unity 流用の参照実装**を兼ねる。コードは AI 生成前提。

> ⚠️ プロダクト名は `textro99`。旧称 `sushida99` が残る箇所があるが使わない。リネーム禁止。

## 上流リポジトリ（正典。矛盾したら上流優先・こちらを直す）

| リポジトリ | 役割 |
|---|---|
| [Textro99-Proto](https://github.com/Okashimachi/Textro99-Proto) | 共有契約（DTO/メッセージ/スキーマ/ローマ字）。**契約は変更しない**（Proto で人間承認） |
| [Textro99-Client-Docs](https://github.com/Okashimachi/Textro99-Client-Docs) | Web/Unity 共通クライアント設計。Web はこれをミラー実装 |
| [Textro99-Docs](https://github.com/Okashimachi/Textro99-Docs) | 企画・ゲーム/サーバー仕様。本リポ仕様は `04_クライアント仕様/02_Webフロント仕様.md` |
| [用語集](https://github.com/Okashimachi/Textro99-Docs/blob/main/01_企画/00_用語集.md) | 日本語↔コード名の正典。**変数/型/関数名はここに合わせる**（`Daken`/`Combo`/`TypingJudge` 等） |

## ルール本体（docs/rules/）

| # | ファイル | いつ読むか |
|---|---|---|
| 1 | [01-責務と絶対原則](./docs/rules/01-責務と絶対原則.md)（責務境界・サーバー権威・打鍵判定のみ許可） | **全作業の前提** |
| 2 | [02-フロント実装ルール](./docs/rules/02-フロント実装ルール.md)（分割・状態管理・環境変数・proto 版固定） | 実装前 |
| 3 | [03-Git運用](./docs/rules/03-Git運用.md)（ブランチ・コミット規約・禁止コマンド） | commit / push 前 |
| 4 | [04-PRとレビュー](./docs/rules/04-PRとレビュー.md)（PR の流れ・レビュー観点・マージ権限） | PR 前 |

## 作業ログ（docs/worklog/）

指示・判断・テスト・トークン消費を **1タスク＝1ディレクトリ**で残す（[README](./docs/worklog/README.md)）。着手時に [`_template/`](./docs/worklog/_template/) をコピーし `log-NNN-{主題}/`（連番・欠番なし）で起票、完了時に 03/06/07 を必ず埋め索引に追加。

## 最優先の禁止（詳細は各分冊）

- ❌ JS/TS に戦闘ロジックを書く（例外は打鍵判定のみ）→ [01](./docs/rules/01-責務と絶対原則.md)
- ❌ 契約（型/メッセージ/スキーマ）を本リポで変更・確定する → [01](./docs/rules/01-責務と絶対原則.md)
- ❌ **`develop`/`main` へマージする**（指示があっても不可・人間が行う）→ [03](./docs/rules/03-Git運用.md)
- ❌ `git reset --hard` / `git rebase -i` / `rm -rf` を指示なく実行 → [03](./docs/rules/03-Git運用.md)
- ❌ 秘密情報（本番URL・トークン）をコミット → [03](./docs/rules/03-Git運用.md)
