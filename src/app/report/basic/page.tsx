"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps
} from "recharts";
import PdfDownloadButton from "@/components/PdfDownloadButton";

const RESULT_KEY = "cai_last_scoring_result_v1";

type AnchorCode = "TF" | "GM" | "AU" | "SE" | "EC" | "SV" | "CH" | "LS";
type ScoresByAnchor = Record<AnchorCode, number>;

interface ScoringEnvelope {
  input: {
    scores: {
      anchors: ScoresByAnchor;
    };
    has_intake?: boolean;
  };
  derived: {
    anchor_rank: string[];
    bottom_anchors: string[];
    score_pattern: "balanced" | "polarized" | "spiky";
    score_stats: {
      min: number;
      max: number;
      range: number;
      mean: number;
      stdev: number;
    };
    tradeoff_candidates: Array<{ focus: string; sacrifice: string }>;
    growth_gaps: Array<{ anchor: string; gap: number }>;
  };
}

const ANCHOR_COLORS: Record<string, string> = {
  TF: "#2d6cdf",
  GM: "#7c3aed",
  AU: "#059669",
  SE: "#d97706",
  EC: "#dc2626",
  SV: "#ec4899",
  CH: "#0891b2",
  LS: "#65a30d"
};

const ANCHOR_ICONS: Record<string, string> = {
  TF: "\u{1F3AF}",
  GM: "\u{1F451}",
  AU: "\u{1F985}",
  SE: "\u{1F6E1}\uFE0F",
  EC: "\u{1F680}",
  SV: "\u{1F49A}",
  CH: "\u26A1",
  LS: "\u2696\uFE0F"
};

const ANCHOR_INFO: Record<
  string,
  { label: string; description: string; energy: string; stress: string }
