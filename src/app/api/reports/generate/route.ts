import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import Ajv, { type ErrorObject } from "ajv";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getServerOpenAIClient } from "@/lib/openai";
import { loadMarketSchema, type ReportMarket } from "@/lib/schemaLoader";

export const runtime = "nodejs";

const ajv = new Ajv({ allErrors: true, strict: false });

const requestSchema = {
  type: "object",
  required: ["market", "input", "derived", "report_options"],
  additionalProperties: false,
  properties: {
    market: { enum: ["B2C", "B2B_EDU", "HR_CORP"] },
    input: { type: "object" },
    derived: { type: "object" },
    report_options: {
      type: "object",
      required: ["tone", "depth", "language", "strict_json"],
      additionalProperties: true,
      properties: {
        tone: { type: "string" },
        depth: { type: "string" },
        language: { type: "string" },
        strict_json: { type: "boolean" }
      }
    }
  }
} as const;

const validateRequest = ajv.compile(requestSchema);

const MARKET_PROMPT_PATH: Record<ReportMarket, string> = {
  B2C: "prompts/b2c.master_prompt.md",
  B2B_EDU: "prompts/b2b_edu.master_prompt.md",
  HR_CORP: "prompts/hr_corp.master_prompt.md"
};

const MARKET_SCHEMA_NAME: Record<ReportMarket, string> = {
  B2C: "cai_report_b2c_v1",
  B2B_EDU: "cai_report_b2b_edu_v1",
  HR_CORP: "cai_report_hr_corp_v1"
};

const MARKET_PROMPT_ID: Record<ReportMarket, string> = {
  B2C: "prompt.b2c.master",
  B2B_EDU: "prompt.b2b_edu.master",
  HR_CORP: "prompt.hr_corp.master"
};


const MARKET_PROMPT_FALLBACK: Record<ReportMarket, string> = {
  B2C: `You are a career-development assistant for Korean users.
Produce ONLY JSON matching the provided schema exactly.
Use derived as source of truth and do not recalculate rank/gaps/tradeoffs.
Use psychologically safe, non-diagnostic language.`,
  B2B_EDU: `You are a career-development assistant for education institutions.
Produce ONLY JSON matching the provided schema exactly.
Use derived as source of truth and do not recalculate rank/gaps/tradeoffs.
Use psychologically safe, non-diagnostic language.`,
  HR_CORP: `You are a career-development assistant for corporate HR use cases.
Produce ONLY JSON matching the provided schema exactly.
Use derived as source of truth and do not recalculate rank/gaps/tradeoffs.
Use psychologically safe, non-diagnostic language.`
};

function extractOutputText(response: unknown): string {
  const maybeResponse = response as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };

  if (typeof maybeResponse.output_text === "string" && maybeResponse.output_text.trim()) {
    return maybeResponse.output_text;
  }

  const contentText = maybeResponse.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .join("\n")
    .trim();

  if (contentText) {
    return contentText;
  }

  throw new Error("Model response did not include output text.");
}

function extractRequestId(response: unknown): string | null {
  const maybeResponse = response as { request_id?: unknown; id?: unknown };

  if (typeof maybeResponse.request_id === "string") {
    return maybeResponse.request_id;
  }

  if (typeof maybeResponse.id === "string") {
    return maybeResponse.id;
  }

  return null;
}

async function loadPromptByMarket(market: ReportMarket) {
  const relativePath = MARKET_PROMPT_PATH[market];
  const promptPath = path.join(process.cwd(), relativePath);

  try {
    const [prompt, fileStats] = await Promise.all([readFile(promptPath, "utf-8"), stat(promptPath)]);

    return {
      prompt,
      prompt_id: MARKET_PROMPT_ID[market],
      prompt_version: fileStats.mtime.toISOString(),
      fallback_used: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("prompt load failed, using fallback prompt", { market, path: promptPath, message });

    return {
      prompt: MARKET_PROMPT_FALLBACK[market],
      prompt_id: `${MARKET_PROMPT_ID[market]}.fallback`,
      prompt_version: "embedded-fallback-v1",
      fallback_used: true
    };
  }
}

function parseJsonOrThrow(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    throw new Error(
      error instanceof Error ? `Model output is not valid JSON: ${error.message}` : "Model output is not valid JSON"
    );
  }
}

