// ============================================================================
// かな → 受理ローマ字列 変換（打鍵判定用）
//
// ⚠️ 暫定実装（web ローカル）。本来はローマ字テーブルを Proto の共有データとして
// 人間承認で追加し取り込む方針（proto/README・#8）。ここは Proto 版が入るまでの
// 差し替え前提スタブ。**この1ファイルを差し替えれば判定側は変えずに移行できる**ように
// してある（toRomajiUnits の戻り値の形だけ維持すること）。
//
// 方針:
//  - お題（かな）を「打鍵単位（unit）」に分割し、各 unit に受理ローマ字の候補列を持たせる。
//  - 表記ゆれを候補で表現（し=si/shi、つ=tu/tsu、じ=zi/ji …）。
//  - 拗音（きゃ 等）は2かなで1 unit。促音（っ）は次の unit に子音重ね＋xtu/ltu で吸収。
//  - ん は "nn"/"n"/"xn" を候補に持つ（曖昧さは判定側の prefix フォールバックで解決）。
//  - かな以外（英字など）は1文字=1 unit のリテラル（そのまま打鍵）。モック英単語もこれで動く。
// ============================================================================

export interface RomajiUnit {
  /** この unit が対応する原文（かな）。表示ハイライトの進捗計算に使う。 */
  source: string;
  /** 受理するローマ字綴りの候補（いずれか完全一致で完了）。 */
  candidates: string[];
}

// 単かな（濁点・半濁点含む）→ ローマ字候補。
const BASE: Record<string, string[]> = {
  あ: ["a"], い: ["i"], う: ["u"], え: ["e"], お: ["o"],
  か: ["ka"], き: ["ki"], く: ["ku"], け: ["ke"], こ: ["ko"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  さ: ["sa"], し: ["si", "shi"], す: ["su"], せ: ["se"], そ: ["so"],
  ざ: ["za"], じ: ["zi", "ji"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  た: ["ta"], ち: ["ti", "chi"], つ: ["tu", "tsu"], て: ["te"], と: ["to"],
  だ: ["da"], ぢ: ["di"], づ: ["du"], で: ["de"], ど: ["do"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["hu", "fu"], へ: ["he"], ほ: ["ho"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  わ: ["wa"], ゐ: ["i"], ゑ: ["e"], を: ["wo", "o"],
  ぁ: ["la", "xa"], ぃ: ["li", "xi"], ぅ: ["lu", "xu"], ぇ: ["le", "xe"], ぉ: ["lo", "xo"],
  ゃ: ["lya", "xya"], ゅ: ["lyu", "xyu"], ょ: ["lyo", "xyo"], っ: ["ltu", "xtu"],
  ー: ["-"],
  "、": [","], "。": ["."], "　": [" "], " ": [" "],
};

// 拗音（子音 + 小さいゃゅょ）。
const YOUON: Record<string, string[]> = {
  きゃ: ["kya"], きゅ: ["kyu"], きょ: ["kyo"],
  ぎゃ: ["gya"], ぎゅ: ["gyu"], ぎょ: ["gyo"],
  しゃ: ["sya", "sha"], しゅ: ["syu", "shu"], しょ: ["syo", "sho"],
  じゃ: ["zya", "ja", "jya"], じゅ: ["zyu", "ju", "jyu"], じょ: ["zyo", "jo", "jyo"],
  ちゃ: ["tya", "cha", "cya"], ちゅ: ["tyu", "chu", "cyu"], ちょ: ["tyo", "cho", "cyo"],
  ぢゃ: ["dya"], ぢゅ: ["dyu"], ぢょ: ["dyo"],
  にゃ: ["nya"], にゅ: ["nyu"], にょ: ["nyo"],
  ひゃ: ["hya"], ひゅ: ["hyu"], ひょ: ["hyo"],
  びゃ: ["bya"], びゅ: ["byu"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴゅ: ["pyu"], ぴょ: ["pyo"],
  みゃ: ["mya"], みゅ: ["myu"], みょ: ["myo"],
  りゃ: ["rya"], りゅ: ["ryu"], りょ: ["ryo"],
};

const SMALL_YOUON = new Set(["ゃ", "ゅ", "ょ"]);
const VOWELS = new Set(["a", "i", "u", "e", "o"]);

/** カタカナ→ひらがな（お題がカタカナでも判定できるように正規化）。 */
function toHiragana(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    // カタカナ ァ(0x30A1)〜ヶ(0x30F6) を ひらがな へ。長音符ーはそのまま。
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCodePoint(code - 0x60);
    else out += ch;
  }
  return out;
}

/** 促音を次 unit の候補へ反映（子音重ね ＋ xtu/ltu/ltsu）。 */
function applySokuon(next: RomajiUnit): RomajiUnit {
  const cands = new Set<string>();
  for (const c of next.candidates) {
    const head = c[0];
    if (head && !VOWELS.has(head)) cands.add(head + c); // 子音重ね（tta 等）
    cands.add("xtu" + c);
    cands.add("ltu" + c);
    cands.add("ltsu" + c);
  }
  return { source: "っ" + next.source, candidates: [...cands] };
}

/**
 * お題（かな/英字）を打鍵単位に分割し、各単位に受理ローマ字候補を持たせる。
 * この戻り値の形（RomajiUnit[]）が判定エンジンとの契約。Proto 版に差し替える時もこの形を保つ。
 */
export function toRomajiUnits(source: string): RomajiUnit[] {
  const s = toHiragana(source);
  const units: RomajiUnit[] = [];
  let sokuonPending = false;

  const push = (u: RomajiUnit) => {
    units.push(sokuonPending ? applySokuon(u) : u);
    sokuonPending = false;
  };

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    // 促音
    if (ch === "っ") {
      // 連続する っ や 末尾の っ は単体リテラルとして出す（まれ）。
      if (next === "っ" || next === undefined) {
        push({ source: "っ", candidates: BASE["っ"] });
      } else {
        sokuonPending = true;
      }
      continue;
    }

    // 拗音（子音 + 小ゃゅょ）
    if (next && SMALL_YOUON.has(next)) {
      const key = ch + next;
      if (YOUON[key]) {
        push({ source: key, candidates: YOUON[key] });
        i++; // 小書きを消費
        continue;
      }
    }

    // ん
    if (ch === "ん") {
      push({ source: "ん", candidates: ["nn", "n", "xn"] });
      continue;
    }

    // 単かな
    if (BASE[ch]) {
      push({ source: ch, candidates: BASE[ch] });
      continue;
    }

    // かな以外（英字など）はリテラル（そのまま打鍵）。
    push({ source: ch, candidates: [ch.toLowerCase()] });
  }

  // 末尾に促音が残った場合の保険
  if (sokuonPending) units.push({ source: "っ", candidates: BASE["っ"] });

  return units;
}

/** 表示用のローマ字ヒント（各 unit の第1候補を連結）。 */
export function romajiHint(source: string): string {
  return toRomajiUnits(source)
    .map((u) => u.candidates[0] ?? "")
    .join("");
}
