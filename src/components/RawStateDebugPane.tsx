// ============================================================================
// RawStateDebugPane — 受信 state / 直近 Envelope の生 JSON 表示
//
// docs/rules/02 §2: 最初に作るペイン。AI 生成 UI にバグがあっても、正データを
// ここで常に確認でき「サーバー(ロジック)のバグか表示のバグか」を即切り分けられる。
// 整形表示以外のロジックは持たない。
// ============================================================================
import { useState } from "react";
import type { Envelope } from "@/proto/types";
import type { GameViewModel } from "@/state";

interface Props {
  state: GameViewModel;
  lastEnvelope: Envelope | null;
}

type Tab = "state" | "envelope";

export function RawStateDebugPane({ state, lastEnvelope }: Props) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("state");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 rounded bg-slate-700 px-3 py-1 text-xs text-slate-100 shadow hover:bg-slate-600"
      >
        Debug ▲
      </button>
    );
  }

  const json =
    tab === "state"
      ? JSON.stringify(state, null, 2)
      : JSON.stringify(lastEnvelope, null, 2);

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-72 w-full max-w-md flex-col border-l border-t border-slate-700 bg-slate-950/95 text-slate-100 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-700 px-2 py-1 text-xs">
        <span className="font-bold">RawStateDebugPane</span>
        <div className="ml-2 flex gap-1">
          <TabButton active={tab === "state"} onClick={() => setTab("state")}>
            state
          </TabButton>
          <TabButton active={tab === "envelope"} onClick={() => setTab("envelope")}>
            last envelope
          </TabButton>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="ml-auto rounded px-2 py-0.5 hover:bg-slate-700"
        >
          ▼
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-2 text-[11px] leading-tight">
        {json}
      </pre>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-0.5 ${
        active ? "bg-slate-600" : "bg-slate-800 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
