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
