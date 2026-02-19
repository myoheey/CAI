# Project: Career Anchor Report App

## Goal
Build a web app that:
1) shows a Career Anchor questionnaire
2) computes scores + derived server-side
3) calls OpenAI Responses API to generate a JSON report (B2C/B2B_EDU/HR_CORP)
4) renders the report UI

## Non-negotiables
- All LLM outputs MUST be valid JSON matching the market schema in /schemas.
- Validate request/response with AJV.
- derived must be computed server-side (do not let the LLM compute ranks/gaps).
- Never call OpenAI from browser. Only from server using OPENAI_API_KEY.

## Code style
- TypeScript strict mode
- Prefer small pure functions for scoring/derived
- Add unit tests for scoring and derived.

## Commands
- Use pnpm
- After changes: pnpm lint && pnpm test

## Files of truth
- /schemas/* are contracts (do not change lightly).
- /question_bank/anchor_v1.2.json is the source of questions.
- /prompts/* are master prompts.
