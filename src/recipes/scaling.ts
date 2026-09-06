const UNICODE_FRACTIONS: Readonly<Record<string, string>> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [0.125, "1/8"],
  [0.25, "1/4"],
  [0.333, "1/3"],
  [0.5, "1/2"],
  [0.667, "2/3"],
  [0.75, "3/4"],
];

type Replacement = {
  start: number;
  end: number;
  text: string;
};

function decimalToMixedNumber(decimal: number): string {
  if (decimal === 0) return "0";

  const whole = Math.floor(decimal);
  const fraction = decimal - whole;
  if (fraction < 0.01) return whole.toString();

  let closest = "";
  let minDiff = Number.POSITIVE_INFINITY;
  for (const [value, label] of FRACTIONS) {
    const difference = Math.abs(fraction - value);
    if (difference < minDiff) {
      minDiff = difference;
      closest = label;
    }
  }

  if (minDiff < 0.02) {
    return whole > 0 ? `${whole} ${closest}` : closest;
  }
  return decimal.toFixed(2).replace(/\.?0+$/, "");
}

export function scaleIngredient(ingredient: string, scale: number): string {
  if (scale === 1) return ingredient;

  let result = ingredient;
  for (const [unicode, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    result = result.replace(new RegExp(`(\\d)${unicode}`, "g"), `$1 ${ascii}`);
    result = result.replace(new RegExp(unicode, "g"), ascii);
  }

  const replacements: Replacement[] = [];
  const add = (match: RegExpExecArray, text: string) => {
    if (
      !replacements.some(
        (replacement) => match.index >= replacement.start && match.index < replacement.end,
      )
    ) {
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        text,
      });
    }
  };

  const patterns: ReadonlyArray<{
    regex: RegExp;
    scaleMatch: (match: RegExpExecArray) => string;
  }> = [
    {
      regex: /\b(\d+)\s+(\d+)\/(\d+)\s*[-–]\s*(\d+)\s+(\d+)\/(\d+)\b/g,
      scaleMatch: (match) => {
        const first = Number(match[1]) + Number(match[2]) / Number(match[3]);
        const second = Number(match[4]) + Number(match[5]) / Number(match[6]);
        return `${decimalToMixedNumber(first * scale)}-${decimalToMixedNumber(second * scale)}`;
      },
    },
    {
      regex: /\b(\d+)\/(\d+)\s*[-–]\s*(\d+)\/(\d+)\b/g,
      scaleMatch: (match) => {
        const first = Number(match[1]) / Number(match[2]);
        const second = Number(match[3]) / Number(match[4]);
        return `${decimalToMixedNumber(first * scale)}-${decimalToMixedNumber(second * scale)}`;
      },
    },
    {
      regex: /\b(\d+)\s+(\d+)\/(\d+)\b/g,
      scaleMatch: (match) =>
        decimalToMixedNumber((Number(match[1]) + Number(match[2]) / Number(match[3])) * scale),
    },
    {
      regex: /\b(\d+)\/(\d+)\b/g,
      scaleMatch: (match) => decimalToMixedNumber((Number(match[1]) / Number(match[2])) * scale),
    },
    {
      regex: /\b(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)(?!\.?\d)/g,
      scaleMatch: (match) =>
        `${decimalToMixedNumber(Number(match[1]) * scale)}-${decimalToMixedNumber(Number(match[2]) * scale)}`,
    },
    {
      regex: /\b(\d+(?:\.\d+)?)(?!\.?\d|\/\d)/g,
      scaleMatch: (match) => decimalToMixedNumber(Number(match[1]) * scale),
    },
  ];

  for (const { regex, scaleMatch } of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(result)) !== null) {
      add(match, scaleMatch(match));
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  for (const replacement of replacements) {
    result = result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end);
  }
  return result;
}
