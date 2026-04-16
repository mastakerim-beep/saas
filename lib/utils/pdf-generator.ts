import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const generateZReportPDF = (report: any, business: any) => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(business?.name || "AURA SPA", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Gray
    doc.text("GÜN SONU Z-RAPORU", 105, 28, { align: "center" });
    doc.text(`Tarih: ${report.reportDate || new Date().toISOString().split('T')[0]}`, 105, 34, { align: "center" });
    
    // Line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 40, 190, 40);

    // Summary Table
    const summaryData = [
        ["Tahsilat Türü", "Beklenen (Sistem)", "Gerçekleşen (Kasa)", "Fark"],
        ["Nakit", `₺${report.expectedNakit}`, `₺${report.actualNakit}`, `₺${report.actualNakit - report.expectedNakit}`],
        ["Kredi Kartı", `₺${report.expectedKart}`, `₺${report.actualKart}`, `₺${report.actualKart - report.expectedKart}`],
        ["Havale/EFT", `₺${report.expectedHavale}`, `₺${report.actualHavale}`, `₺${report.actualHavale - report.expectedHavale}`],
    ];

    doc.autoTable({
        startY: 50,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { font: "helvetica", fontSize: 10 }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Toplam Kasa Diferansı: ₺${report.totalDifference || 0}`, 20, finalY);

    // AI Insight / Pocket Note
    if (report.aiSummary) {
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text("AI Pocket Analizi:", 20, finalY + 15);
        
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(report.aiSummary, 170);
        doc.text(splitText, 20, finalY + 22);
    }

    // Signatures
    const bottomY = 270;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Onaylayan: ${report.closedBy || "Sistem"}`, 20, bottomY);
    doc.text(`Rapor Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, 190, bottomY, { align: "right" });

    // Save
    doc.save(`Aura_ZReport_${report.reportDate || 'today'}.pdf`);
};
