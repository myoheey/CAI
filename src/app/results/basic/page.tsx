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
const REPORT_KEY = "cai_last_report_envelope_v1";

type Market = "B2C" | "B2B_EDU" | "HR_CORP";

type ScoresByAnchor = Record<"TF" | "GM" | "AU" | "SE" | "EC" | "SV" | "CH" | "LS", number>;

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
    growth_gaps: Array<{ anchor: string; gap: number }>;
  };
}


interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

function toFriendlyErrorMessage(value: unknown): string {
  const payload = value as ApiErrorEnvelope;
  if (payload?.error?.message) {
    const hasDetails = payload.error.details !== undefined && payload.error.details !== null;
    const detailsText = hasDetails
      ? `

원인 상세: ${JSON.stringify(payload.error.details).slice(0, 800)}`
      : "";

    return `리포트 생성에 실패했습니다: ${payload.error.message}${detailsText}`;
  }

  return "리포트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
}


async function parseResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: { message: text.slice(0, 300) } };
  }
}

const patternNotes: Record<ScoringEnvelope["derived"]["score_pattern"], string> = {
  balanced: "전반적으로 고르게 분포된 점수 패턴입니다.",
  polarized: "상위/하위 축의 대비가 뚜렷한 양극화 패턴입니다.",
  spiky: "일부 축이 두드러지는 스파이크 패턴입니다."
};

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as { anchor: string; score: number };
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem" }}>
      <strong>{point.anchor}</strong>: {point.score}
    </div>
  );
}

export default function BasicResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScoringEnvelope | null>(null);
  const [market, setMarket] = useState<Market>("B2C");
  const [isGenerating, setGenerating] = useState(false);
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

  async function onGenerateReport() {
    if (!result) {
      setError("점수 결과가 없어 리포트를 생성할 수 없습니다.");
      return;
    }

    setGenerating(true);
    setError(null);

    const payload = {
      market,
      input: result.input,
      derived: result.derived,
      report_options: {
        tone: "warm_professional",
        depth: "standard",
        language: "ko-KR",
        strict_json: true
      }
    };

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responsePayload = await parseResponsePayload(response);

      if (!response.ok) {
        throw new Error(toFriendlyErrorMessage(responsePayload));
      }

      const reportEnvelope = responsePayload;
      localStorage.setItem(REPORT_KEY, JSON.stringify(reportEnvelope));
      router.push("/report");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  if (!result) {
    return (
      <main>
        <h1>기본 결과</h1>
        <p>표시할 결과가 없습니다. 먼저 진단을 제출해주세요.</p>
        {error ? <p>{error}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <h1>기본 결과</h1>

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
        <p>상위 3개 앵커: {top3.join(", ")}</p>
        <p>하위 2개 앵커: {bottom2.join(", ")}</p>
        <p>점수 패턴: {result.derived.score_pattern}</p>
        <p>{patternNotes[result.derived.score_pattern]}</p>
      </section>

      <section>
        <h2>성장 격차</h2>
        {result.derived.growth_gaps.length === 0 ? (
          <p>성장 의도 데이터 없음</p>
        ) : (
          <ul>
            {result.derived.growth_gaps.map((gap) => (
              <li key={gap.anchor}>
                {gap.anchor}: {gap.gap}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Generate AI Report</h2>
        <label>
          시장
          <select value={market} onChange={(event) => setMarket(event.target.value as Market)}>
            <option value="B2C">B2C</option>
            <option value="B2B_EDU">B2B_EDU</option>
            <option value="HR_CORP">HR_CORP</option>
          </select>
        </label>
        <div>
          <button type="button" onClick={onGenerateReport} disabled={isGenerating}>
            AI 심층 리포트 생성
          </button>
        </div>
        {error ? <p>{error}</p> : null}
      </section>
    </main>
  );
}
