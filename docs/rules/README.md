# docs/rules — textro99-web ルール分冊

[AGENTS.md](../../AGENTS.md) から参照されるルール本体。AGENTS.md は索引と最小限の説明だけを持ち、具体的な指示はここに置く。

| # | ファイル | 内容 | いつ読むか |
|---|---|---|---|
| 1 | [01-責務と絶対原則.md](./01-責務と絶対原則.md) | クライアントの責務境界・サーバー権威・打鍵判定のみ許可・してはいけない設計 | **全作業の前提（必読）** |
| 2 | [02-フロント実装ルール.md](./02-フロント実装ルール.md) | コンポーネント分割・状態管理・環境変数・proto 版固定・RawStateDebugPane | 実装コードを書く前 |
| 3 | [03-Git運用.md](./03-Git運用.md) | ブランチ構成・Git ポリシー・コミット規約・禁止コマンド | commit / push / PR の前 |

## 運用方針

- ルールを更新するときは、このディレクトリ内の該当ファイルを編集する（AGENTS.md の索引は必要時のみ追従）。
- 上流（[Textro99-Proto](https://github.com/Okashimachi/Textro99-Proto) / [Textro99-Client-Docs](https://github.com/Okashimachi/Textro99-Client-Docs) / [Textro99-Docs](https://github.com/Okashimachi/Textro99-Docs)）と矛盾する内容をここに残さない。矛盾したら上流優先で直す。