function validationError(details: unknown, status = 422) {
  return NextResponse.json(
    {
      error: {
        code: "LLM_SCHEMA_MISMATCH",
        message: "Generated report did not match the target schema.",
        details
      }
    },
    { status }
  );
}


function invalidRequestError(message: string, details?: unknown, status = 400) {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_REQUEST",
        message,
        details: details ?? null
      }
    },
    { status }
  );
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined) {
  return (errors ?? []).map((error) => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message,
    params: error.params
  }));
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fallbackReportForB2C(requestBody: { input: unknown; derived: unknown }) {
  const input = asObject(requestBody.input);
  const derived = asObject(requestBody.derived);
  const rank = Array.isArray(derived.anchor_rank)
    ? derived.anchor_rank.filter((item): item is string => typeof item === "string")
    : [];
  const top = rank.slice(0, 2);
  const bottom = Array.isArray(derived.bottom_anchors)
    ? derived.bottom_anchors.filter((item): item is string => typeof item === "string").slice(0, 2)
    : [];

  const currentLevel = asObject(input.relationship_map).current_level;
  const desiredLevel = asObject(input.relationship_map).desired_level;

  return {
    strategic_overview: {
      one_sentence_identity: `당신은 ${top.join("/") || "핵심 앵커"}를 중심으로 의미와 성장을 추구하는 사람입니다.`,
      sea_anchor_metaphor: "파도가 강할수록 닻의 각도를 조정해 항로를 유지하는 선장처럼, 상황 변화에 맞춰 강점을 재배치하는 전략이 필요합니다.",
      so_what: [
        "상위 앵커가 충족되는 역할에서 몰입과 성과가 함께 올라갑니다.",
        "하위 앵커가 자주 요구되는 환경에서는 에너지 소모가 빨라질 수 있습니다.",
        "향후 90일은 강점 유지와 리스크 완화 루틴을 동시에 설계하는 것이 핵심입니다."
      ]
    },
    tradeoffs: [
      {
        title: `${top[0] || "상위 앵커"} vs ${bottom[0] || "하위 앵커"}`,
        description: "강점을 밀어붙일수록 반대 축의 요구를 소홀히 할 위험이 있습니다.",
        action: "주 1회 의사결정 로그를 남겨 편향을 점검하세요."
      },
      {
        title: `${top[1] || "두 번째 앵커"}와 실행 현실성`,
        description: "좋은 방향이라도 실행 단위가 크면 지연됩니다.",
        action: "2주 단위의 작은 실험으로 검증 속도를 높이세요."
      }
    ],
    relationship_dynamics: {
      current_level: String(currentLevel ?? "1"),
      desired_level: String(desiredLevel ?? currentLevel ?? "2"),
      scripts: [
        "이번 분기에는 제 강점이 가장 잘 발휘되는 과제를 우선순위로 정렬하고 싶습니다.",
        "현재 역할은 유지하되, 성장 목표와 맞는 책임을 단계적으로 확대하고 싶습니다."
      ]
    },
    vucca_risk_map: [
      { dimension: "Volatility", risk: "우선순위 급변으로 집중이 분산됨", mitigation: "주간 Top 3 목표를 고정하고 변경은 주 1회만 반영" },
      { dimension: "Uncertainty", risk: "정보 부족으로 의사결정 지연", mitigation: "결정 전제와 가설을 문서화해 빠르게 업데이트" },
      { dimension: "Complexity", risk: "이해관계자 증가로 실행 속도 저하", mitigation: "의사결정권자/리뷰어를 명확히 분리" },
      { dimension: "Ambiguity", risk: "성공 기준 불명확", mitigation: "완료 기준(Definition of Done)을 먼저 합의" },
      { dimension: "Anxiety", risk: "심리적 압박으로 회피 행동 증가", mitigation: "매일 10분 회고로 감정-행동 연결을 점검" }
    ],
    energy_pattern: {
      gains: ["강점과 맞는 과제의 자율적 추진", "명확한 기대치와 빠른 피드백"],
      drains: ["반복적 보고 중심 업무", "의미 연결이 약한 단기 업무 누적"],
      micro_recovery: ["점심 전후 10분 산책", "업무 종료 전 3줄 회고"]
    },
    decision_simulation: [
      { path: "stay", fit: "현재 조직 맥락을 활용 가능", risk: "역할 변화 폭이 제한될 수 있음", upside: "리스크 낮게 성과 축적", first_step: "상사와 90일 역할 조정 미팅" },
      { path: "move_similar", fit: "유사 직무로 강점 이식 용이", risk: "환경 적응 비용 발생", upside: "보상/성장 곡선 개선 가능", first_step: "타깃 포지션 5개 정보 인터뷰" },
      { path: "pivot", fit: "장기 의미와 학습 욕구 충족", risk: "초기 불확실성 높음", upside: "커리어 정체 해소", first_step: "4주 파일럿 프로젝트 설계" }
    ],
    plan_90d: {
      D30: {
        focus: "현재 역할에서 강점 사용률을 높이는 정렬",
        actions: ["주간 핵심업무 재정의", "비핵심 업무 위임/축소 협의"],
        metrics: ["강점 활용 체감도 주간 1회 기록", "핵심업무 비중 10%p 상승"]
      },
      D60: {
        focus: "성장 시나리오 검증",
        actions: ["의사결정 시나리오 3안 비교", "외부 멘토 2명 피드백 수집"],
        metrics: ["시나리오별 리스크/보상 점수화", "의사결정 지연일수 감소"]
      },
      D90: {
        focus: "선택안 실행 전환",
        actions: ["선택안 실행 로드맵 확정", "관계자 커뮤니케이션 실행"],
        metrics: ["첫 실행 마일스톤 달성", "주관적 소진도 감소"]
      }
    },
    reflection_questions: [
      "최근 2주간 가장 에너지가 올라간 순간은 언제였나요?",
      "현재 선택이 6개월 후의 나에게 어떤 기회를 열어주나요?",
      "불안을 줄이기 위해 이번 주에 할 수 있는 가장 작은 행동은 무엇인가요?"
    ],
    disclaimer: "이 리포트는 자기이해와 커리어 의사결정을 돕기 위한 참고자료이며, 의학적/심리학적 진단이 아닙니다."
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown generation error";
}

function openAIErrorResponse(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    return NextResponse.json(
      {
        error: {
          code: "OPENAI_API_ERROR",
          message: error.message,
          details: {
            status: error.status ?? 500,
            type: error.type,
            code: error.code,
            param: error.param
          }
        }
      },
      { status: error.status ?? 500 }
    );
  }

  return validationError({ message: toErrorMessage(error) }, 500);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!rawBody.trim()) {
      return invalidRequestError("Request body is required.");
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(rawBody);
    } catch (error) {
      return invalidRequestError(
        "Request body must be valid JSON.",
        error instanceof Error ? error.message : String(error)
      );
    }

    if (!validateRequest(requestBody)) {
      return invalidRequestError("Request body validation failed.", validateRequest.errors);
    }

    const market = requestBody.market as ReportMarket;
    const primaryModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    const [schema, promptMeta] = await Promise.all([loadMarketSchema(market), loadPromptByMarket(market)]);

    const validateReport = ajv.compile(schema);
    const userInput = JSON.stringify(
      {
        market,
        input: requestBody.input,
        derived: requestBody.derived,
        report_options: requestBody.report_options
      },
      null,
      2
    );

    let openaiClient: ReturnType<typeof getServerOpenAIClient>;
    try {
      openaiClient = getServerOpenAIClient();
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: "OPENAI_KEY_MISSING",
            message: error instanceof Error ? error.message : "OPENAI_API_KEY is not set"
          }
        },
        { status: 500 }
      );
    }

    async function requestReport(model: string, extraInstruction = "") {
      const instructions = extraInstruction
        ? `${promptMeta.prompt}

${extraInstruction}`
        : promptMeta.prompt;

      const response = await openaiClient.responses.create({
        model,
        instructions,
        input: userInput,
        text: {
          format: {
            type: "json_schema",
            name: MARKET_SCHEMA_NAME[market],
            strict: true,
            schema
          }
        },
        store: false
      });

      const outputText = extractOutputText(response);

      const report = parseJsonOrThrow(outputText);
      return { response, report, outputText };
    }

    let attempt: Awaited<ReturnType<typeof requestReport>> | null = null;
    let activeModel = primaryModel;
    let lastError: unknown = null;

    const modelCandidates = Array.from(new Set([primaryModel, "gpt-4.1-mini"]));

    for (const candidateModel of modelCandidates) {
      try {
        attempt = await requestReport(candidateModel);
        activeModel = candidateModel;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;

        if (!(error instanceof OpenAI.APIError)) {
          throw error;
        }

        const modelNotAvailable = error.status === 404 || error.code === "model_not_found";
        if (!modelNotAvailable) {
          throw error;
        }
      }
    }

    if (!attempt) {
      return openAIErrorResponse(lastError);
    }

    const warnings: string[] = [];
    if (promptMeta.fallback_used) {
      warnings.push("PROMPT_FILE_MISSING_FALLBACK_USED");
    }

    if (!validateReport(attempt.report)) {
      attempt = await requestReport(
        activeModel,
        "Your last output did not match the schema. Output JSON again matching the schema exactly. Keep the same content, only fix structure."
      );

      if (!validateReport(attempt.report)) {
        const mismatchDetails = {
          market,
          model: activeModel,
          request_id: extractRequestId(attempt.response),
          errors: formatAjvErrors(validateReport.errors),
          output_preview: attempt.outputText.slice(0, 1200)
        };

        if (market !== "B2C") {
          console.error("report schema mismatch", mismatchDetails);
          return validationError(mismatchDetails);
        }

        const fallbackReport = fallbackReportForB2C(requestBody as { input: unknown; derived: unknown });
        if (!validateReport(fallbackReport)) {
          console.error("fallback report schema mismatch", {
            market,
            model: activeModel,
            errors: formatAjvErrors(validateReport.errors)
          });
          return validationError({
            ...mismatchDetails,
            fallback_errors: formatAjvErrors(validateReport.errors)
          });
        }

        warnings.push("LLM_SCHEMA_MISMATCH_FALLBACK_APPLIED");

        return NextResponse.json({
          meta: {
            market,
            schema_version: "cai.report_response_envelope.v1",
            generated_at: new Date().toISOString(),
            request_id: extractRequestId(attempt.response),
            prompt_id: promptMeta.prompt_id,
            prompt_version: promptMeta.prompt_version,
            model: activeModel,
            warnings
          },
          report: fallbackReport
        });
      }
    }

    return NextResponse.json({
      meta: {
        market,
        schema_version: "cai.report_response_envelope.v1",
        generated_at: new Date().toISOString(),
        request_id: extractRequestId(attempt.response),
        prompt_id: promptMeta.prompt_id,
        prompt_version: promptMeta.prompt_version,
        model: activeModel,
        warnings
      },
      report: attempt.report
    });
  } catch (error) {
    return openAIErrorResponse(error);
  }
}