> = {
  TF: {
    label: "\uAE30\uC220/\uAE30\uB2A5 \uC804\uBB38\uC131",
    description:
      "\uD2B9\uC815 \uBD84\uC57C\uC758 \uC804\uBB38 \uC9C0\uC2DD\uACFC \uAE30\uC220\uC744 \uC2EC\uD654\uD558\uACE0 \uC804\uBB38\uAC00\uB85C\uC11C \uC778\uC815\uBC1B\uB294 \uAC83\uC5D0 \uAC00\uCE58\uB97C \uB461\uB2C8\uB2E4.",
    energy:
      "\uC804\uBB38 \uAE30\uC220\uC744 \uBC1C\uD718\uD560 \uB54C, \uD574\uB2F9 \uBD84\uC57C\uC5D0\uC11C \uAD8C\uC704\uC790\uB85C \uC778\uC815\uBC1B\uC744 \uB54C",
    stress:
      "\uC804\uBB38\uC131\uACFC \uBB34\uAD00\uD55C \uC5C5\uBB34\uB97C \uD560 \uB54C, \uC81C\uB108\uB7F4\uB9AC\uC2A4\uD2B8\uAC00 \uB418\uB77C\uB294 \uC694\uAD6C\uB97C \uBC1B\uC744 \uB54C"
  },
  GM: {
    label: "\uAD00\uB9AC \uC5ED\uB7C9",
    description:
      "\uC870\uC9C1\uC744 \uC774\uB04C\uACE0, \uC0AC\uB78C\uB4E4\uC744 \uAD00\uB9AC\uD558\uBA70, \uC758\uC0AC\uACB0\uC815\uC5D0 \uC601\uD5A5\uC744 \uBBF8\uCE58\uB294 \uAC83\uC5D0 \uB3D9\uAE30\uBD80\uC5EC\uB97C \uBC1B\uC2B5\uB2C8\uB2E4.",
    energy:
      "\uD300\uC744 \uC774\uB044\uACE0 \uC758\uC0AC\uACB0\uC815\uC744 \uB0B4\uB9B4 \uB54C, \uC870\uC9C1\uC801 \uC131\uACFC\uB97C \uB0BC \uB54C",
    stress:
      "\uC601\uD5A5\uB825\uC774 \uC81C\uD55C\uB420 \uB54C, \uB2E8\uC21C \uC2E4\uBB34\uB9CC \uC694\uAD6C\uB420 \uB54C"
  },
  AU: {
    label: "\uC790\uC728/\uB3C5\uB9BD",
    description:
      "\uC790\uC2E0\uB9CC\uC758 \uBC29\uC2DD\uC73C\uB85C \uC77C\uD558\uACE0, \uADDC\uCE59\uC774\uB098 \uC808\uCC28\uC5D0 \uC597\uB9E4\uC774\uC9C0 \uC54A\uB294 \uC790\uC720\uB97C \uCD94\uAD6C\uD569\uB2C8\uB2E4.",
    energy:
      "\uC790\uC720\uB86D\uAC8C \uC77C\uD560 \uB54C, \uC790\uC2E0\uC758 \uC2A4\uCF00\uC904\uACFC \uBC29\uBC95\uC744 \uC120\uD0DD\uD560 \uC218 \uC788\uC744 \uB54C",
    stress:
      "\uBBF8\uC138 \uAD00\uB9AC\uB97C \uBC1B\uC744 \uB54C, \uACBD\uC9C1\uB41C \uC870\uC9C1 \uBB38\uD654\uC5D0\uC11C \uC77C\uD560 \uB54C"
  },
  SE: {
    label: "\uC548\uC815/\uBCF4\uC7A5",
    description:
      "\uC608\uCE21 \uAC00\uB2A5\uD55C \uD658\uACBD, \uACE0\uC6A9 \uC548\uC815, \uC7AC\uC815\uC801 \uBCF4\uC7A5 \uB4F1 \uC548\uC815\uAC10\uC744 \uC6B0\uC120\uC2DC\uD569\uB2C8\uB2E4.",
    energy:
      "\uC548\uC815\uC801\uC778 \uACE0\uC6A9\uACFC \uC608\uCE21 \uAC00\uB2A5\uD55C \uD658\uACBD\uC5D0\uC11C \uC77C\uD560 \uB54C",
    stress:
      "\uBD88\uD655\uC2E4\uC131\uC774 \uB192\uC744 \uB54C, \uAD6C\uC870\uC870\uC815\uC774\uB098 \uBCC0\uD654\uAC00 \uBC18\uBCF5\uB420 \uB54C"
  },
  EC: {
    label: "\uAE30\uC5C5\uAC00\uC801 \uCC3D\uC758\uC131",
    description:
      "\uC0C8\uB85C\uC6B4 \uC0AC\uC5C5\uC774\uB098 \uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uACE0, \uC544\uC774\uB514\uC5B4\uB97C \uD604\uC2E4\uB85C \uAD6C\uD604\uD558\uB294 \uAC83\uC5D0 \uC5F4\uC815\uC744 \uB290\uB08D\uB2C8\uB2E4.",
    energy:
      "\uC0C8\uB85C\uC6B4 \uAC83\uC744 \uB9CC\uB4E4\uACE0 \uCC3D\uC870\uD560 \uB54C, \uC544\uC774\uB514\uC5B4\uB97C \uC2E4\uD604\uD560 \uB54C",
    stress:
      "\uBC18\uBCF5\uC801\uC774\uACE0 \uC815\uD615\uD654\uB41C \uC5C5\uBB34\uB97C \uD560 \uB54C, \uD610\uC2E0\uC774 \uB9C9\uD790 \uB54C"
  },
  SV: {
    label: "\uBD09\uC0AC/\uD5CC\uC2E0",
    description:
      "\uC138\uC0C1\uC744 \uB354 \uB098\uC740 \uACF3\uC73C\uB85C \uB9CC\uB4E4\uACE0, \uD0C0\uC778\uC744 \uB3D5\uACE0, \uC0AC\uD68C\uC801 \uAC00\uCE58\uB97C \uC2E4\uD604\uD558\uB294 \uB370 \uC758\uBBF8\uB97C \uB461\uB2C8\uB2E4.",
    energy:
      "\uC0AC\uD68C\uC801 \uC758\uBBF8\uAC00 \uC788\uB294 \uC77C\uC744 \uD560 \uB54C, \uB204\uAD70\uAC00\uB97C \uB3C4\uC6B8 \uB54C",
    stress:
      "\uC774\uC775\uB9CC \uCD94\uAD6C\uD558\uB294 \uD658\uACBD\uC5D0\uC11C, \uAC00\uCE58\uAD00\uACFC \uCDA9\uB3CC\uD558\uB294 \uC5C5\uBB34\uB97C \uD560 \uB54C"
  },
  CH: {
    label: "\uC21C\uC218\uD55C \uB3C4\uC804",
    description:
      "\uC5B4\uB835\uACE0 \uBCF5\uC7A1\uD55C \uBB38\uC81C\uB97C \uD574\uACB0\uD558\uB294 \uAC83 \uC790\uCCB4\uC5D0\uC11C \uC131\uCDE8\uAC10\uC744 \uC5BB\uC73C\uBA70, \uACBD\uC7C1\uACFC \uADF9\uBCF5\uC744 \uC990\uAE41\uB2C8\uB2E4.",
    energy:
      "\uB09C\uC81C\uB97C \uD480 \uB54C, \uACBD\uC7C1\uC5D0\uC11C \uC2B9\uB9AC\uD560 \uB54C, \uBD88\uAC00\uB2A5\uC744 \uAC00\uB2A5\uC73C\uB85C \uB9CC\uB4E4 \uB54C",
    stress:
      "\uB108\uBB34 \uC27D\uAC70\uB098 \uBC18\uBCF5\uC801\uC778 \uC77C\uC744 \uD560 \uB54C, \uB3C4\uC804 \uAE30\uD68C\uAC00 \uC5C6\uC744 \uB54C"
  },
  LS: {
    label: "\uB77C\uC774\uD504\uC2A4\uD0C0\uC77C",
    description:
      "\uC77C\uACFC \uC0B6\uC758 \uADE0\uD615\uC744 \uC911\uC2DC\uD558\uBA70, \uCEE4\uB9AC\uC5B4\uAC00 \uAC1C\uC778 \uC0DD\uD65C\uACFC \uC870\uD654\uB97C \uC774\uB8E8\uB294 \uAC83\uC744 \uC6B0\uC120\uD569\uB2C8\uB2E4.",
    energy:
      "\uC77C\uACFC \uC0B6\uC774 \uC870\uD654\uB85C\uC6B8 \uB54C, \uAC1C\uC778 \uC2DC\uAC04\uC774 \uBCF4\uC7A5\uB420 \uB54C",
    stress:
      "\uACFC\uB3C4\uD55C \uC5C5\uBB34\uB7C9\uC774\uB098 \uC7A5\uC2DC\uAC04 \uADFC\uBB34\uB97C \uC694\uAD6C\uBC1B\uC744 \uB54C"
  }
};

