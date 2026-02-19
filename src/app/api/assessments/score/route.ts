import Ajv from "ajv";
import addFormats from "ajv-formats";
import { NextResponse } from "next/server";

import { buildDerived } from "@/lib/derived";
import { getQuestionBank } from "@/lib/questionBank";
import { ANCHOR_CODES, computeAnchorScores, type AnchorCode } from "@/lib/scoring";
import type { AnswersMap, IntakeDraft } from "@/lib/types";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const scoreRequestSchema = {
  type: "object",
  required: ["answers"],
  additionalProperties: false,
  properties: {
    intake: {
      type: "object",
      required: ["person", "context", "relationship_map", "assessment_meta"],
      additionalProperties: true,
      properties: {
        person: {
          type: "object",
          required: ["gender", "age_band"],
          additionalProperties: true,
          properties: {
            gender: { enum: ["F", "M", "N", "U"] },
            age_band: { enum: ["10s", "20s", "30s", "40s", "50s", "60s+"] }
          }
        },
        context: {
          type: "object",
          required: ["industry", "role", "career_years"],
          additionalProperties: true,
          properties: {
            industry: { type: "string" },
            role: { type: "string" },
            career_years: { type: "number", minimum: 0 }
          }
        },
        relationship_map: {
          type: "object",
          required: ["current_level"],
          additionalProperties: true,
          properties: {
            current_level: { enum: [1, 2, 3] }
          }
        },
        assessment_meta: {
          type: "object",
          required: ["test_version"],
          additionalProperties: true,
          properties: {
            test_version: { const: "anchor_v1.2" }
          }
        }
      }
    },
    answers: {
      type: "object",
      minProperties: 1,
      patternProperties: {
        "^Q\\d+$": { type: "number", minimum: 1, maximum: 5 }
      },
      additionalProperties: false
    }
  }
} as const;

const validateScoreRequest = ajv.compile(scoreRequestSchema);

function createEmptyAnchors(): Record<AnchorCode, number> {
  return {
    TF: 0,
    GM: 0,
    AU: 0,
    SE: 0,
    EC: 0,
    SV: 0,
    CH: 0,
    LS: 0
  };
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!validateScoreRequest(payload)) {
    return NextResponse.json({ ok: false, errors: validateScoreRequest.errors }, { status: 400 });
  }

  const defaultIntake: IntakeDraft = {
    person: { gender: "U", age_band: "20s" },
    context: { industry: "", role: "", career_years: 0 },
    relationship_map: { current_level: 1 },
    assessment_meta: { test_version: "anchor_v1.2", locale: "ko-KR" }
  };
  const intake = payload.intake ? (payload.intake as IntakeDraft) : defaultIntake;
  const hasIntake = Boolean(payload.intake);
  const answers = payload.answers as AnswersMap;
  const questionBank = await getQuestionBank();
  const anchors = computeAnchorScores(questionBank, answers);
  const nowISO = new Date().toISOString();

  const input = {
    person: intake.person,
    context: intake.context,
    relationship_map: intake.relationship_map,
    assessment_meta: {
      test_version: intake.assessment_meta.test_version,
      completed_at: nowISO,
      locale: "ko-KR" as const
    },
    scores: {
      scale: "0-100" as const,
      anchors: {
        ...createEmptyAnchors(),
        ...anchors
      },
      growth_intentions: null,
      raw: null
    },
    has_intake: hasIntake
  };

  const derived = buildDerived({
    anchors: input.scores.anchors,
    growth_intentions: input.scores.growth_intentions
  });

  for (const code of ANCHOR_CODES) {
    if (Number.isNaN(input.scores.anchors[code])) {
      return NextResponse.json(
        { ok: false, error: `Invalid score computed for anchor ${code}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    input,
    derived
  });
}
