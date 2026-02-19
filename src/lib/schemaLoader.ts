import b2bEduSchema from "../../schemas/cai.report.b2b_edu.v1.schema.json";
import b2cSchema from "../../schemas/cai.report.b2c.v1.schema.json";
import hrCorpSchema from "../../schemas/cai.report.hr_corp.v1.schema.json";

export type ReportMarket = "B2C" | "B2B_EDU" | "HR_CORP";

const MARKET_SCHEMA: Record<ReportMarket, Record<string, unknown>> = {
  B2C: b2cSchema as Record<string, unknown>,
  B2B_EDU: b2bEduSchema as Record<string, unknown>,
  HR_CORP: hrCorpSchema as Record<string, unknown>
};

const SCHEMA_META_KEYS = new Set(["$id", "$schema", "title"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeSchemaForOpenAI(schema: unknown, insideProperties = false): unknown {
  if (Array.isArray(schema)) {
    return schema.map((item) => sanitizeSchemaForOpenAI(item));
  }

  if (!isPlainObject(schema)) {
    return schema;
  }

  const sanitizedEntries = Object.entries(schema)
    .filter(([key]) => insideProperties || !SCHEMA_META_KEYS.has(key))
    .map(([key, value]) => [key, sanitizeSchemaForOpenAI(value, key === "properties" || key === "$defs")] as const);

  return Object.fromEntries(sanitizedEntries);
}

export async function loadMarketSchema(market: ReportMarket): Promise<Record<string, unknown>> {
  const { default: RefParser } = await import("@apidevtools/json-schema-ref-parser");
  const parser = new RefParser();
  const dereferenced = await parser.dereference(MARKET_SCHEMA[market]);
  return sanitizeSchemaForOpenAI(dereferenced) as Record<string, unknown>;
}

export async function loadRawMarketSchema(market: ReportMarket) {
  return structuredClone(MARKET_SCHEMA[market]);
}