const PATTERN_DESCRIPTIONS: Record<string, { title: string; detail: string; tagColor: string }> = {
  balanced: {
    title: "\uADE0\uD615\uD615",
    detail:
      "8\uAC1C \uC575\uCEE4 \uC810\uC218\uAC00 \uBE44\uAD50\uC801 \uACE0\uB974\uAC8C \uBD84\uD3EC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uC591\uD55C \uAC00\uCE58\uB97C \uD3ED\uB113\uAC8C \uCD94\uAD6C\uD558\uB294 \uC720\uD615\uC73C\uB85C, \uC5EC\uB7EC \uD658\uACBD\uC5D0 \uC801\uC751\uD558\uAE30 \uC27D\uC9C0\uB9CC \uD575\uC2EC \uC6B0\uC120\uC21C\uC704\uB97C \uBA85\uD655\uD788 \uD558\uBA74 \uC758\uC0AC\uACB0\uC815\uC774 \uB354 \uC218\uC6D4\uD574\uC9D1\uB2C8\uB2E4.",
    tagColor: "#059669"
  },
  polarized: {
    title: "\uC591\uADF9\uD654\uD615",
    detail:
      "\uC0C1\uC704 \uC575\uCEE4\uC640 \uD558\uC704 \uC575\uCEE4 \uAC04\uC758 \uCC28\uC774\uAC00 \uB69C\uB837\uD569\uB2C8\uB2E4. \uC790\uC2E0\uC774 \uC911\uC694\uC2DC\uD558\uB294 \uAC00\uCE58\uAC00 \uBA85\uD655\uD558\uBA70, \uADF8\uC5D0 \uB9DE\uB294 \uD658\uACBD\uC5D0\uC11C \uB192\uC740 \uBAB0\uC785\uACFC \uC131\uACFC\uB97C \uBCF4\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uD558\uC704 \uC575\uCEE4\uAC00 \uC694\uAD6C\uB418\uB294 \uC0C1\uD669\uC5D0\uC11C\uB294 \uC2A4\uD2B8\uB808\uC2A4\uB97C \uB290\uB084 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    tagColor: "#d97706"
  },
  spiky: {
    title: "\uC2A4\uD30C\uC774\uD06C\uD615",
    detail:
      "\uD2B9\uC815 \uC575\uCEE4\uAC00 \uB208\uC5D0 \uB744\uAC8C \uB192\uAC70\uB098 \uB0AE\uC2B5\uB2C8\uB2E4. \uBA87 \uAC00\uC9C0 \uD575\uC2EC \uAC00\uCE58\uAC00 \uAC15\uD558\uAC8C \uC791\uB3D9\uD558\uBA70, \uD574\uB2F9 \uC601\uC5ED\uC5D0\uC11C \uD0C1\uC6D4\uD55C \uC131\uACFC\uB97C \uB0BC \uAC00\uB2A5\uC131\uC774 \uB192\uC2B5\uB2C8\uB2E4.",
    tagColor: "#dc2626"
  }
};

