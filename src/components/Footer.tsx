import Link from "next/link";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h3>⚓ Career Anchor Insight</h3>
                    <p>
                        Edgar Schein의 커리어 앵커 이론을 기반으로 한
                        <br />
                        교육학 전문가 설계 진단 시스템
                    </p>
                </div>
                <div className="footer-col">
                    <h4>서비스</h4>
                    <Link href="/intro">커리어 앵커란?</Link>
                    <Link href="/assessment">검사 시작</Link>
                    <Link href="/pricing">요금제</Link>
                </div>
                <div className="footer-col">
                    <h4>고객지원</h4>
                    <a href="mailto:support@careeranchor.kr">이메일 문의</a>
                    <Link href="/privacy">개인정보처리방침</Link>
                    <Link href="/terms">이용약관</Link>
                </div>
            </div>
            <div className="footer-bottom">
                © {new Date().getFullYear()} Career Anchor Insight. All rights reserved.
            </div>
        </footer>
    );
}
