"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { AnswersMap, QuestionBankItem } from "@/lib/types";

const DRAFT_KEY = "cai_assessment_draft_v1";
const RESULT_KEY = "cai_last_scoring_result_v1";

interface AssessmentWizardProps {
  items: QuestionBankItem[];
}

export default function AssessmentWizard({ items }: AssessmentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = items.length;
  const currentQuestion = items[step];

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        step: number;
        answers: AnswersMap;
      };
      setStep(parsed.step ?? 0);
      setAnswers(parsed.answers ?? {});
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers }));
  }, [step, answers]);

  const canGoNext = Boolean(currentQuestion && answers[currentQuestion.id]);

  async function onSubmitAssessment() {
    setSubmitting(true);
    setError(null);

    const payload = { answers };

    try {
      const response = await fetch("/api/assessments/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("검사 결과 처리에 실패했습니다.");
      }

      const result = await response.json();
      localStorage.setItem(RESULT_KEY, JSON.stringify(result));
      localStorage.removeItem(DRAFT_KEY);
      router.push("/results/basic");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>커리어 앵커 검사</h1>

      <section>
        <p>
          {step + 1} / {items.length}
        </p>
        <h2>{currentQuestion?.id}</h2>
        <p>{currentQuestion?.text}</p>
        <div>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (!currentQuestion) return;
                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
              }}
              aria-pressed={currentQuestion ? answers[currentQuestion.id] === value : false}
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      {error ? <p>{error}</p> : null}

      <div>
        <button type="button" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0 || isSubmitting}>
          이전
        </button>

        {step < totalSteps - 1 ? (
          <button type="button" onClick={() => setStep((prev) => prev + 1)} disabled={!canGoNext || isSubmitting}>
            다음
          </button>
        ) : (
          <button type="button" onClick={onSubmitAssessment} disabled={isSubmitting || !canGoNext}>
            제출
          </button>
        )}
      </div>
    </main>
  );
}
