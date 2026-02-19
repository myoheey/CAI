"use client";

import { useCallback, useState } from "react";

interface Props {
  /** CSS selector or ref-based element to capture */
  targetId: string;
  filename?: string;
  label?: string;
  className?: string;
}

export default function PdfDownloadButton({
  targetId,
  filename = "career-anchor-report.pdf",
  label = "PDF 다운로드",
  className = ""
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try {
      const el = document.getElementById(targetId);
      if (!el) return;

      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      // Temporarily expand width for better PDF quality
      const origMaxWidth = el.style.maxWidth;
      el.style.maxWidth = "none";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      el.style.maxWidth = origMaxWidth;

      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");

      // Multi-page support
      let remainingHeight = imgHeight;
      let srcY = 0;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = (sliceHeight / imgHeight) * canvas.height;

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            sliceCanvas.height,
            0,
            0,
            canvas.width,
            sliceCanvas.height
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/png");

        if (srcY > 0) {
          pdf.addPage();
        }

        pdf.addImage(sliceData, "PNG", margin, margin, contentWidth, sliceHeight);
        srcY += sliceCanvas.height;
        remainingHeight -= sliceHeight;
      }

      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setBusy(false);
    }
  }, [targetId, filename]);

  return (
    <button
      type="button"
      className={`btn btn-outline pdf-download-btn ${className}`}
      onClick={handleDownload}
      disabled={busy}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {busy ? "생성 중..." : label}
    </button>
  );
}
