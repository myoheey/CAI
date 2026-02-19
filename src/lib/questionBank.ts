import { readFile } from "node:fs/promises";
import path from "node:path";

import type { QuestionBank } from "./types";

const QUESTION_BANK_PATH = path.join(process.cwd(), "question_bank", "anchor_v1.2.json");

export async function getQuestionBank(): Promise<QuestionBank> {
  const file = await readFile(QUESTION_BANK_PATH, "utf-8");
  const parsed = JSON.parse(file) as QuestionBank;
  return parsed;
}

export async function getQuestionItems() {
  const bank = await getQuestionBank();
  return bank.items;
}
