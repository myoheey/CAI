import Link from "next/link";

const FEATURES = [
  { icon: "🎯", title: "연구 기반 개발", desc: "Edgar Schein의 커리어 앵커 이론을 기반으로 설계" },
  { icon: "🧠", title: "전문가 설계", desc: "교육학 전문가가 검증한 40개 문항" },
  { icon: "✨", title: "AI 맞춤 분석", desc: "개인 맥락을 반영한 심층 리포트 제공" }
];

const HIGHLIGHTS = [
  { value: "10분", label: "소요 시간" },
  { value: "40문항", label: "검사 문항" },
  { value: "즉시", label: "결과 확인" }
];

export default function LandingPage() {
  return (
    <main className="text-center">
      <section style={{ paddingTop: "3rem", paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.75rem" }}>
          당신의 커리어 중심축은
          <br />
          무엇입니까?
        </h1>
        <p className="text-secondary" style={{ fontSize: "1.05rem", marginBottom: "2rem" }}>
          교육학 기반 커리어 앵커 진단 시스템
        </p>

        <Link href="/intro" className="btn btn-accent btn-lg btn-block">
          검사 시작하기
        </Link>
      </section>

      <section style={{ display: "flex", justifyContent: "center", gap: "2rem", padding: "1.5rem 0" }}>
        {HIGHLIGHTS.map((h) => (
          <div key={h.label} className="text-center">
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>{h.value}</div>
            <div className="text-secondary" style={{ fontSize: "0.85rem" }}>{h.label}</div>
          </div>
        ))}
      </section>

      <section className="gap-stack" style={{ paddingTop: "1rem" }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", textAlign: "left" }}>
            <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{f.icon}</span>
            <div>
              <strong>{f.title}</strong>
              <p className="text-secondary" style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
