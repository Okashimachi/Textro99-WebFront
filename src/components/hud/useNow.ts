// 表示カウントダウン用の現在時刻フック（display 専用）。
// 一定間隔で再描画するだけで、戦闘判定には一切関与しない。
import { useEffect, useState } from "react";

export function useNow(intervalMs = 100): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
