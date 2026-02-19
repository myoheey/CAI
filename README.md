# Career Anchor Report App

Next.js + TypeScript app for Career Anchor intake, scoring, and report generation.

## Local run
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill required variables in `.env.local`.
4. Run dev server:
   ```bash
   pnpm dev
   ```

## Required environment variables
- `OPENAI_API_KEY`: Server-side API key for OpenAI.
- `OPENAI_MODEL`: Optional model override for report generation (default: `gpt-5`).

## Vercel deploy checklist
1. Connect GitHub repository in Vercel.
2. In **Project Settings → Environment Variables**, set:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
3. Confirm production branch is correct.
4. Trigger deployment.
5. Verify health endpoint:
   - `GET /api/health` returns `{ ok: true, time: <ISO8601> }`.

## Safety notes
- Never commit real secrets.
- OpenAI is called only from server routes.
