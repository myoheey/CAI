import { describe, expect, it } from "vitest";

import { applyReverseScoring, computeAnchorScores, normalizeScore } from "./scoring";
import type { QuestionBank } from "./types";

describe("scoring", () => {
  it("reverse scoring works", () => {
    expect(applyReverseScoring(1, 1, 5)).toBe(5);
    expect(applyReverseScoring(4, 1, 5)).toBe(2);
  });

  it("normalization yields values in 0..100", () => {
    expect(normalizeScore(1, 1, 1, 5)).toBe(0);
    expect(normalizeScore(5, 1, 1, 5)).toBe(100);
    expect(normalizeScore(3, 1, 1, 5)).toBe(50);
  });

  it("computes anchor scores with reverse items", () => {
    const bank: QuestionBank = {
      version: "anchor_v1.2",
      scale: { min: 1, max: 5, labels: [] },
      items: [
        { id: "Q01", text: "", anchor_code: "TF", reverse: false },
        { id: "Q02", text: "", anchor_code: "TF", reverse: true }
      ]
    };

    const scores = computeAnchorScores(bank, { Q01: 5, Q02: 1 });
    expect(scores.TF).toBe(100);
  });
});
