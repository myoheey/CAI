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
  TF: "#2E7D32",
  GM: "#7c3aed",
  AU: "#059669",
  SE: "#d97706",
  EC: "#dc2626",
  SV: "#ec4899",
  CH: "#0891b2",
  LS: "#65a30d"
};

const ANCHOR_ICONS: Record<string, string> = {
  TF: "🔧",
  GM: "👔",
  AU: "🦅",
  SE: "🛡️",
  EC: "🚀",
  SV: "💚",
  CH: "⚡",
  LS: "⚖️"
};

const ANCHOR_INFO: Record<
  string,
  { label: string; description: string; energy: string; stress: string }
> = {
  TF: {
    label: "기술/기능 전문성",
    description:
      "특정 분야의 전문 지식과 기술을 심화하고 전문가로서 인정받는 것에 가치를 둡니다.",
    energy:
      "전문 기술을 발휘할 때, 해당 분야에서 권위자로 인정받을 때",
    stress:
      "전문성과 무관한 업무를 할 때, 제너럴리스트가 되라는 요구를 받을 때"
  },
  GM: {
    label: "관리 역량",
    description:
      "조직을 이끌고, 사람들을 관리하며, 의사결정에 영향을 미치는 것에 동기부여를 받습니다.",
    energy:
      "팀을 이끌고 의사결정을 내릴 때, 조직적 성과를 낼 때",
    stress:
      "영향력이 제한될 때, 단순 실무만 요구될 때"
  },
  AU: {
    label: "자율/독립",
    description:
      "자신만의 방식으로 일하고, 규칙이나 절차에 얽매이지 않는 자유를 추구합니다.",
    energy:
      "자유롭게 일할 때, 자신의 스케줄과 방법을 선택할 수 있을 때",
    stress:
      "미세 관리를 받을 때, 경직된 조직 문화에서 일할 때"
  },
  SE: {
    label: "안정/보장",
    description:
      "예측 가능한 환경, 고용 안정, 재정적 보장 등 안정감을 우선시합니다.",
    energy:
      "안정적인 고용과 예측 가능한 환경에서 일할 때",
    stress:
      "불확실성이 높을 때, 구조조정이나 변화가 반복될 때"
  },
  EC: {
    label: "기업가적 창의성",
    description:
      "새로운 사업이나 프로젝트를 만들고, 아이디어를 현실로 구현하는 것에 열정을 느낍니다.",
    energy:
      "새로운 것을 만들고 창조할 때, 아이디어를 실현할 때",
    stress:
      "반복적이고 정형화된 업무를 할 때, 혁신이 막힐 때"
  },
  SV: {
    label: "봉사/헌신",
    description:
      "세상을 더 나은 곳으로 만들고, 타인을 돕고, 사회적 가치를 실현하는 데 의미를 둡니다.",
    energy:
      "사회적 의미가 있는 일을 할 때, 누군가를 도울 때",
    stress:
      "이익만 추구하는 환경에서, 가치관과 충돌하는 업무를 할 때"
  },
  CH: {
    label: "순수한 도전",
    description:
      "어렵고 복잡한 문제를 해결하는 것 자체에서 성취감을 얻으며, 경쟁과 극복을 즐깁니다.",
    energy:
      "난제를 풀 때, 경쟁에서 승리할 때, 불가능을 가능으로 만들 때",
    stress:
      "너무 쉽거나 반복적인 일을 할 때, 도전 기회가 없을 때"
  },
  LS: {
    label: "라이프스타일",
    description:
      "일과 삶의 균형을 중시하며, 커리어가 개인 생활과 조화를 이루는 것을 우선합니다.",
    energy:
      "일과 삶이 조화로울 때, 개인 시간이 보장될 때",
    stress:
      "과도한 업무량이나 장시간 근무를 요구받을 때"
  }
};

const PATTERN_DESCRIPTIONS: Record<string, { title: string; detail: string; tagColor: string }> = {
  balanced: {
    title: "균형형",
    detail:
      "8개 앵커 점수가 비교적 고르게 분포되어 있습니다. 다양한 가치를 폭넓게 추구하는 유형으로, 여러 환경에 적응하기 쉽지만 핵심 우선순위를 명확히 하면 의사결정이 더 수월해집니다.",
    tagColor: "#059669"
  },
  polarized: {
    title: "양극화형",
    detail:
      "상위 앵커와 하위 앵커 간의 차이가 뚜렷합니다. 자신이 중요시하는 가치가 명확하며, 그에 맞는 환경에서 높은 몰입과 성과를 보일 수 있습니다. 다만 하위 앵커가 요구되는 상황에서는 스트레스를 느낄 수 있습니다.",
    tagColor: "#d97706"
  },
  spiky: {
    title: "스파이크형",
    detail:
      "특정 앵커가 눈에 띄게 높거나 낮습니다. 몇 가지 핵심 가치가 강하게 작동하며, 해당 영역에서 탁월한 성과를 낼 가능성이 높습니다.",
    tagColor: "#dc2626"
  }
};

function anchorLabel(code: string) {
  return ANCHOR_INFO[code]?.label ?? code;
}

