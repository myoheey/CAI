import Link from "next/link";

const ANCHORS = [
  { code: "TF", icon: "🔧", name: "전문가 역량", desc: "전문 지식과 기술 심화를 추구" },
  { code: "GM", icon: "👔", name: "관리자 역량", desc: "조직 총괄과 리더십을 지향" },
  { code: "AU", icon: "🦅", name: "자율/독립", desc: "자유로운 방식으로 일하기를 선호" },
  { code: "SE", icon: "🛡️", name: "안정/보장", desc: "안정적이고 예측 가능한 환경 중시" },
  { code: "EC", icon: "🚀", name: "기업가 창의성", desc: "새로운 사업과 아이디어 창출에 열정" },
  { code: "SV", icon: "💚", name: "봉사/헌신", desc: "사회적 가치와 타인 기여에 의미 부여" },
  { code: "CH", icon: "⚡", name: "순수한 도전", desc: "어려운 문제 해결에서 성취감 획득" },
  { code: "LS", icon: "⚖️", name: "라이프스타일", desc: "일과 삶의 균형을 최우선으로 추구" },
];

export default function IntroPage() {
  return (
    <main className="full-width">
      {/* Header Section */}
      <section
        style={{
          padding: "3rem 0",
          background: "linear-gradient(160deg, #FFFDE7 0%, #E8F5E9 100%)",
          textAlign: "center",
        }}
      >
        <div className="container">
          <div className="hero-badge" style={{ display: "inline-flex" }}>
            📖 Edgar Schein의 커리어 앵커 이론
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "1rem 0 0.75rem" }}>
            커리어 앵커란?
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--color-text-secondary)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            커리어 앵커는 직업 선택과 만족도를 결정짓는{" "}
            <strong style={{ color: "var(--color-primary)" }}>핵심 가치와 동기</strong>입니다.
            <br />
            MIT 경영대학원 Edgar Schein 교수의 연구에 기반합니다.
          </p>
        </div>
      </section>

      {/* 8 Anchors Grid */}
      <section className="landing-section">
        <div className="landing-section-header">
          <h2>8가지 커리어 앵커</h2>
        </div>
        <div className="anchor-grid">
          {ANCHORS.map((a) => (
            <div key={a.code} className="anchor-card">
              <span className="anchor-card-icon">{a.icon}</span>
              <h3 className="anchor-card-name">{a.name}</h3>
              <p className="anchor-card-desc">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 검사 안내 */}
      <section className="process-section">
        <div className="landing-section-header">
          <h2>검사 안내</h2>
        </div>
        <div
          className="container"
          style={{ maxWidth: "720px" }}
        >
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: "3rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>40문항</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>검사 문항</div>
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>약 10분</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>소요 시간</div>
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>5점 척도</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>응답 방식</div>
              </div>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", marginBottom: "0", lineHeight: 1.7 }}>
              각 문항을 읽고 자신에게 얼마나 해당되는지 직감적으로 응답해주세요.
              <br />
              정답은 없으며, 솔직한 응답일수록 정확한 결과를 얻을 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <div className="container">
          <h2>검사를 시작하세요</h2>
          <p>솔직한 응답이 정확한 결과의 시작입니다</p>
          <Link href="/assessment" className="btn btn-accent btn-lg">
            검사 시작 →
          </Link>
        </div>
      </section>
    </main>
  );
}
