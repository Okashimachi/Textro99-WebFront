/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  /** X 共有時に本文の末尾に付けるURL（ゲームの公開先）。未設定ならURLなしで共有する。 */
  readonly VITE_SHARE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
