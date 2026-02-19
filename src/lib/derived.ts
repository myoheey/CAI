import type { AnchorCode } from "./scoring";
import { ANCHOR_CODES } from "./scoring";

export interface DerivedPayload {
  anchor_rank: AnchorCode[];
  bottom_anchors: AnchorCode[];
  score_stats: {
    min: number;
    max: number;
    range: number;
    mean: number;
    stdev: number;
  };
  score_pattern: "balanced" | "polarized" | "spiky";
  growth_gaps: Array<{ anchor: AnchorCode; gap: number }>;
  tradeoff_candidates: Array<{ focus: AnchorCode; sacrifice: AnchorCode }>;
}

interface BuildDerivedInput {
  anchors: Record<AnchorCode, number>;
  growth_intentions: Record<string, number> | null;
}

const TENSION_RULES: Array<{ focus: AnchorCode; pair: AnchorCode }> = [
  { focus: "AU", pair: "SE" },
  { focus: "SE", pair: "AU" },
  { focus: "CH", pair: "SE" },
  { focus: "EC", pair: "SE" },
  { focus: "TF", pair: "GM" },
  { focus: "GM", pair: "TF" },
  { focus: "LS", pair: "GM" },
  { focus: "SV", pair: "EC" }
];

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStdev(values: number[], mean: number): number {
  if (values.length === 0) {
    return 0;
  }

  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function buildDerived({ anchors, growth_intentions }: BuildDerivedInput): DerivedPayload {
  const rankedPairs = [...ANCHOR_CODES]
    .map((code) => ({ code, score: anchors[code] }))
    .sort((a, b) => {
      if (b.score === a.score) {
        return a.code.localeCompare(b.code);
      }
      return b.score - a.score;
    });

  const anchor_rank = rankedPairs.map((entry) => entry.code);
  const bottom_anchors = anchor_rank.slice(-2);
  const scoresSorted = rankedPairs.map((entry) => entry.score);
  const s1 = scoresSorted[0] ?? 0;
  const s2 = scoresSorted[1] ?? 0;
  const s3 = scoresSorted[2] ?? 0;
  const s4 = scoresSorted[3] ?? 0;
  const s5 = scoresSorted[4] ?? 0;
  const s6 = scoresSorted[5] ?? 0;
  const s7 = scoresSorted[6] ?? 0;
  const s8 = scoresSorted[7] ?? 0;
  const range = s1 - s8;
  const top2_avg = (s1 + s2) / 2;
  const mid4_avg = (s3 + s4 + s5 + s6) / 4;
  const bot2_avg = (s7 + s8) / 2;

  let score_pattern: DerivedPayload["score_pattern"] = "spiky";
  if (range <= 18) {
    score_pattern = "balanced";
  } else if (
    top2_avg - bot2_avg >= 30 &&
    top2_avg - mid4_avg >= 10 &&
    mid4_avg - bot2_avg >= 10
  ) {
    score_pattern = "polarized";
  }

  const min = Math.min(...scoresSorted);
  const max = Math.max(...scoresSorted);
  const mean = average(scoresSorted);
  const stdev = populationStdev(scoresSorted, mean);

  const growth_gaps = growth_intentions
    ? Object.entries(growth_intentions)
        .filter(([key]) => ANCHOR_CODES.includes(key as AnchorCode))
        .map(([key, target]) => {
          const anchor = key as AnchorCode;
          const gap = Number(target) - anchors[anchor];
          return { anchor, gap: roundOneDecimal(gap) };
        })
    : [];

  const top2 = anchor_rank.slice(0, 2);
  const fallbackSacrifice = bottom_anchors[0] ?? "LS";

  const tradeoff_candidates = top2.map((focus) => {
    const tension = TENSION_RULES.find((rule) => rule.focus === focus);
    if (!tension) {
      return { focus, sacrifice: fallbackSacrifice };
    }

    const sacrifice = bottom_anchors.includes(tension.pair) ? tension.pair : fallbackSacrifice;
    return { focus, sacrifice };
  });

  return {
    anchor_rank,
    bottom_anchors,
    score_stats: {
      min: roundOneDecimal(min),
      max: roundOneDecimal(max),
      range: roundOneDecimal(range),
      mean: roundOneDecimal(mean),
      stdev: roundOneDecimal(stdev)
    },
    score_pattern,
    growth_gaps,
    tradeoff_candidates
  };
}
