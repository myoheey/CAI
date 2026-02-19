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

type ScoresByAnchor = Record<"TF" | "GM" | "AU" | "SE" | "EC" | "SV" | "CH" | "LS", number>;

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
    growth_gaps: Array<{ anchor: string; gap: number }>;
  };
}

const ANCHOR_LABELS: Record<string, string> = {
  TF: "기술/기능 (TF)",
  GM: "관리 (GM)",
  AU: "자율 (AU)",
  SE: "안정 (SE)",
  EC: "기업가 (EC)",
  SV: "봉사 (SV)",
  CH: "도전 (CH)",
  LS: "라이프스타일 (LS)"
};

const patternNotes: Record<ScoringEnvelope["derived"]["score_pattern"], string> = {
  balanced: "전반적으로 고르게 분포된 점수 패턴입니다.",
  polarized: "상위/하위 축의 대비가 뚜렷한 양극화 패턴입니다.",
  spiky: "일부 축이 두드러지는 스파이크 패턴입니다."
};

function anchorLabel(code: string) {
  return ANCHOR_LABELS[code] ?? code;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as { anchor: string; score: number };
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem" }}>
      <strong>{anchorLabel(point.anchor)}</strong>: {point.score}
    </div>
  );
}

export default function BasicResultsPage() {
  const router = useRouter();
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
    if (!result) {
      return [];
    }

    return Object.entries(result.input.scores.anchors).map(([anchor, score]) => ({
      anchor,
      score
    }));
  }, [result]);

  const top3 = result?.derived.anchor_rank.slice(0, 3) ?? [];
  const bottom2 = result?.derived.bottom_anchors ?? [];

  if (!result) {
    return (
      <main>
        <h1>검사 결과</h1>
        <p>표시할 결과가 없습니다. 먼저 검사를 완료해주세요.</p>
        {error ? <p>{error}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <h1>커리어 앵커 검사 결과</h1>

      <section>
        <h2>8개 앵커 레이더 차트 (0~100)</h2>
        <div style={{ width: "100%", height: 340 }}>
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
        <h2>요약</h2>
        <p>상위 3개 앵커: {top3.map(anchorLabel).join(", ")}</p>
        <p>하위 2개 앵커: {bottom2.map(anchorLabel).join(", ")}</p>
        <p>점수 패턴: {result.derived.score_pattern}</p>
        <p>{patternNotes[result.derived.score_pattern]}</p>
      </section>

      <section>
        <h2>다음 단계를 선택하세요</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={() => router.push("/report/basic")}
            style={{ padding: "1rem", fontSize: "1rem" }}
          >
            기본 리포트 보기
            <br />
            <small>앵커 점수 기반의 기본 분석 리포트를 확인합니다.</small>
          </button>
          <button
            type="button"
            onClick={() => router.push("/results/additional-info")}
            style={{ padding: "1rem", fontSize: "1rem" }}
          >
            추가 정보 입력 후 AI 심층 리포트 받기
            <br />
            <small>개인 정보를 추가 입력하면 AI가 맞춤형 심층 리포트를 생성합니다.</small>
          </button>
        </div>
        {error ? <p>{error}</p> : null}
      </section>
    </main>
  );
}
