/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 「戦況コンソール」テーマ（白背景＋赤アクセントの情報密度重視 HUD）。
      // 表示のためのトークンであり、戦闘ロジックとは無関係。
      colors: {
        paper: "#ececed", // 画面全体の下地
        panel: "#ffffff", // パネル面
        head: "#f4f4f5", // パネルヘッダ帯
        line: "#d5d5d8", // 罫線
        ink: "#1b1b1d", // 主要文字
        sub: "#8b8b90", // 補助文字
        accent: {
          DEFAULT: "#e8402a", // 赤（自分の攻撃・危険）
          soft: "#fdeae7",
          dark: "#b62d1b",
        },
        ok: "#2f7d4f", // 安全
        warn: "#d99100", // 注意
      },
      fontFamily: {
        hud: ['"Helvetica Neue"', "Arial", '"Hiragino Sans"', "Meiryo", "sans-serif"],
      },
    },
  },
  plugins: [],
};
