import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Excel Dışa Aktarma
 * @param data Dışa aktarılacak veri dizisi (Object array)
 * @param filename Dosya adı (uzantısız)
 * @param sheetName Sayfa adı
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Veri') => {
    // Veriyi çalışma sayfasına dönüştür
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Sütun genişliklerini içeriğe göre ayarla (Profesyonel görünüm)
    const colWidths = Object.keys(data[0] || {}).map(key => {
        const headerLen = key.length;
        const maxDataLen = data.reduce((max, item) => {
            const val = item[key] ? String(item[key]).length : 0;
            return Math.max(max, val);
        }, 0);
        return { wch: Math.max(headerLen, maxDataLen) + 2 };
    });
    worksheet['!cols'] = colWidths;

    // Çalışma kitabı oluştur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Dosyayı oluştur ve indir
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(fileData, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * PDF Dışa Aktarma (Raporsal Görünüm)
 * @param headers Sütun başlıkları dizisi
 * @param body Veri satırları (Dizi içinde dizi)
 * @param filename Dosya adı
 * @param title Rapor başlığı
 */
export const exportToPDF = (headers: string[], body: any[][], filename: string, title: string) => {
    const doc = new jsPDF() as any;

    // Renk Paleti (Aura Premium)
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [17, 24, 39]; // Gray-900

    // Logo / Başlık Alanı
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AURA SPA ERP', 20, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Isletme Yonetim Portali', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 190, 22, { align: 'right' });

    // Rapor Başlığı
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 60);

    // Tablo Oluşturma
    doc.autoTable({
        startY: 70,
        head: [headers],
        body: body,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50]
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        margin: { top: 70, left: 20, right: 20 },
        styles: {
            font: 'helvetica',
            cellPadding: 4
        }
    });

    // Dosyayı Kaydet
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Premium Finansal Kitapçık Dışa Aktarma
 * @param data Kapsamlı finansal veri objesi
 */
export const exportFinancialBooklet = (data: {
    businessName: string,
    period: string,
    stats: { label: string, value: string }[],
    staffData: any[],
    chartData: any[],
    suspicious: any[]
}) => {
    const doc = new jsPDF() as any;
    const primary = [79, 70, 229]; // Indigo
    const gray = [107, 114, 128];

    // --- KAPAK SAYFASI ---
    doc.setFillColor(17, 24, 39); // Dark background
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANSAL', 20, 100);
    doc.text('KITAPCIK', 20, 120);
    
    doc.setDrawColor(...primary);
    doc.setLineWidth(2);
    doc.line(20, 130, 100, 130);
    
    doc.setFontSize(14);
    doc.text(data.businessName.toUpperCase(), 20, 150);
    doc.text(`DONEM: ${data.period}`, 20, 160);
    
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('AURA SPA ERP - SUPREME AUTHORITY REPORTING', 20, 280);

    // --- SAYFA 2: GENEL OZET ---
    doc.addPage();
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(22);
    doc.text('Donem Ozeti', 20, 30);
    
    // KPI Kutuları
    let y = 50;
    data.stats.forEach((s, i) => {
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(20, y, 170, 25, 3, 3, 'F');
        doc.setTextColor(...gray);
        doc.setFontSize(10);
        doc.text(s.label.toUpperCase(), 30, y + 10);
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(s.value, 30, y + 20);
        y += 30;
    });

    // Riski Islemler Tablosu
    doc.setFontSize(16);
    doc.text('Denetim & Risk Analizi (Fraud Engine)', 20, y + 20);
    
    doc.autoTable({
        startY: y + 30,
        head: [['Tip', 'Aciklama', 'Tarih']],
        body: data.suspicious.map(s => [s.type, s.desc, s.date]),
        headStyles: { fillColor: [220, 38, 38] }, // Red for risk
        margin: { left: 20, right: 20 }
    });

    // --- SAYFA 3: PERSONEL PERFORMANS ---
    doc.addPage();
    doc.setFontSize(22);
    doc.text('Personel Verimlilik Raporu', 20, 30);
    
    doc.autoTable({
        startY: 50,
        head: [['Uzman Ismi', 'Toplam Ciro', 'Hak Edilen Prim']],
        body: data.staffData.map(st => [st.name, `TL ${st.sales.toLocaleString('tr-TR')}`, `TL ${st.commission.toLocaleString('tr-TR')}`]),
        headStyles: { fillColor: primary },
        margin: { left: 20, right: 20 }
    });

    doc.save(`Finansal_Kitapcik_${data.businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
