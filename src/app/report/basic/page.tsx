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

const RESULT_KEY = "cai_last_scoring_result_v1";

type AnchorCode = "TF" | "GM" | "AU" | "SE" | "EC" | "SV" | "CH" | "LS";
type ScoresByAnchor = Record<AnchorCode, number>;

interface ScoringEnvelope {
  input: {
    scores: {
      anchors: ScoresByAnchor;
    };
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
  };
}

const ANCHOR_INFO: Record<string, { label: string; description: string }> = {
  TF: {
    label: "기술/기능 전문성",
    description: "특정 분야의 전문 지식과 기술을 심화하고 전문가로서 인정받는 것에 가치를 둡니다."
  },
  GM: {
    label: "관리 역량",
    description: "조직을 이끌고, 사람들을 관리하며, 의사결정에 영향을 미치는 것에 동기부여를 받습니다."
  },
  AU: {
    label: "자율/독립",
    description: "자신만의 방식으로 일하고, 규칙이나 절차에 얽매이지 않는 자유를 추구합니다."
  },
  SE: {
    label: "안정/보장",
    description: "예측 가능한 환경, 고용 안정, 재정적 보장 등 안정감을 우선시합니다."
  },
  EC: {
    label: "기업가적 창의성",
    description: "새로운 사업이나 프로젝트를 만들고, 아이디어를 현실로 구현하는 것에 열정을 느낍니다."
  },
  SV: {
    label: "봉사/헌신",
    description: "세상을 더 나은 곳으로 만들고, 타인을 돕고, 사회적 가치를 실현하는 데 의미를 둡니다."
  },
  CH: {
    label: "순수한 도전",
    description: "어렵고 복잡한 문제를 해결하는 것 자체에서 성취감을 얻으며, 경쟁과 극복을 즐깁니다."
  },
  LS: {
    label: "라이프스타일",
    description: "일과 삶의 균형을 중시하며, 커리어가 개인 생활과 조화를 이루는 것을 우선합니다."
  }
};

const PATTERN_DESCRIPTIONS: Record<string, { title: string; detail: string }> = {
  balanced: {
    title: "균형형",
    detail: "8개 앵커 점수가 비교적 고르게 분포되어 있습니다. 다양한 가치를 폭넓게 추구하는 유형으로, 여러 환경에 적응하기 쉽지만 핵심 우선순위를 명확히 하면 의사결정이 더 수월해집니다."
  },
  polarized: {
    title: "양극화형",
    detail: "상위 앵커와 하위 앵커 간의 차이가 뚜렷합니다. 자신이 중요시하는 가치가 명확하며, 그에 맞는 환경에서 높은 몰입과 성과를 보일 수 있습니다. 다만 하위 앵커가 요구되는 상황에서는 스트레스를 느낄 수 있습니다."
  },
  spiky: {
    title: "스파이크형",
    detail: "특정 앵커가 눈에 띄게 높거나 낮습니다. 몇 가지 핵심 가치가 강하게 작동하며, 해당 영역에서 탁월한 성과를 낼 가능성이 높습니다."
  }
};

function anchorLabel(code: string) {
  return ANCHOR_INFO[code]?.label ?? code;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as { anchor: string; score: number };
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem" }}>
      <strong>{anchorLabel(point.anchor)}</strong>: {point.score}점
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
      score
    }));
  }, [result]);

  if (!result) {
    return (
      <main>
        <h1>기본 분석 리포트</h1>
        <p>표시할 결과가 없습니다. 먼저 검사를 완료해주세요.</p>
        {error ? <p>{error}</p> : null}
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
      <header className="report-header">
        <h1>커리어 앵커 기본 분석 리포트</h1>
        <p>앵커 점수를 기반으로 한 기본 분석 결과입니다.</p>
      </header>

      <section>
        <h2>앵커 프로필</h2>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="anchor" />
              <Tooltip content={<ChartTooltip />} />
              <Radar dataKey="score" stroke="#2d6cdf" fill="#2d6cdf" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2>핵심 앵커 분석</h2>

        <h3>상위 앵커 (가장 중요한 가치)</h3>
        {top3.map((code, index) => {
          const info = ANCHOR_INFO[code];
          const score = result.input.scores.anchors[code as AnchorCode];
          return (
            <article key={code} className="card" style={{ marginBottom: "0.5rem" }}>
              <h4>
                {index + 1}위: {info?.label ?? code} ({score}점)
              </h4>
              <p>{info?.description}</p>
            </article>
          );
        })}

        <h3>하위 앵커 (상대적으로 덜 중요한 가치)</h3>
        {bottom2.map((code) => {
          const info = ANCHOR_INFO[code];
          const score = result.input.scores.anchors[code as AnchorCode];
          return (
            <article key={code} className="card" style={{ marginBottom: "0.5rem" }}>
              <h4>
                {info?.label ?? code} ({score}점)
              </h4>
              <p>{info?.description}</p>
            </article>
          );
        })}
      </section>

      <section>
        <h2>점수 패턴: {pattern?.title ?? derived.score_pattern}</h2>
        <p>{pattern?.detail}</p>
        {derived.score_stats ? (
          <ul>
            <li>평균: {derived.score_stats.mean.toFixed(1)}점</li>
            <li>최고: {derived.score_stats.max.toFixed(1)}점</li>
            <li>최저: {derived.score_stats.min.toFixed(1)}점</li>
            <li>편차 범위: {derived.score_stats.range.toFixed(1)}점</li>
          </ul>
        ) : null}
      </section>

      {tradeoffs.length > 0 ? (
        <section>
          <h2>잠재적 트레이드오프</h2>
          <p>상위 앵커와 하위 앵커 사이에서 발생할 수 있는 긴장 관계입니다.</p>
          {tradeoffs.map((t) => (
            <article key={`${t.focus}-${t.sacrifice}`} className="card" style={{ marginBottom: "0.5rem" }}>
              <p>
                <strong>{anchorLabel(t.focus)}</strong>을(를) 추구할수록{" "}
                <strong>{anchorLabel(t.sacrifice)}</strong>이(가) 요구하는 가치와 충돌할 수 있습니다.
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <section>
        <h2>참고 안내</h2>
        <p>
          이 리포트는 커리어 앵커 검사 점수를 기반으로 한 기본 분석입니다. 더 깊이 있는 맞춤형 분석을 원하시면
          추가 정보를 입력하고 AI 심층 리포트를 받아보세요.
        </p>
        <p style={{ fontSize: "0.85rem", color: "#666" }}>
          이 리포트는 자기이해와 커리어 의사결정을 돕기 위한 참고자료이며, 의학적/심리학적 진단이 아닙니다.
        </p>
      </section>

      <div className="report-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <Link href="/results/additional-info">
          <button type="button">AI 심층 리포트 받기</button>
        </Link>
        <Link href="/results/basic">
          <button type="button">결과 화면으로 돌아가기</button>
        </Link>
      </div>
    </main>
  );
}
