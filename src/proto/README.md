# src/proto — vendored proto 型

[Textro99-Proto](https://github.com/Okashimachi/Textro99-Proto) の TypeScript 契約（`ts/types.ts`）を**手コピー（vendoring）**で取り込んだもの。当面 npm レジストリは使わない。

## 現在の版

| 項目 | 値 |
|---|---|
| proto バージョン | **v0.1.1+**（v0.1.1 タグ以降の `textro-main`。次タグ未発行） |
| 取得元コミット | `42fb05e`（`MatchmakingStatus` に `players` 追加・`countdownMs` を残り時間へ） |
| 取得日 | 2026-08-01 |
| 取り込みファイル | `types.ts`（`@okashimachi/textro99-proto` の `ts/types.ts` の写し） |

## 原則

- **このディレクトリのファイルは編集しない。** 契約の正典は Proto 側（[docs/rules/01](../../docs/rules/01-責務と絶対原則.md)）。型を変えたい場合は Proto 側で人間承認のうえ変更し、ここへ同期する。
- web の実装は proto 型をここ（`src/proto`）からのみ import する。import パスを1箇所に集約し、将来 npm 化しても付け替えを局所化する。
  ```ts
  import type { MatchStart, KoNotified } from "@/proto/types";
  import { MessageType } from "@/proto/types";
  ```

## 同期手順（proto 更新時）

1. Proto 側の対象バージョン（タグ）を確認する。互換表は Proto の README。
2. Proto の `ts/types.ts` で `src/proto/types.ts` を**丸ごと置き換える**（部分編集しない）。先頭の vendor ヘッダの版・コミット・取得日を更新する。
3. 上表「現在の版」を更新する。
4. 型変更に追随して web 実装の壊れた箇所を直す。
5. 破壊的変更なら、PR のレビュー観点（[docs/rules/04](../../docs/rules/04-PRとレビュー.md)）で契約差分を確認する。

## 未取り込み（今後）

- **ローマ字テーブルの共有データ**：打鍵判定（TypingJudge）が使うが、現時点で Proto に未実装。打鍵判定 lib 着手時に Proto へ追加（人間承認）してから取り込む。
- **npm 依存への移行**：proto が publish 運用（認証・CI）に乗ったら、手コピーから版固定の npm 依存へ切り替える。
