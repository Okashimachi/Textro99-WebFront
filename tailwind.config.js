/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // 配色は Tailwind 標準パレット（zinc / red / amber / emerald / sky）だけで組む。
    // 独自トークンを足すと tailwind.config.js の変更＝dev サーバー再起動が必要になり、
    // 「再起動を忘れると色が全部消える」事故につながるため、あえて拡張しない。
    extend: {},
  },
  plugins: [],
};