function anchorLabel(code: string) {
  return ANCHOR_INFO[code]?.label ?? code;
}

function ScoreBar({ code, score, rank }: { code: string; score: number; rank: number }) {
  const color = ANCHOR_COLORS[code] || "#2d6cdf";
  const icon = ANCHOR_ICONS[code] || "";
  const info = ANCHOR_INFO[code];
  const isTop3 = rank <= 3;

  return (
    <div className={`score-bar-row ${isTop3 ? "score-bar-top" : ""}`}>
      <div className="score-bar-label">
        <span className="score-bar-icon">{icon}</span>
        <span className="score-bar-name">{info?.label ?? code}</span>
        {rank <= 3 && <span className="score-bar-rank" style={{ background: color }}>TOP {rank}</span>}
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
        <span className="score-bar-value">{score}</span>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as { anchor: string; score: number };
  const color = ANCHOR_COLORS[point.anchor] || "#2d6cdf";
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-icon">{ANCHOR_ICONS[point.anchor]}</span>
      <strong style={{ color }}>{anchorLabel(point.anchor)}</strong>
      <span className="chart-tooltip-score">{point.score}\uC810</span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export default function BasicReportPage() {
  const [result, setResult] = useState<ScoringEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ScoringEnvelope;
      if (parsed.input?.scores?.anchors && parsed.derived?.anchor_rank) {
        setResult(parsed);
      }
    } catch {
      setError("\uACB0\uACFC \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }, []);

  const chartData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.input.scores.anchors).map(([anchor, score]) => ({
      anchor,
      label: anchorLabel(anchor),
      score
    }));
  }, [result]);

  const rankedData = useMemo(() => {
    if (!result) return [];
    return result.derived.anchor_rank.map((code, i) => ({
      code,
      score: result.input.scores.anchors[code as AnchorCode],
      rank: i + 1
    }));
  }, [result]);

  if (!result) {
    return (
      <main className="report-page">
        <h1>\uAE30\uBCF8 \uBD84\uC11D \uB9AC\uD3EC\uD2B8</h1>
        <p>\uD45C\uC2DC\uD560 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD574\uC8FC\uC138\uC694.</p>
        {error ? <p className="report-error">{error}</p> : null}
      </main>
    );
  }

  const { derived } = result;
  const top3 = derived.anchor_rank.slice(0, 3);
  const bottom2 = derived.bottom_anchors;
  const pattern = PATTERN_DESCRIPTIONS[derived.score_pattern];
  const tradeoffs = derived.tradeoff_candidates ?? [];

  return (
    <main className="report-page">
      <div id="basic-report-content">
        {/* ===== HEADER ===== */}
        <header className="rpt-hero">
          <div className="rpt-hero-badge">\uAE30\uBCF8 \uBD84\uC11D</div>
          <h1 className="rpt-hero-title">\uCEE4\uB9AC\uC5B4 \uC575\uCEE4 \uBD84\uC11D \uB9AC\uD3EC\uD2B8</h1>
          <p className="rpt-hero-sub">
            \uB2F9\uC2E0\uC758 8\uAC00\uC9C0 \uCEE4\uB9AC\uC5B4 \uAC00\uCE58 \uC810\uC218\uB97C \uAE30\uBC18\uC73C\uB85C \uD55C \uBD84\uC11D \uACB0\uACFC\uC785\uB2C8\uB2E4.
          </p>
        </header>

        {/* ===== PATTERN BADGE ===== */}
        <section className="rpt-pattern-section">
          <div className="rpt-pattern-tag" style={{ background: pattern?.tagColor ?? "#666" }}>
            {pattern?.title ?? derived.score_pattern}
          </div>
          <p className="rpt-pattern-detail">{pattern?.detail}</p>
          <div className="rpt-stats-row">
            <StatCard label="\uD3C9\uADE0" value={`${derived.score_stats.mean.toFixed(0)}\uC810`} />
            <StatCard label="\uCD5C\uACE0" value={`${derived.score_stats.max.toFixed(0)}\uC810`} />
            <StatCard label="\uCD5C\uC800" value={`${derived.score_stats.min.toFixed(0)}\uC810`} />
            <StatCard label="\uD3B8\uCC28" value={`${derived.score_stats.range.toFixed(0)}\uC810`} />
          </div>
        </section>

        {/* ===== RADAR CHART ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">\uD83D\uDCCA</span>
            \uC575\uCEE4 \uD504\uB85C\uD544
          </h2>
          <div className="rpt-chart-container">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={chartData} outerRadius="70%">
                <PolarGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <PolarAngleAxis
                  dataKey="anchor"
                  tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                    const code = payload.value;
                    const color = ANCHOR_COLORS[code] || "#666";
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          textAnchor="middle"
                          dy={-8}
                          fill={color}
                          fontSize={18}
                        >
                          {ANCHOR_ICONS[code]}
                        </text>
                        <text
                          textAnchor="middle"
                          dy={10}
                          fill={color}
                          fontSize={11}
                          fontWeight={600}
                        >
                          {code}
                        </text>
                      </g>
                    );
                  }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Radar
                  dataKey="score"
                  stroke="#2d6cdf"
                  strokeWidth={2}
                  fill="url(#radarGradient)"
                  fillOpacity={0.5}
                />
                <defs>
                  <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2d6cdf" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#2d6cdf" stopOpacity={0.5} />
                  </radialGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ===== SCORE BARS ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">\uD83C\uDFC6</span>
            \uC575\uCEE4 \uC810\uC218 \uC21C\uC704
          </h2>
          <div className="rpt-score-bars">
            {rankedData.map(({ code, score, rank }) => (
              <ScoreBar key={code} code={code} score={score} rank={rank} />
            ))}
          </div>
        </section>

        {/* ===== TOP ANCHORS ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">\u2B50</span>
            \uD575\uC2EC \uC575\uCEE4 TOP 3
          </h2>
          <p className="rpt-section-desc">\uB2F9\uC2E0\uC774 \uAC00\uC7A5 \uC911\uC694\uD558\uAC8C \uC5EC\uAE30\uB294 \uCEE4\uB9AC\uC5B4 \uAC00\uCE58\uC785\uB2C8\uB2E4.</p>
          <div className="rpt-anchor-cards">
            {top3.map((code, index) => {
              const info = ANCHOR_INFO[code];
              const score = result.input.scores.anchors[code as AnchorCode];
              const color = ANCHOR_COLORS[code] || "#2d6cdf";
              return (
                <article
                  key={code}
                  className="rpt-anchor-card"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="rpt-anchor-card-header">
                    <span className="rpt-anchor-card-icon">{ANCHOR_ICONS[code]}</span>
                    <div>
                      <div className="rpt-anchor-card-rank" style={{ color }}>
                        {index + 1}\uC704
                      </div>
                      <h3 className="rpt-anchor-card-name">{info?.label ?? code}</h3>
                    </div>
                    <div className="rpt-anchor-card-score" style={{ background: color }}>
                      {score}
                    </div>
                  </div>
                  <p className="rpt-anchor-card-desc">{info?.description}</p>
                  <div className="rpt-anchor-card-tags">
                    <span className="rpt-tag rpt-tag-energy">\uC5D0\uB108\uC9C0 UP: {info?.energy}</span>
                    <span className="rpt-tag rpt-tag-stress">\uC2A4\uD2B8\uB808\uC2A4: {info?.stress}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== BOTTOM ANCHORS ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">\uD83D\uDCA1</span>
            \uD558\uC704 \uC575\uCEE4 (\uC2A4\uD2B8\uB808\uC2A4 \uC694\uC778)
          </h2>
          <p className="rpt-section-desc">\uC774 \uAC00\uCE58\uAC00 \uC694\uAD6C\uB418\uB294 \uD658\uACBD\uC5D0\uC11C\uB294 \uD53C\uB85C\uAC10\uC744 \uB290\uB084 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
          <div className="rpt-anchor-cards">
            {bottom2.map((code) => {
              const info = ANCHOR_INFO[code];
              const score = result.input.scores.anchors[code as AnchorCode];
              const color = ANCHOR_COLORS[code] || "#999";
              return (
                <article
                  key={code}
                  className="rpt-anchor-card rpt-anchor-card-bottom"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="rpt-anchor-card-header">
                    <span className="rpt-anchor-card-icon">{ANCHOR_ICONS[code]}</span>
                    <div>
                      <h3 className="rpt-anchor-card-name">{info?.label ?? code}</h3>
                    </div>
                    <div className="rpt-anchor-card-score rpt-anchor-card-score-low">
                      {score}
                    </div>
                  </div>
                  <p className="rpt-anchor-card-desc">{info?.description}</p>
                  <div className="rpt-anchor-card-tags">
                    <span className="rpt-tag rpt-tag-stress">\uC2A4\uD2B8\uB808\uC2A4 \uC694\uC778: {info?.stress}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== TRADEOFFS ===== */}
        {tradeoffs.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-section-title">
              <span className="rpt-section-icon">\u2696\uFE0F</span>
              \uC7A0\uC7AC\uC801 \uD2B8\uB808\uC774\uB4DC\uC624\uD504
            </h2>
            <p className="rpt-section-desc">
              \uC0C1\uC704 \uC575\uCEE4\uC640 \uD558\uC704 \uC575\uCEE4 \uC0AC\uC774\uC5D0\uC11C \uBC1C\uC0DD\uD560 \uC218 \uC788\uB294 \uAE34\uC7A5 \uAD00\uACC4\uC785\uB2C8\uB2E4.
            </p>
            <div className="rpt-tradeoff-list">
              {tradeoffs.map((t) => {
                const focusColor = ANCHOR_COLORS[t.focus] || "#2d6cdf";
                const sacColor = ANCHOR_COLORS[t.sacrifice] || "#999";
                return (
                  <div key={`${t.focus}-${t.sacrifice}`} className="rpt-tradeoff-card">
                    <div className="rpt-tradeoff-vs">
                      <span className="rpt-tradeoff-anchor" style={{ color: focusColor }}>
                        {ANCHOR_ICONS[t.focus]} {anchorLabel(t.focus)}
                      </span>
                      <span className="rpt-tradeoff-arrow">\u2194\uFE0F</span>
                      <span className="rpt-tradeoff-anchor" style={{ color: sacColor }}>
                        {ANCHOR_ICONS[t.sacrifice]} {anchorLabel(t.sacrifice)}
                      </span>
                    </div>
                    <p className="rpt-tradeoff-desc">
                      <strong>{anchorLabel(t.focus)}</strong>\uC744(\uB97C) \uCD94\uAD6C\uD560\uC218\uB85D{" "}
                      <strong>{anchorLabel(t.sacrifice)}</strong>\uC774(\uAC00) \uC694\uAD6C\uD558\uB294 \uAC00\uCE58\uC640 \uCDA9\uB3CC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== DISCLAIMER ===== */}
        <section className="rpt-section rpt-disclaimer">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">\uD83D\uDCCB</span>
            \uCC38\uACE0 \uC548\uB0B4
          </h2>
          <p>
            \uC774 \uB9AC\uD3EC\uD2B8\uB294 \uCEE4\uB9AC\uC5B4 \uC575\uCEE4 \uAC80\uC0AC \uC810\uC218\uB97C \uAE30\uBC18\uC73C\uB85C \uD55C \uAE30\uBCF8 \uBD84\uC11D\uC785\uB2C8\uB2E4. \uB354 \uAE4A\uC774 \uC788\uB294 \uB9DE\uCDA4\uD615 \uBD84\uC11D\uC744 \uC6D0\uD558\uC2DC\uBA74
            \uCD94\uAC00 \uC815\uBCF4\uB97C \uC785\uB825\uD558\uACE0 AI \uC2EC\uCE35 \uB9AC\uD3EC\uD2B8\uB97C \uBC1B\uC544\uBCF4\uC138\uC694.
          </p>
          <p className="text-secondary" style={{ fontSize: "0.85rem" }}>
            \uC774 \uB9AC\uD3EC\uD2B8\uB294 \uC790\uAE30\uC774\uD574\uC640 \uCEE4\uB9AC\uC5B4 \uC758\uC0AC\uACB0\uC815\uC744 \uB3D5\uAE30 \uC704\uD55C \uCC38\uACE0\uC790\uB8CC\uC774\uBA70, \uC758\uD559\uC801/\uC2EC\uB9AC\uD559\uC801 \uC9C4\uB2E8\uC774 \uC544\uB2D9\uB2C8\uB2E4.
          </p>
        </section>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      <div className="rpt-actions">
        <PdfDownloadButton
          targetId="basic-report-content"
          filename="career-anchor-basic-report.pdf"
          label="\uAE30\uBCF8 \uB9AC\uD3EC\uD2B8 PDF \uB2E4\uC6B4\uB85C\uB4DC"
        />
        <Link href="/results/additional-info" className="btn btn-primary">
          AI \uC2EC\uCE35 \uB9AC\uD3EC\uD2B8 \uBC1B\uAE30
        </Link>
        <Link href="/results/basic" className="btn btn-ghost">
          \uACB0\uACFC \uD654\uBA74\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30
        </Link>
      </div>
    </main>
  );
}
