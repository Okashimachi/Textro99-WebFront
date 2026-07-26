// アプリのルート。実際の画面切替・接続配線は後続 Issue（#4/#5/#9…）で追加する。
// ここでは scaffold の起動確認用の空ページのみ。
import { MessageType } from "@/proto/types";

export function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">テキストロ99 — Web テストフロント</h1>
        <p className="mt-2 text-slate-400">
          scaffold 起動 OK（proto {Object.keys(MessageType).length} 種のメッセージ型を参照）
        </p>
      </div>
    </div>
  );
}
