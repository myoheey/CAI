"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { AnswersMap, IntakeDraft, QuestionBankItem } from "@/lib/types";

const DRAFT_KEY = "cai_assessment_draft_v1";
const RESULT_KEY = "cai_last_scoring_result_v1";

interface AssessmentWizardProps {
  items: QuestionBankItem[];
}

function defaultIntake(): IntakeDraft {
  return {
    person: {
      gender: "U",
      age_band: "20s"
    },
    context: {
      industry: "",
      role: "",
      career_years: 0,
      current_concerns: ""
    },
    relationship_map: {
      current_level: 1,
      notes: ""
    },
    assessment_meta: {
      test_version: "anchor_v1.2",
      locale: "ko-KR"
    }
  };
}

export default function AssessmentWizard({ items }: AssessmentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<IntakeDraft>(defaultIntake);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = useMemo(() => items.length + 1, [items.length]);
  const isIntakeStep = step === 0;
  const currentQuestion = items[step - 1];

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        step: number;
        intake: IntakeDraft;
        answers: AnswersMap;
      };
      setStep(parsed.step ?? 0);
      setIntake(parsed.intake ?? defaultIntake());
      setAnswers(parsed.answers ?? {});
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, intake, answers }));
  }, [step, intake, answers]);

  const canGoNext = isIntakeStep
    ? Boolean(intake.context.industry && intake.context.role)
    : Boolean(currentQuestion && answers[currentQuestion.id]);

  function onSubmitIntakeField<K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) {
    setIntake((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmitAssessment() {
    setSubmitting(true);
    setError(null);

    const payload = {
      intake: {
        ...intake,
        assessment_meta: {
          ...intake.assessment_meta,
          completed_at: new Date().toISOString()
        }
      },
      answers
    };

    try {
      const response = await fetch("/api/assessments/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment.");
      }

      const result = await response.json();
      localStorage.setItem(RESULT_KEY, JSON.stringify(result));
      localStorage.removeItem(DRAFT_KEY);
      router.push("/results/basic");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Career Anchor Assessment</h1>

      {isIntakeStep ? (
        <section>
          <h2>Intake Form</h2>
          <label>
            Gender
            <select
              value={intake.person.gender}
              onChange={(e) =>
                onSubmitIntakeField("person", { ...intake.person, gender: e.target.value as IntakeDraft["person"]["gender"] })
              }
            >
              <option value="F">F</option>
              <option value="M">M</option>
              <option value="N">N</option>
              <option value="U">U</option>
            </select>
          </label>

          <label>
            Age Band
            <select
              value={intake.person.age_band}
              onChange={(e) =>
                onSubmitIntakeField("person", {
                  ...intake.person,
                  age_band: e.target.value as IntakeDraft["person"]["age_band"]
                })
              }
            >
              <option value="10s">10s</option>
              <option value="20s">20s</option>
              <option value="30s">30s</option>
              <option value="40s">40s</option>
              <option value="50s">50s</option>
              <option value="60s+">60s+</option>
            </select>
          </label>

          <label>
            Industry
            <input
              value={intake.context.industry}
              onChange={(e) => onSubmitIntakeField("context", { ...intake.context, industry: e.target.value })}
            />
          </label>

          <label>
            Role
            <input
              value={intake.context.role}
              onChange={(e) => onSubmitIntakeField("context", { ...intake.context, role: e.target.value })}
            />
          </label>

          <label>
            Career Years
            <input
              type="number"
              min={0}
              value={intake.context.career_years}
              onChange={(e) =>
                onSubmitIntakeField("context", { ...intake.context, career_years: Number(e.target.value) || 0 })
              }
            />
          </label>

          <label>
            Current Concerns
            <textarea
              value={intake.context.current_concerns ?? ""}
              onChange={(e) => onSubmitIntakeField("context", { ...intake.context, current_concerns: e.target.value })}
            />
          </label>

          <label>
            Job Satisfaction (optional)
            <input
              type="number"
              min={1}
              max={5}
              value={intake.context.job_satisfaction ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onSubmitIntakeField("context", {
                  ...intake.context,
                  job_satisfaction: value === "" ? undefined : Number(value)
                });
              }}
            />
          </label>

          <label>
            Current Relationship Level
            <select
              value={intake.relationship_map.current_level}
              onChange={(e) =>
                onSubmitIntakeField("relationship_map", {
                  ...intake.relationship_map,
                  current_level: Number(e.target.value) as 1 | 2 | 3
                })
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>

          <label>
            Desired Relationship Level (optional)
            <select
              value={intake.relationship_map.desired_level ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onSubmitIntakeField("relationship_map", {
                  ...intake.relationship_map,
                  desired_level: value === "" ? undefined : (Number(value) as 1 | 2 | 3)
                });
              }}
            >
              <option value="">-</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>

          <label>
            Relationship Notes
            <textarea
              value={intake.relationship_map.notes ?? ""}
              onChange={(e) => onSubmitIntakeField("relationship_map", { ...intake.relationship_map, notes: e.target.value })}
            />
          </label>

          <p>Locale: {intake.assessment_meta.locale}</p>
          <p>Test Version: {intake.assessment_meta.test_version}</p>
        </section>
      ) : (
        <section>
          <p>
            Progress: {step}/{items.length}
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
      )}

      {error ? <p>{error}</p> : null}

      <div>
        <button type="button" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0 || isSubmitting}>
          Previous
        </button>

        {step < totalSteps - 1 ? (
          <button type="button" onClick={() => setStep((prev) => prev + 1)} disabled={!canGoNext || isSubmitting}>
            Next
          </button>
        ) : (
          <button type="button" onClick={onSubmitAssessment} disabled={isSubmitting || !canGoNext}>
            Submit
          </button>
        )}
      </div>
    </main>
  );
}
