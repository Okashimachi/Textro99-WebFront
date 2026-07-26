// プレイヤープロフィール（表示名）。localStorage に永続化する。
// 拡張の継ぎ目: 将来サーバーへ名前を送る C2S（例 JoinMatch{displayName} / SetName）が
// 追加されたら、この profile を join 時に送る。現状サーバーは名前を受け取らない（p-NN 付与）ため
// クライアント側で保持・表示するのみ。
import { useCallback, useState } from "react";

export interface Profile {
  displayName: string;
}

const KEY = "textro99.profile";

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { displayName: "", ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    /* noop */
  }
  return { displayName: "" };
}

export interface UseProfile {
  profile: Profile;
  setDisplayName: (name: string) => void;
}

export function useProfile(): UseProfile {
  const [profile, setProfile] = useState<Profile>(load);

  const setDisplayName = useCallback((name: string) => {
    setProfile((prev) => {
      const next = { ...prev, displayName: name };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return { profile, setDisplayName };
}
