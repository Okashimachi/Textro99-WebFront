# Textro99-WebFront

「テキストロ99」（99人バトルロイヤル型タイピングゲーム）の **Webテストフロント**（React + TypeScript + Vite + Tailwind）。
開発チーム「おかしまち」のハッカソン開発用。

> **位置づけ**：本番クライアントではなく、開発期間中の**主力テストハーネス**。サーバー（Go）の戦闘ロジック＋通信を検証し、デプロイして複数人テストに使う。本番は Unity/unityroom（[Textro99-Unity](https://github.com/Okashimachi/Textro99-Unity)）。
> このフロントの接続・プロトコル層は、後で Unity が同じ構造でミラーして流用する **参照実装** を兼ねる。

- ルール・責務・禁止事項の入口 → **[AGENTS.md](./AGENTS.md)**（作業前に必読）。ルール本体は [docs/rules/](./docs/rules/) に分冊。

---

## 関連リポジトリ（上流が正典。矛盾したら上流優先）

| リポジトリ | 内容 |
|---|---|
| [Textro99-Proto](https://github.com/Okashimachi/Textro99-Proto) | 全リポジトリ唯一の共有契約（DTO/メッセージ/GameParameters スキーマ/ローマ字テーブル） |
| [Textro99-Client-Docs](https://github.com/Okashimachi/Textro99-Client-Docs) | Web/Unity 共通クライアント設計（本リポがミラー実装する） |
| [Textro99-Docs](https://github.com/Okashimachi/Textro99-Docs) | 企画・ゲーム/サーバー仕様の正典（本リポの仕様は `04_クライアント仕様/02_Webフロント仕様.md`） |
| **本リポジトリ** | Webテストフロント実装 |

---

## 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| フレームワーク | React 18 + TypeScript | AI生成の精度・修正耐性が高い。分割＋型が AI へのガードレール |
| ビルド | Vite | セットアップ最小・起動高速 |
| 状態管理 | なし（useState/useReducer のみ） | 状態の実体はサーバー側。フロントは受信 state を写すだけ |
| スタイル | Tailwind CSS | クラス指定だけで見た目指示が通り AI と相性が良い |
| 通信 | WebSocket / JSON | proto の DTO と同一 |
| 契約 | [`@okashimachi/textro99-proto`](https://github.com/Okashimachi/Textro99-Proto)（バージョン固定） | 送受信する型・共有ローマ字データの正典 |

---

## クイックスタート

```bash
npm install
cp .env.example .env   # 接続先 WebSocket URL を設定
npm run dev
```

- 接続先URL（例 `VITE_WS_URL`）は **環境変数で切替**（ローカル / デプロイ版→本番サーバー）。コードに直書きしない。
- サーバー（Go）は `--mode solo`（1クライアントで戦闘ロジック単体デバッグ）/ `--mode match`（本番相当の同期）で起動できる。

> proto は GitHub Packages 配布。`.npmrc` にスコープ設定が必要:
> ```
> @okashimachi:registry=https://npm.pkg.github.com
> ```

---

## 通信モデル（A案：クライアント打鍵判定・サーバー権威）

```
[サーバー (Go)]  ← 戦闘ロジックの権威。ここを検証するのが目的
      ↕ WebSocket (JSON, proto契約)  ← Unity も同じエンドポイントに接続
[React + TS + Vite (AI生成)]
  - 打鍵判定はローカル（TypingJudge、ローマ字テーブルは proto 共有データ）
  - ダケンをクリア/ミス/時間切れ → DakenClearReport（ダケン単位）を送信
  - 受信 state JSON → 画面反映（表示は完全に受信 state ベース）
```

**操作は3種のみ**：文字キー（打鍵）／Enter（`AttackRequest`）／0〜9（`StrategySelect`）。

---

## コンポーネント構成（たたき台）

各コンポーネントは proto の DTO のみを入力とし、内部にゲーム判定ロジックを持たない。

`RawStateDebugPane`（受信JSON生表示）/ `DakenDisplay` / `ComboGauge` / `DakenStackView` / `AttackWarningBar` / `PlayerGrid99` / `StrategySelector` / `EventLog`

> **RawStateDebugPane を最初に作る**：UIにバグがあっても正データをここで確認でき、「サーバーのバグか表示のバグか」を即切り分けできる。

---

## デプロイ

- 静的ファイルのみ → Vercel / Cloudflare Pages 等。
- push 毎自動デプロイ。**PRプレビューURLが自動発行される**と「このPRの画面で複数人テストして」が楽。

---

## ブランチ運用

```
main ← develop ← feature/xxx
```
`git push` / PR 作成は自由。**`develop` / `main` へのマージは人間のみ**（詳細は [docs/rules/03-Git運用.md](./docs/rules/03-Git運用.md)）。
