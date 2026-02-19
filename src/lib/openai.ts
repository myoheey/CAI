import "server-only";

import OpenAI from "openai";

function assertServerOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required on the server.");
  }

  return apiKey;
}

export function getServerOpenAIClient() {
  const apiKey = assertServerOpenAIKey();
  return new OpenAI({ apiKey });
}
