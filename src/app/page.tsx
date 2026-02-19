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

const SAMPLE_BARS = [
  { label: "전문가 역량", value: 85, color: "#2E7D32" },
  { label: "순수한 도전", value: 78, color: "#388E3C" },
  { label: "자율/독립", value: 72, color: "#4CAF50" },
  { label: "기업가 창의성", value: 65, color: "#66BB6A" },
  { label: "라이프스타일", value: 58, color: "#81C784" },
];

export default function LandingPage() {
  return (
    <main className="full-width">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">🎯 Edgar Schein 이론 기반</div>
            <h1>
              당신의 커리어
              <br />
              <span>중심축</span>은 무엇입니까?
            </h1>
            <p className="hero-desc">
              교육학 전문가가 설계한 40문항 진단과 AI 맞춤 분석으로
              <br />
              직업 선택의 핵심 가치를 발견하세요.
            </p>
            <div className="hero-actions">
              <Link href="/intro" className="btn btn-accent btn-lg">
                무료 검사 시작 →
              </Link>
              <Link href="/intro" className="btn btn-outline">
                더 알아보기
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-card">
                <div className="hero-card-title">
                  📊 커리어 앵커 분석 결과
                </div>
                <div className="hero-anchor-bars">
                  {SAMPLE_BARS.map((bar) => (
                    <div key={bar.label} className="hero-anchor-bar">
                      <span className="hero-anchor-label">{bar.label}</span>
                      <div className="hero-anchor-track">
                        <div
                          className="hero-anchor-fill"
                          style={{
                            width: `${bar.value}%`,
                            background: bar.color,
                          }}
                        />
                      </div>
                      <span className="hero-anchor-value">{bar.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item">
            <div className="trust-item-value">10분</div>
            <div className="trust-item-label">소요 시간</div>
          </div>
          <div className="trust-item">
            <div className="trust-item-value">40문항</div>
            <div className="trust-item-label">검사 문항</div>
          </div>
          <div className="trust-item">
            <div className="trust-item-value">즉시</div>
            <div className="trust-item-label">결과 확인</div>
          </div>
          <div className="trust-item">
            <div className="trust-item-value">AI</div>
            <div className="trust-item-label">맞춤 분석</div>
          </div>
        </div>
      </section>

      {/* ── 8 Anchors ── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <h2>8가지 커리어 앵커</h2>
          <p>Edgar Schein 교수가 정의한 커리어 선택의 8가지 핵심 가치</p>
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

      {/* ── Process Steps ── */}
      <section className="process-section">
        <div className="landing-section-header">
          <h2>간단한 3단계로 완성</h2>
          <p>10분이면 당신의 커리어 중심축을 발견할 수 있습니다</p>
        </div>
        <div className="process-steps">
          <div className="process-step">
            <div className="process-step-icon green">
              <span className="process-step-number">1</span>
              📝
            </div>
            <h3>설문 응답</h3>
            <p>40개 문항에 직감적으로 응답하세요. 정답은 없습니다.</p>
            <span className="process-connector">→</span>
          </div>
          <div className="process-step">
            <div className="process-step-icon yellow">
              <span className="process-step-number">2</span>
              🧠
            </div>
            <h3>AI 분석</h3>
            <p>개인 맥락을 반영한 AI가 심층 분석을 수행합니다.</p>
            <span className="process-connector">→</span>
          </div>
          <div className="process-step">
            <div className="process-step-icon green">
              <span className="process-step-number">3</span>
              📊
            </div>
            <h3>맞춤 리포트</h3>
            <p>에너지 패턴, 의사결정, 90일 액션플랜까지 제공합니다.</p>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <h2>지금 바로 시작하세요</h2>
          <p>10분이면 당신의 커리어 앵커를 발견할 수 있습니다</p>
          <Link href="/intro" className="btn btn-accent btn-lg">
            무료 검사 시작하기 →
          </Link>
        </div>
      </section>
    </main>
  );
}
