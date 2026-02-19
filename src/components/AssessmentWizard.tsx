"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { AnswersMap, QuestionBankItem } from "@/lib/types";

const DRAFT_KEY = "cai_assessment_draft_v1";
const RESULT_KEY = "cai_last_scoring_result_v1";

const LIKERT_LABELS = ["전혀\n그렇지 않다", "그렇지\n않다", "보통", "그렇다", "매우\n그렇다"];

const LOADING_MESSAGES = [
  "응답을 수집하고 있습니다...",
  "커리어 앵커 점수를 계산하고 있습니다...",
  "8가지 앵커 패턴을 분석하고 있습니다...",
  "당신만의 커리어 프로필을 완성하고 있습니다..."
];

interface AssessmentWizardProps {
  items: QuestionBankItem[];
}

export default function AssessmentWizard({ items }: AssessmentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = items.length;
  const currentQuestion = items[step];
  const progress = ((step + 1) / totalSteps) * 100;
  const answeredCount = Object.keys(answers).length;
  const estimatedMinutesLeft = Math.max(1, Math.ceil((totalSteps - answeredCount) * 0.25));

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { step: number; answers: AnswersMap };
      setStep(parsed.step ?? 0);
      setAnswers(parsed.answers ?? {});
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers }));
  }, [step, answers]);

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const goNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
    }
  }, [step, totalSteps]);

  function selectAnswer(value: number) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    if (step < totalSteps - 1) {
      setTimeout(goNext, 300);
    }
  }

  async function onSubmitAssessment() {
    setSubmitting(true);
    setError(null);
    setLoadingMessageIndex(0);

    try {
      const response = await fetch("/api/assessments/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        throw new Error("검사 결과 처리에 실패했습니다.");
      }

      const result = await response.json();
      localStorage.setItem(RESULT_KEY, JSON.stringify(result));
      localStorage.removeItem(DRAFT_KEY);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/results/basic");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  if (isSubmitting) {
    return (
      <main className="text-center" style={{ paddingTop: "6rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div className="loading-spinner" />
        </div>
        <p className="loading-message" style={{ fontSize: "1.1rem", fontWeight: 500 }}>
          {LOADING_MESSAGES[loadingMessageIndex]}
        </p>
        <p className="text-secondary" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
          잠시만 기다려주세요
        </p>
      </main>
    );
  }

  const isLastStep = step === totalSteps - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
          {step + 1} / {totalSteps}
        </span>
        <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
          약 {estimatedMinutesLeft}분 남음
        </span>
      </div>

      <div className="progress-bar mb-3">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <section className="card" style={{ minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Q{currentQuestion?.id.replace("Q", "")}
        </p>
        <p style={{ fontSize: "1.15rem", fontWeight: 500, lineHeight: 1.6, margin: 0, padding: "0 0.5rem" }}>
          {currentQuestion?.text}
        </p>

        <div className="likert-group" style={{ marginTop: "2rem" }}>
          {LIKERT_LABELS.map((label, index) => {
            const value = index + 1;
            const isSelected = currentAnswer === value;
            return (
              <label key={value} className={`likert-option ${isSelected ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`q-${currentQuestion?.id}`}
                  value={value}
                  checked={isSelected}
                  onChange={() => selectAnswer(value)}
                />
                <span className="likert-circle">{value}</span>
                <span className="likert-label" style={{ whiteSpace: "pre-line" }}>{label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {error ? <p className="report-error mt-2">{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled={step === 0}
        >
          이전
        </button>

        {isLastStep ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmitAssessment}
            disabled={!currentAnswer}
          >
            결과 확인하기
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={goNext}
            disabled={!currentAnswer}
          >
            다음
          </button>
        )}
      </div>
    </main>
  );
}
