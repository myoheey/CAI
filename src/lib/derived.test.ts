import { describe, expect, it } from "vitest";

import { buildDerived } from "./derived";

describe("buildDerived", () => {
  it("uses stable tie-break by anchor code asc", () => {
    const derived = buildDerived({
      anchors: { TF: 70, GM: 70, AU: 60, SE: 50, EC: 40, SV: 30, CH: 20, LS: 10 },
      growth_intentions: null
    });

    expect(derived.anchor_rank[0]).toBe("GM");
    expect(derived.anchor_rank[1]).toBe("TF");
  });

  it("classifies balanced pattern", () => {
    const derived = buildDerived({
      anchors: { TF: 50, GM: 52, AU: 48, SE: 51, EC: 49, SV: 50, CH: 53, LS: 47 },
      growth_intentions: null
    });

    expect(derived.score_pattern).toBe("balanced");
  });

  it("classifies polarized pattern", () => {
    const derived = buildDerived({
      anchors: { TF: 95, GM: 90, AU: 65, SE: 60, EC: 58, SV: 55, CH: 25, LS: 20 },
      growth_intentions: null
    });

    expect(derived.score_pattern).toBe("polarized");
  });

  it("returns empty growth gaps when intentions are null", () => {
    const derived = buildDerived({
      anchors: { TF: 10, GM: 20, AU: 30, SE: 40, EC: 50, SV: 60, CH: 70, LS: 80 },
      growth_intentions: null
    });

    expect(derived.growth_gaps).toEqual([]);
  });
});