function ScoreBar({ code, score, rank }: { code: string; score: number; rank: number }) {
  const color = ANCHOR_COLORS[code] || "#2E7D32";
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
  const color = ANCHOR_COLORS[point.anchor] || "#2E7D32";
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-icon">{ANCHOR_ICONS[point.anchor]}</span>
      <strong style={{ color }}>{anchorLabel(point.anchor)}</strong>
      <span className="chart-tooltip-score">{point.score}점</span>
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
      setError("결과 데이터를 불러오지 못했습니다.");
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
        <h1>기본 분석 리포트</h1>
        <p>표시할 결과가 없습니다. 먼저 검사를 완료해주세요.</p>
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
          <div className="rpt-hero-badge">기본 분석</div>
          <h1 className="rpt-hero-title">커리어 앵커 분석 리포트</h1>
          <p className="rpt-hero-sub">
            당신의 8가지 커리어 가치 점수를 기반으로 한 분석 결과입니다.
          </p>
        </header>

        {/* ===== PATTERN BADGE ===== */}
        <section className="rpt-pattern-section">
          <div className="rpt-pattern-tag" style={{ background: pattern?.tagColor ?? "#666" }}>
            {pattern?.title ?? derived.score_pattern}
          </div>
          <p className="rpt-pattern-detail">{pattern?.detail}</p>
          <div className="rpt-stats-row">
            <StatCard label="평균" value={`${derived.score_stats.mean.toFixed(0)}점`} />
            <StatCard label="최고" value={`${derived.score_stats.max.toFixed(0)}점`} />
            <StatCard label="최저" value={`${derived.score_stats.min.toFixed(0)}점`} />
            <StatCard label="편차" value={`${derived.score_stats.range.toFixed(0)}점`} />
          </div>
        </section>

        {/* ===== RADAR CHART ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">📊</span>
            앵커 프로필
          </h2>
          <div className="rpt-chart-container">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={chartData} outerRadius="70%">
                <PolarGrid strokeDasharray="3 3" stroke="#e0e4d9" />
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
                  stroke="#2E7D32"
                  strokeWidth={2}
                  fill="url(#radarGradient)"
                  fillOpacity={0.5}
                />
                <defs>
                  <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#2E7D32" stopOpacity={0.5} />
                  </radialGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ===== SCORE BARS ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">🏆</span>
            앵커 점수 순위
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
            <span className="rpt-section-icon">⭐</span>
            핵심 앵커 TOP 3
          </h2>
          <p className="rpt-section-desc">당신이 가장 중요하게 여기는 커리어 가치입니다.</p>
          <div className="rpt-anchor-cards">
            {top3.map((code, index) => {
              const info = ANCHOR_INFO[code];
              const score = result.input.scores.anchors[code as AnchorCode];
              const color = ANCHOR_COLORS[code] || "#2E7D32";
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
                        {index + 1}위
                      </div>
                      <h3 className="rpt-anchor-card-name">{info?.label ?? code}</h3>
                    </div>
                    <div className="rpt-anchor-card-score" style={{ background: color }}>
                      {score}
                    </div>
                  </div>
                  <p className="rpt-anchor-card-desc">{info?.description}</p>
                  <div className="rpt-anchor-card-tags">
                    <span className="rpt-tag rpt-tag-energy">에너지 UP: {info?.energy}</span>
                    <span className="rpt-tag rpt-tag-stress">스트레스: {info?.stress}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== BOTTOM ANCHORS ===== */}
        <section className="rpt-section">
          <h2 className="rpt-section-title">
            <span className="rpt-section-icon">💡</span>
            하위 앵커 (스트레스 요인)
          </h2>
          <p className="rpt-section-desc">이 가치가 요구되는 환경에서는 피로감을 느낄 수 있습니다.</p>
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
                    <span className="rpt-tag rpt-tag-stress">스트레스 요인: {info?.stress}</span>
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
              <span className="rpt-section-icon">⚖️</span>
              잠재적 트레이드오프
            </h2>
            <p className="rpt-section-desc">
              상위 앵커와 하위 앵커 사이에서 발생할 수 있는 긴장 관계입니다.
            </p>
            <div className="rpt-tradeoff-list">
              {tradeoffs.map((t) => {
                const focusColor = ANCHOR_COLORS[t.focus] || "#2E7D32";
                const sacColor = ANCHOR_COLORS[t.sacrifice] || "#999";
                return (
                  <div key={`${t.focus}-${t.sacrifice}`} className="rpt-tradeoff-card">
                    <div className="rpt-tradeoff-vs">
                      <span className="rpt-tradeoff-anchor" style={{ color: focusColor }}>
                        {ANCHOR_ICONS[t.focus]} {anchorLabel(t.focus)}
                      </span>
                      <span className="rpt-tradeoff-arrow">↔️</span>
                      <span className="rpt-tradeoff-anchor" style={{ color: sacColor }}>
                        {ANCHOR_ICONS[t.sacrifice]} {anchorLabel(t.sacrifice)}
                      </span>
                    </div>
                    <p className="rpt-tradeoff-desc">
                      <strong>{anchorLabel(t.focus)}</strong>을(를) 추구할수록{" "}
                      <strong>{anchorLabel(t.sacrifice)}</strong>이(가) 요구하는 가치와 충돌할 수 있습니다.
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
            <span className="rpt-section-icon">📋</span>
            참고 안내
          </h2>
          <p>
            이 리포트는 커리어 앵커 검사 점수를 기반으로 한 기본 분석입니다. 더 깊이 있는 맞춤형 분석을 원하시면
            추가 정보를 입력하고 AI 심층 리포트를 받아보세요.
          </p>
          <p className="text-secondary" style={{ fontSize: "0.85rem" }}>
            이 리포트는 자기이해와 커리어 의사결정을 돕기 위한 참고자료이며, 의학적/심리학적 진단이 아닙니다.
          </p>
        </section>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      <div className="rpt-actions">
        <PdfDownloadButton
          targetId="basic-report-content"
          filename="career-anchor-basic-report.pdf"
          label="기본 리포트 PDF 다운로드"
        />
        <Link href="/results/additional-info" className="btn btn-primary">
          AI 심층 리포트 받기
        </Link>
        <Link href="/results/basic" className="btn btn-ghost">
          결과 화면으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
