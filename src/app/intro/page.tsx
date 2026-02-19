import Link from "next/link";

const ANCHORS = [
  { code: "TF", icon: "🔧", name: "전문가 역량", desc: "전문 지식과 기술 심화를 추구" },
  { code: "GM", icon: "👔", name: "관리자 역량", desc: "조직 총괄과 리더십을 지향" },
  { code: "AU", icon: "🦅", name: "자율/독립", desc: "자유로운 방식으로 일하기를 선호" },
  { code: "SE", icon: "🛡️", name: "안정/보장", desc: "안정적이고 예측 가능한 환경 중시" },
  { code: "EC", icon: "🚀", name: "기업가 창의성", desc: "새로운 사업과 아이디어 창출에 열정" },
  { code: "SV", icon: "💚", name: "봉사/헌신", desc: "사회적 가치와 타인 기여에 의미 부여" },
  { code: "CH", icon: "⚡", name: "순수한 도전", desc: "어려운 문제 해결에서 성취감 획득" },
  { code: "LS", icon: "⚖️", name: "라이프스타일", desc: "일과 삶의 균형을 최우선으로 추구" }
];

export default function IntroPage() {
  return (
    <main>
      <section className="text-center" style={{ paddingTop: "1.5rem", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>커리어 앵커란?</h1>
        <p className="text-secondary" style={{ fontSize: "0.95rem" }}>
          커리어 앵커는 직업 선택과 만족도를 결정짓는 <strong>핵심 가치와 동기</strong>입니다.
          <br />
          MIT 경영대학원 Edgar Schein 교수의 연구에 기반합니다.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>8가지 커리어 앵커</h2>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {ANCHORS.map((a) => (
            <div key={a.code} className="card text-center" style={{ padding: "1rem 0.75rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>{a.icon}</div>
              <strong style={{ fontSize: "0.9rem" }}>{a.name}</strong>
              <p className="text-secondary" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-3" style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>검사 안내</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>40문항</div>
            <div className="text-secondary" style={{ fontSize: "0.85rem" }}>검사 문항</div>
          </div>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>약 10분</div>
            <div className="text-secondary" style={{ fontSize: "0.85rem" }}>소요 시간</div>
          </div>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>5점 척도</div>
            <div className="text-secondary" style={{ fontSize: "0.85rem" }}>응답 방식</div>
          </div>
        </div>
        <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
          각 문항을 읽고 자신에게 얼마나 해당되는지 직감적으로 응답해주세요.
          <br />
          정답은 없으며, 솔직한 응답일수록 정확한 결과를 얻을 수 있습니다.
        </p>
      </section>

      <div className="mt-3 text-center">
        <Link href="/assessment" className="btn btn-primary btn-lg btn-block">
          검사 시작
        </Link>
      </div>
    </main>
  );
}
