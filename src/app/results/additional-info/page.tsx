"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { IntakeDraft } from "@/lib/types";

const RESULT_KEY = "cai_last_scoring_result_v1";
const REPORT_KEY = "cai_last_report_envelope_v1";

interface ScoringEnvelope {
  input: Record<string, unknown>;
  derived: Record<string, unknown>;
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
    return `리포트 생성에 실패했습니다: ${payload.error.message}`;
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

function defaultIntake(): IntakeDraft {
  return {
    person: { gender: "U", age_band: "20s" },
    context: { industry: "", role: "", career_years: 0, current_concerns: "" },
    relationship_map: { current_level: 1, notes: "" },
    assessment_meta: { test_version: "anchor_v1.2", locale: "ko-KR" }
  };
}

export default function AdditionalInfoPage() {
  const router = useRouter();
  const [scoringResult, setScoringResult] = useState<ScoringEnvelope | null>(null);
  const [intake, setIntake] = useState<IntakeDraft>(defaultIntake);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ScoringEnvelope;
      setScoringResult(parsed);
    } catch {
      setError("검사 결과를 불러오지 못했습니다.");
    }
  }, []);

  function updateField<K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) {
    setIntake((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = Boolean(intake.context.industry && intake.context.role);

  async function onSubmit() {
    if (!scoringResult) {
      setError("검사 결과가 없습니다. 먼저 검사를 완료해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const inputWithIntake = {
      ...scoringResult.input,
      person: intake.person,
      context: intake.context,
      relationship_map: intake.relationship_map,
      assessment_meta: {
        ...intake.assessment_meta,
        completed_at: new Date().toISOString()
      },
      has_intake: true
    };

    const payload = {
      market: "B2C" as const,
      input: inputWithIntake,
      derived: scoringResult.derived,
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

      localStorage.setItem(REPORT_KEY, JSON.stringify(responsePayload));
      localStorage.setItem(
        RESULT_KEY,
        JSON.stringify({ ...scoringResult, input: inputWithIntake })
      );
      router.push("/report");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!scoringResult) {
    return (
      <main>
        <h1>추가 정보 입력</h1>
        <p>검사 결과가 없습니다. 먼저 검사를 완료해주세요.</p>
        {error ? <p>{error}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <h1>추가 정보 입력</h1>
      <p>아래 정보를 입력하시면 AI가 맞춤형 심층 리포트를 생성합니다.</p>

      <section>
        <h2>기본 정보</h2>

        <label>
          성별
          <select
            value={intake.person.gender}
            onChange={(e) =>
              updateField("person", { ...intake.person, gender: e.target.value as IntakeDraft["person"]["gender"] })
            }
          >
            <option value="F">여성</option>
            <option value="M">남성</option>
            <option value="N">논바이너리</option>
            <option value="U">선택 안함</option>
          </select>
        </label>

        <label>
          연령대
          <select
            value={intake.person.age_band}
            onChange={(e) =>
              updateField("person", {
                ...intake.person,
                age_band: e.target.value as IntakeDraft["person"]["age_band"]
              })
            }
          >
            <option value="10s">10대</option>
            <option value="20s">20대</option>
            <option value="30s">30대</option>
            <option value="40s">40대</option>
            <option value="50s">50대</option>
            <option value="60s+">60대 이상</option>
          </select>
        </label>
      </section>

      <section>
        <h2>직업 정보</h2>

        <label>
          산업 분야 *
          <input
            value={intake.context.industry}
            onChange={(e) => updateField("context", { ...intake.context, industry: e.target.value })}
            placeholder="예: IT, 금융, 교육, 의료 등"
          />
        </label>

        <label>
          직무/역할 *
          <input
            value={intake.context.role}
            onChange={(e) => updateField("context", { ...intake.context, role: e.target.value })}
            placeholder="예: 소프트웨어 개발자, 마케팅 매니저 등"
          />
        </label>

        <label>
          경력 연수
          <input
            type="number"
            min={0}
            value={intake.context.career_years}
            onChange={(e) =>
              updateField("context", { ...intake.context, career_years: Number(e.target.value) || 0 })
            }
          />
        </label>

        <label>
          현재 고민 (선택)
          <textarea
            value={intake.context.current_concerns ?? ""}
            onChange={(e) => updateField("context", { ...intake.context, current_concerns: e.target.value })}
            placeholder="현재 커리어와 관련된 고민이 있다면 자유롭게 적어주세요."
          />
        </label>

        <label>
          직무 만족도 (선택, 1~5)
          <input
            type="number"
            min={1}
            max={5}
            value={intake.context.job_satisfaction ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              updateField("context", {
                ...intake.context,
                job_satisfaction: value === "" ? undefined : Number(value)
              });
            }}
          />
        </label>
      </section>

      <section>
        <h2>관계/조직 환경</h2>

        <label>
          현재 관계 수준
          <select
            value={intake.relationship_map.current_level}
            onChange={(e) =>
              updateField("relationship_map", {
                ...intake.relationship_map,
                current_level: Number(e.target.value) as 1 | 2 | 3
              })
            }
          >
            <option value={1}>1 - 개인 중심</option>
            <option value={2}>2 - 팀 협업</option>
            <option value={3}>3 - 조직 리더십</option>
          </select>
        </label>

        <label>
          희망 관계 수준 (선택)
          <select
            value={intake.relationship_map.desired_level ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              updateField("relationship_map", {
                ...intake.relationship_map,
                desired_level: value === "" ? undefined : (Number(value) as 1 | 2 | 3)
              });
            }}
          >
            <option value="">-</option>
            <option value={1}>1 - 개인 중심</option>
            <option value={2}>2 - 팀 협업</option>
            <option value={3}>3 - 조직 리더십</option>
          </select>
        </label>

        <label>
          관계 관련 메모 (선택)
          <textarea
            value={intake.relationship_map.notes ?? ""}
            onChange={(e) => updateField("relationship_map", { ...intake.relationship_map, notes: e.target.value })}
            placeholder="팀이나 조직 내 관계와 관련하여 참고할 내용이 있다면 적어주세요."
          />
        </label>
      </section>

      {error ? <p>{error}</p> : null}

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button type="button" onClick={() => router.back()} disabled={isSubmitting}>
          뒤로
        </button>
        <button type="button" onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "AI 리포트 생성 중..." : "AI 심층 리포트 생성"}
        </button>
      </div>
    </main>
  );
}
