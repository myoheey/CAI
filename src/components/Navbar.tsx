"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
            <div className="navbar-inner">
                <Link href="/" className="navbar-logo">
                    <span className="navbar-logo-icon">⚓</span>
                    Career Anchor
                </Link>
                <button
                    className="navbar-mobile-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="메뉴 열기"
                >
                    {menuOpen ? "✕" : "☰"}
                </button>
                <div className={`navbar-links${menuOpen ? " open" : ""}`}>
                    <Link href="/intro" className="navbar-link" onClick={() => setMenuOpen(false)}>
                        소개
                    </Link>
                    <Link href="/pricing" className="navbar-link" onClick={() => setMenuOpen(false)}>
                        요금제
                    </Link>
                    <Link
                        href="/assessment"
                        className="btn btn-primary navbar-cta"
                        onClick={() => setMenuOpen(false)}
                    >
                        검사 시작
                    </Link>
                </div>
            </div>
        </nav>
    );
}
