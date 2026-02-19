"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PdfDownloadButton from "@/components/PdfDownloadButton";

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

const PATH_LABELS: Record<string, { label: string; icon: string }> = {
  stay: { label: "현재 유지", icon: "\u{1F3E0}" },
  move_similar: { label: "유사 분야 이동", icon: "\u{1F500}" },
  pivot: { label: "완전 전환", icon: "\u{1F680}" }
};

const VUCCA_ICONS: Record<string, string> = {
  Volatility: "\u{1F30A}",
  Uncertainty: "\u{1F32B}\uFE0F",
  Complexity: "\u{1F9E9}",
  Ambiguity: "\u{2753}",
  Anxiety: "\u{1F494}"
};

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

  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  );
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

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="rpt-section-title">
      <span className="rpt-section-icon">{icon}</span>
      {title}
    </h2>
  );
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
        <header className="rpt-hero rpt-hero-ai">
          <h1 className="rpt-hero-title">AI 심층 리포트</h1>
          <p className="rpt-hero-sub">저장된 리포트가 없습니다. 기본 결과 화면에서 리포트를 생성해주세요.</p>
          {error ? <p className="report-error">{error}</p> : null}
        </header>
        <Link href="/results/basic" className="btn btn-primary">
          기본 결과로 돌아가기
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
        <header className="rpt-hero rpt-hero-ai">
          <div className="rpt-hero-badge">AI 심층 리포트</div>
          <h1 className="rpt-hero-title">AI 심층 리포트</h1>
          <p className="rpt-hero-sub">
            {market} 리포트 UI는 준비 중입니다. (Coming soon)
          </p>
        </header>

        <div className="rpt-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => downloadJson("career-anchor-report.json", rawEnvelope)}
          >
            Download JSON
          </button>
          <Link href="/results/basic" className="btn btn-ghost">
            기본 결과로 돌아가기
          </Link>
        </div>

        {renderRawJsonPanel()}
      </main>
    );
  }

  return (
    <main className="report-page">
      <div id="ai-report-content">
        {/* ===== HEADER ===== */}
        <header className="rpt-hero rpt-hero-ai">
          <div className="rpt-hero-badge">AI 맞춤 분석</div>
          <h1 className="rpt-hero-title">AI 심층 리포트</h1>
          <p className="rpt-hero-sub">
            당신의 프로필과 앵커 점수를 기반으로 AI가 생성한 맞춤형 분석입니다.
          </p>
        </header>

        {/* ===== STRATEGIC OVERVIEW ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u{1F9ED}" title="전략적 개요" />

          <div className="rpt-identity-card">
            <div className="rpt-identity-label">한 문장 정체성</div>
            <p className="rpt-identity-text">{asString(strategicOverview.one_sentence_identity)}</p>
          </div>

          <div className="rpt-metaphor-card">
            <div className="rpt-metaphor-icon">\u2693</div>
            <div>
              <div className="rpt-metaphor-label">Sea Anchor 비유</div>
              <p className="rpt-metaphor-text">{asString(strategicOverview.sea_anchor_metaphor)}</p>
            </div>
          </div>

          <div className="rpt-sowhat">
            <h3 className="rpt-sowhat-title">So What — 이것이 의미하는 것</h3>
            <ul className="rpt-sowhat-list">
              {asStringList(strategicOverview.so_what).map((item, i) => (
                <li key={i} className="rpt-sowhat-item">
                  <span className="rpt-sowhat-bullet">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== TRADEOFFS ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u2696\uFE0F" title="트레이드오프 분석" />
          <div className="rpt-ai-card-grid">
            {asObjectList(report.tradeoffs).map((item, index) => (
              <article key={`${asString(item.title, "tradeoff")}-${index}`} className="rpt-ai-card">
                <h3 className="rpt-ai-card-title">{asString(item.title)}</h3>
                <p className="rpt-ai-card-body">{asString(item.description)}</p>
                <div className="rpt-ai-card-action">
                  <span className="rpt-ai-card-action-label">Action</span>
                  {asString(item.action)}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ===== RELATIONSHIP DYNAMICS ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u{1F91D}" title="관계 역학" />
          <div className="rpt-rel-levels">
            <div className="rpt-rel-level">
              <div className="rpt-rel-level-label">현재 관계 수준</div>
              <div className="rpt-rel-level-value">{asString(relationshipDynamics.current_level)}</div>
            </div>
            <div className="rpt-rel-arrow">\u2192</div>
            <div className="rpt-rel-level rpt-rel-level-desired">
              <div className="rpt-rel-level-label">희망 관계 수준</div>
              <div className="rpt-rel-level-value">{asString(relationshipDynamics.desired_level)}</div>
            </div>
          </div>
          <div className="rpt-scripts">
            <h3 className="rpt-scripts-title">커뮤니케이션 스크립트</h3>
            {asStringList(relationshipDynamics.scripts).map((script, i) => (
              <div key={i} className="rpt-script-item">
                <span className="rpt-script-quote">&ldquo;</span>
                {script}
              </div>
            ))}
          </div>
        </section>

        {/* ===== VUCCA RISK MAP ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u{1F6A8}" title="VUCCA 리스크 맵" />
          <div className="rpt-vucca-grid">
            {vuccaRiskMap.map((item, index) => {
              const dim = asString(item.dimension);
              const icon = VUCCA_ICONS[dim] || "\u26A0\uFE0F";
              return (
                <article key={`${dim}-${index}`} className="rpt-vucca-card">
                  <div className="rpt-vucca-header">
                    <span className="rpt-vucca-icon">{icon}</span>
                    <h3 className="rpt-vucca-dim">{dim}</h3>
                  </div>
                  <div className="rpt-vucca-risk">
                    <span className="rpt-vucca-label">리스크</span>
                    <p>{asString(item.risk)}</p>
                  </div>
                  <div className="rpt-vucca-mitigation">
                    <span className="rpt-vucca-label">대응 전략</span>
                    <p>{asString(item.mitigation)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== ENERGY PATTERN ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u26A1" title="에너지 패턴" />
          <div className="rpt-energy-grid">
            <div className="rpt-energy-card rpt-energy-gains">
              <h3 className="rpt-energy-title">{"\u{1F7E2}"} 에너지 충전</h3>
              <ul className="rpt-energy-list">
                {asStringList(energyPattern.gains).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
            <div className="rpt-energy-card rpt-energy-drains">
              <h3 className="rpt-energy-title">{"\u{1F534}"} 에너지 소모</h3>
              <ul className="rpt-energy-list">
                {asStringList(energyPattern.drains).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rpt-recovery-card">
            <span className="rpt-recovery-icon">{"\u{1F33F}"}</span>
            <div>
              <strong>마이크로 리커버리</strong>
              <p>{asString(energyPattern.micro_recovery)}</p>
            </div>
          </div>
        </section>

        {/* ===== DECISION SIMULATION ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u{1F52E}" title="의사결정 시뮬레이션" />
          <div className="rpt-decision-cards">
            {decisionSimulation.map((row) => {
              const pathInfo = PATH_LABELS[row.path] || { label: row.path, icon: "\u{1F4CD}" };
              return (
                <article key={row.path} className="rpt-decision-card">
                  <div className="rpt-decision-header">
                    <span className="rpt-decision-icon">{pathInfo.icon}</span>
                    <h3 className="rpt-decision-path">{pathInfo.label}</h3>
                  </div>
                  <div className="rpt-decision-grid">
                    <div className="rpt-decision-item">
                      <span className="rpt-decision-label">적합도</span>
                      <p>{row.fit}</p>
                    </div>
                    <div className="rpt-decision-item">
                      <span className="rpt-decision-label">리스크</span>
                      <p>{row.risk}</p>
                    </div>
                    <div className="rpt-decision-item">
                      <span className="rpt-decision-label">업사이드</span>
                      <p>{row.upside}</p>
                    </div>
                    <div className="rpt-decision-item rpt-decision-first-step">
                      <span className="rpt-decision-label">첫 걸음</span>
                      <p>{row.first_step}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== 90-DAY PLAN ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u{1F4C5}" title="90일 실행 계획" />
          <div className="rpt-timeline">
            {(["D30", "D60", "D90"] as const).map((stageKey, i) => {
              const stage = readPlanStage(plan90d, stageKey);
              const stageLabel = stageKey === "D30" ? "1~30일" : stageKey === "D60" ? "31~60일" : "61~90일";
              const stageColor = i === 0 ? "#2d6cdf" : i === 1 ? "#7c3aed" : "#059669";
              return (
                <article key={stageKey} className="rpt-timeline-stage">
                  <div className="rpt-timeline-dot" style={{ background: stageColor }} />
                  <div className="rpt-timeline-content">
                    <div className="rpt-timeline-header">
                      <span className="rpt-timeline-badge" style={{ background: stageColor }}>
                        {stageLabel}
                      </span>
                      <h3 className="rpt-timeline-focus">{stage.focus}</h3>
                    </div>
                    <div className="rpt-timeline-details">
                      <div>
                        <strong>Actions</strong>
                        <ul>
                          {stage.actions.map((a, j) => (
                            <li key={j}>{a}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Metrics</strong>
                        <ul>
                          {stage.metrics.map((m, j) => (
                            <li key={j}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== REFLECTION ===== */}
        <section className="rpt-section">
          <SectionHeader icon="\u{1F4AD}" title="성찰 질문" />
          <div className="rpt-reflection-list">
            {asStringList(report.reflection_questions).map((question, i) => (
              <div key={i} className="rpt-reflection-item">
                <span className="rpt-reflection-num">{i + 1}</span>
                <p>{question}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== DISCLAIMER ===== */}
        <section className="rpt-section rpt-disclaimer">
          <SectionHeader icon="\u{1F4CB}" title="면책 조항" />
          <p>{asString(report.disclaimer)}</p>
        </section>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="rpt-actions">
        <PdfDownloadButton
          targetId="ai-report-content"
          filename="career-anchor-ai-report.pdf"
          label="AI 리포트 PDF 다운로드"
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => downloadJson("career-anchor-report.json", rawEnvelope)}
        >
          JSON 다운로드
        </button>
        <Link href="/report/basic" className="btn btn-outline">
          기본 리포트 보기
        </Link>
        <Link href="/results/basic" className="btn btn-ghost">
          결과 화면으로 돌아가기
        </Link>
      </div>

      {renderRawJsonPanel()}
    </main>
  );
}
