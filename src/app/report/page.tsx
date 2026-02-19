"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const REPORT_KEY = "cai_last_report_envelope_v1";

type Market = "B2C" | "B2B_EDU" | "HR_CORP";

interface ReportEnvelope {
  meta?: {
    market?: Market;
  };
  report?: Record<string, unknown>;
}

interface DecisionSimulationRow {
  path: string;
  fit: string;
  risk: string;
  upside: string;
  first_step: string;
}

function asString(value: unknown, fallback = "-"): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asObjectList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item));
}

function readPlanStage(plan: Record<string, unknown>, stageKey: "D30" | "D60" | "D90") {
  const stage = asObject(plan[stageKey]);
  return {
    focus: asString(stage.focus),
    actions: asStringList(stage.actions),
    metrics: asStringList(stage.metrics)
  };
}

function parseDecisionSimulation(value: unknown): DecisionSimulationRow[] {
  return asObjectList(value).map((row) => ({
    path: asString(row.path),
    fit: asString(row.fit),
    risk: asString(row.risk),
    upside: asString(row.upside),
    first_step: asString(row.first_step)
  }));
}

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function ReportPage() {
  const [rawEnvelope, setRawEnvelope] = useState<string>("");
  const [envelope, setEnvelope] = useState<ReportEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(REPORT_KEY);
    if (!raw) {
      return;
    }

    setRawEnvelope(raw);

    try {
      const parsed = JSON.parse(raw) as ReportEnvelope;
      setEnvelope(parsed);
    } catch {
      setError("리포트 JSON 파싱에 실패했습니다.");
    }
  }, []);

  const market = envelope?.meta?.market;
  const report = useMemo(() => asObject(envelope?.report), [envelope?.report]);

  const strategicOverview = asObject(report.strategic_overview);
  const relationshipDynamics = asObject(report.relationship_dynamics);
  const vuccaRiskMap = asObjectList(report.vucca_risk_map);
  const energyPattern = asObject(report.energy_pattern);
  const plan90d = asObject(report.plan_90d);
  const decisionSimulation = parseDecisionSimulation(report.decision_simulation);

  const hasReport = Boolean(envelope?.report);

  if (!hasReport) {
    return (
      <main className="report-page">
        <header className="report-header">
          <h1>AI 심층 리포트</h1>
          <p>저장된 리포트가 없습니다. 기본 결과 화면에서 리포트를 생성해주세요.</p>
          {error ? <p className="report-error">{error}</p> : null}
        </header>
        <Link href="/results/basic" className="btn-link">
          Back to basic results
        </Link>
      </main>
    );
  }

  function renderRawJsonPanel() {
    return (
      <details className="raw-json-panel">
        <summary>Raw JSON 보기</summary>
        <pre>{rawEnvelope}</pre>
      </details>
    );
  }

  if (market === "B2B_EDU" || market === "HR_CORP") {
    return (
      <main className="report-page">
        <header className="report-header">
          <h1>AI 심층 리포트</h1>
          <p>
            {market} 리포트 UI는 준비 중입니다. (Coming soon)
          </p>
        </header>

        <div className="report-actions">
          <button type="button" onClick={() => downloadJson("career-anchor-report.json", rawEnvelope)}>
            Download JSON
          </button>
          <Link href="/results/basic" className="btn-link">
            Back to basic results
          </Link>
        </div>

        {renderRawJsonPanel()}
      </main>
    );
  }

  return (
    <main className="report-page">
      <header className="report-header">
        <h1>AI 심층 리포트</h1>
        <p>B2C 맞춤 리포트</p>
      </header>

      <div className="report-actions">
        <button type="button" onClick={() => downloadJson("career-anchor-report.json", rawEnvelope)}>
          Download JSON
        </button>
        <Link href="/results/basic" className="btn-link">
          Back to basic results
        </Link>
      </div>

      <section>
        <h2>Strategic Overview</h2>
        <p>
          <strong>한 문장 정체성:</strong> {asString(strategicOverview.one_sentence_identity)}
        </p>
        <p>
          <strong>Sea Anchor 비유:</strong> {asString(strategicOverview.sea_anchor_metaphor)}
        </p>
        <h3>So What</h3>
        <ul>
          {asStringList(strategicOverview.so_what).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Tradeoffs</h2>
        <div className="card-grid">
          {asObjectList(report.tradeoffs).map((item, index) => (
            <article key={`${asString(item.title, "tradeoff")}-${index}`} className="card">
              <h3>{asString(item.title)}</h3>
              <p>{asString(item.description)}</p>
              <p>
                <strong>Action:</strong> {asString(item.action)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Relationship Dynamics</h2>
        <p>
          <strong>Current Level:</strong> {asString(relationshipDynamics.current_level)}
        </p>
        <p>
          <strong>Desired Level:</strong> {asString(relationshipDynamics.desired_level)}
        </p>
        <h3>Scripts</h3>
        <ul>
          {asStringList(relationshipDynamics.scripts).map((script) => (
            <li key={script}>{script}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>VUCCA Risk Map</h2>
        <div className="card-grid">
          {vuccaRiskMap.map((item, index) => (
            <article key={`${asString(item.dimension, "dimension")}-${index}`} className="card">
              <h3>{asString(item.dimension)}</h3>
              <p>
                <strong>Risk:</strong> {asString(item.risk)}
              </p>
              <p>
                <strong>Mitigation:</strong> {asString(item.mitigation)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Energy Pattern</h2>
        <p>
          <strong>Gains:</strong> {asStringList(energyPattern.gains).join(", ") || "-"}
        </p>
        <p>
          <strong>Drains:</strong> {asStringList(energyPattern.drains).join(", ") || "-"}
        </p>
        <p>
          <strong>Micro Recovery:</strong> {asString(energyPattern.micro_recovery)}
        </p>
      </section>

      <section>
        <h2>Decision Simulation</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Path</th>
                <th>Fit</th>
                <th>Risk</th>
                <th>Upside</th>
                <th>First Step</th>
              </tr>
            </thead>
            <tbody>
              {decisionSimulation.map((row) => (
                <tr key={row.path}>
                  <td>{row.path}</td>
                  <td>{row.fit}</td>
                  <td>{row.risk}</td>
                  <td>{row.upside}</td>
                  <td>{row.first_step}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>90-Day Plan</h2>
        {(["D30", "D60", "D90"] as const).map((stageKey) => {
          const stage = readPlanStage(plan90d, stageKey);
          return (
            <article key={stageKey} className="card">
              <h3>{stageKey}</h3>
              <p>
                <strong>Focus:</strong> {stage.focus}
              </p>
              <p>
                <strong>Actions:</strong> {stage.actions.join(", ") || "-"}
              </p>
              <p>
                <strong>Metrics:</strong> {stage.metrics.join(", ") || "-"}
              </p>
            </article>
          );
        })}
      </section>

      <section>
        <h2>Reflection Questions</h2>
        <ul>
          {asStringList(report.reflection_questions).map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Disclaimer</h2>
        <p>{asString(report.disclaimer)}</p>
      </section>

      {renderRawJsonPanel()}
    </main>
  );
}
