import type { AnswersMap, QuestionBank, QuestionBankItem } from "./types";

export const ANCHOR_CODES = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"] as const;

export type AnchorCode = (typeof ANCHOR_CODES)[number];
export type AnchorScores = Record<AnchorCode, number>;

export function sumScores(values: number[]): number {
  return values.reduce((total, current) => total + current, 0);
}

export function applyReverseScoring(answer: number, min: number, max: number): number {
  return min + max - answer;
}

function computeRawForItem(item: QuestionBankItem, answer: number, min: number, max: number): number {
  return item.reverse ? applyReverseScoring(answer, min, max) : answer;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function normalizeScore(raw: number, countItems: number, min: number, max: number): number {
  if (countItems <= 0) {
    return 0;
  }

  const minPossible = countItems * min;
  const maxPossible = countItems * max;

  if (maxPossible === minPossible) {
    return 0;
  }

  const normalized = ((raw - minPossible) / (maxPossible - minPossible)) * 100;
  return roundOneDecimal(normalized);
}

export function computeAnchorScores(questionBank: QuestionBank, answers: AnswersMap): AnchorScores {
  const { min, max } = questionBank.scale;
  const byAnchor = new Map<AnchorCode, QuestionBankItem[]>();

  for (const anchor of ANCHOR_CODES) {
    byAnchor.set(anchor, []);
  }

  for (const item of questionBank.items) {
    byAnchor.get(item.anchor_code)?.push(item);
  }

  const result = {} as AnchorScores;

  for (const anchor of ANCHOR_CODES) {
    const items = byAnchor.get(anchor) ?? [];
    const scoredValues: number[] = [];

    for (const item of items) {
      const answer = answers[item.id];
      if (typeof answer !== "number") {
        continue;
      }
      scoredValues.push(computeRawForItem(item, answer, min, max));
    }

    const raw = sumScores(scoredValues);
    result[anchor] = normalizeScore(raw, items.length, min, max);
  }

  return result;
}
