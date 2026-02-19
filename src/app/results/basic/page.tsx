"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    scores: { anchors: ScoresByAnchor };
    has_intake?: boolean;
  };
  derived: {
    anchor_rank: string[];
    bottom_anchors: string[];
    score_pattern: "balanced" | "polarized" | "spiky";
    score_stats: { min: number; max: number; range: number; mean: number; stdev: number };
    tradeoff_candidates: Array<{ focus: string; sacrifice: string }>;
    growth_gaps: Array<{ anchor: string; gap: number }>;
  };
}

const ANCHOR_INFO: Record<string, { label: string; short: string; icon: string; strength: string; stress: string }> = {
  TF: { label: "전문가 역량", short: "TF", icon: "🔧", strength: "전문 지식을 깊이 있게 파고들 수 있는 환경", stress: "전문성과 무관한 잡무가 많은 환경" },
  GM: { label: "관리자 역량", short: "GM", icon: "👔", strength: "사람과 조직을 이끌고 성과를 만들어내는 역할", stress: "의사결정 권한 없이 실무만 수행하는 환경" },
  AU: { label: "자율/독립", short: "AU", icon: "🦅", strength: "자기 방식과 속도로 일할 수 있는 자유로운 환경", stress: "세밀한 규칙과 절차에 얽매이는 환경" },
  SE: { label: "안정/보장", short: "SE", icon: "🛡️", strength: "예측 가능하고 안정적인 조직 구조", stress: "불확실성이 높고 변화가 잦은 환경" },
  EC: { label: "기업가 창의성", short: "EC", icon: "🚀", strength: "새로운 아이디어를 실현하고 사업을 키울 수 있는 기회", stress: "정해진 틀 안에서만 일해야 하는 환경" },
  SV: { label: "봉사/헌신", short: "SV", icon: "💚", strength: "사회적 가치와 타인 기여를 실감할 수 있는 역할", stress: "이윤 추구만 강조되는 환경" },
  CH: { label: "순수한 도전", short: "CH", icon: "⚡", strength: "복잡하고 어려운 문제를 해결하는 과제", stress: "반복적이고 도전이 없는 일상적 업무" },
  LS: { label: "라이프스타일", short: "LS", icon: "⚖️", strength: "일과 삶의 균형이 보장되는 유연한 근무 환경", stress: "과도한 업무량으로 개인 시간이 침해되는 환경" }
};

const PATTERN_INFO: Record<string, { title: string; detail: string }> = {
  balanced: {
    title: "균형형",
    detail: "다양한 가치를 폭넓게 추구하는 유형입니다. 여러 환경에 잘 적응하지만, 핵심 우선순위를 명확히 하면 의사결정이 더 수월해집니다."
  },
  polarized: {
    title: "양극화형",
    detail: "중요시하는 가치가 매우 명확합니다. 강점 환경에서 높은 몰입과 성과를 보이지만, 하위 앵커가 요구되는 상황에서는 스트레스를 느낄 수 있습니다."
  },
  spiky: {
    title: "스파이크형",
    detail: "몇 가지 핵심 가치가 강하게 작동합니다. 해당 영역에서 탁월한 성과를 낼 가능성이 높습니다."
  }
};

function anchorLabel(code: string) {
  return ANCHOR_INFO[code]?.label ?? code;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload as { anchor: string; score: number };
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem", borderRadius: "8px" }}>
      <strong>{anchorLabel(point.anchor)}</strong>: {point.score}점
    </div>
  );
}

function buildOneSentence(top: string[]) {
  const labels = top.map((c) => ANCHOR_INFO[c]?.label ?? c);
  if (labels.length >= 2) {
    return `당신은 "${labels[0]}"과(와) "${labels[1]}"을(를) 중심으로 커리어의 의미와 방향을 찾는 사람입니다.`;
  }
  return `당신은 "${labels[0]}"을(를) 중심으로 커리어의 의미와 방향을 찾는 사람입니다.`;
}

export default function BasicResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScoringEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) return;
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
    return Object.entries(result.input.scores.anchors).map(([anchor, score]) => ({ anchor, score }));
  }, [result]);

  if (!result) {
    return (
      <main className="text-center" style={{ paddingTop: "4rem" }}>
        <h1>검사 결과</h1>
        <p className="text-secondary">표시할 결과가 없습니다. 먼저 검사를 완료해주세요.</p>
        {error ? <p className="report-error">{error}</p> : null}
      </main>
    );
  }

  const { derived } = result;
  const top2 = derived.anchor_rank.slice(0, 2);
  const top3 = derived.anchor_rank.slice(0, 3);
  const bottom2 = derived.bottom_anchors;
  const pattern = PATTERN_INFO[derived.score_pattern];

  return (
    <main className="report-page">
      <section className="text-center" style={{ paddingTop: "1rem", paddingBottom: "1.5rem" }}>
        <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>당신의 커리어 앵커 결과</p>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
          {buildOneSentence(top2)}
        </h1>
      </section>

      <section className="card mb-3">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", textAlign: "center" }}>앵커 프로필</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="anchor" tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Radar dataKey="score" stroke="#2d6cdf" fill="#2d6cdf" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-3">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>상위 앵커</h2>
        <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          이런 환경에서 잘 성장합니다
        </p>
        <div className="gap-stack">
          {top3.map((code, i) => {
            const info = ANCHOR_INFO[code];
            const score = result.input.scores.anchors[code as AnchorCode];
            return (
              <div key={code} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.75rem" }}>{info?.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{i + 1}위 {info?.label}</strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 600 }}>{score}점</span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                    {info?.strength}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-3">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>주의할 환경</h2>
        <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          이런 환경에서 스트레스를 받을 수 있습니다
        </p>
        <div className="gap-stack">
          {bottom2.map((code) => {
            const info = ANCHOR_INFO[code];
            const score = result.input.scores.anchors[code as AnchorCode];
            return (
              <div key={code} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.75rem" }}>{info?.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{info?.label}</strong>
                    <span className="text-secondary" style={{ fontSize: "0.85rem" }}>{score}점</span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                    {info?.stress}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card mb-3">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          점수 패턴: {pattern?.title ?? derived.score_pattern}
        </h2>
        <p className="text-secondary" style={{ fontSize: "0.9rem", margin: 0 }}>{pattern?.detail}</p>
      </section>

      <section className="mb-3">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>다음 단계</h2>
        <div className="gap-stack">
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            onClick={() => router.push("/results/additional-info")}
          >
            AI 심층 리포트 받기
          </button>
          <p className="text-center text-secondary" style={{ fontSize: "0.8rem" }}>
            개인 정보를 추가 입력하면 AI가 맞춤형 심층 리포트를 생성합니다
          </p>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => router.push("/report/basic")}
          >
            기본 리포트 보기
          </button>
        </div>
        {error ? <p className="report-error mt-2">{error}</p> : null}
      </section>
    </main>
  );
}
