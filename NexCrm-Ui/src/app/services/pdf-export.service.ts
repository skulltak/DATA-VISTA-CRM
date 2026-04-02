import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PivotEngineService } from './pivot-engine';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
    private readonly VECARE_LOGO = 'data:image/jpeg;base64,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';

  constructor(private pivotEngine: PivotEngineService) {}

  async exportIntelligenceReport(records: any[], fileName: string) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const timestamp = new Date().toLocaleString();

    // --- COVER PAGE / SUMMARY ---
    this.addHeader(doc, 'EXECUTIVE INTELLIGENCE REPORT', fileName, timestamp);
    
    let yPos = 60;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Performance Summary', 14, yPos);
    yPos += 8;

    const categories: ('ALL' | 'TVLA' | 'AC')[] = ['ALL', 'TVLA', 'AC'];
    const summaryData = categories.map(cat => {
      const result = this.pivotEngine.generatePivots(records, 'All', cat);
      return {
        category: cat === 'ALL' ? 'UNIFIED CRM' : cat,
        total: result?.summary.grandTotal.TOTAL || 0,
        completed: result?.summary.grandTotal.COMPLETED || 0,
        percentage: result?.summary.grandTotal.PERCENTAGE || 0
      };
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Intelligence Category', 'Total Records', 'Completed', 'Performance Score']],
      body: summaryData.map(s => [s.category, s.total, s.completed, s.percentage + '%']),
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        3: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const pct = parseInt(data.cell.text[0]);
          if (pct >= 80) data.cell.styles.textColor = [39, 174, 96];
          else if (pct >= 60) data.cell.styles.textColor = [230, 126, 34];
          else data.cell.styles.textColor = [231, 76, 60];
        }
      }
    });

    // --- PAGE FOOTER ---
    this.addFooter(doc);

    // --- DETAILED PAGES ---
    for (const cat of categories) {
      doc.addPage();
      const result = this.pivotEngine.generatePivots(records, 'All', cat);
      
      this.addHeader(doc, `${cat} DETAILED ANALYTICS`, fileName, timestamp);
      
      if (!result || result.summary.rows.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(`No data available for ${cat} segment.`, 14, 60);
        continue;
      }

      const tableHeaders = [
        result.rowLabel, 'CANCELLED', 'COMPLETED', 'HOLD', 'NOT SERV.', 'TOTAL', '%', 'TARGET', 'DIFF'
      ];

      const tableRows = result.summary.rows.map(row => [
        row.state,
        row.CANCELLED,
        row.COMPLETED,
        row.FULFILLMENT_HOLD,
        row.NOT_SERVICED,
        row.TOTAL,
        row.PERCENTAGE + '%',
        row.DAY_END,
        row.DIFFERENCE
      ]);

      const gt = result.summary.grandTotal;
      tableRows.push([
        'GRAND TOTAL',
        gt.CANCELLED,
        gt.COMPLETED,
        gt.FULFILLMENT_HOLD,
        gt.NOT_SERVICED,
        gt.TOTAL,
        gt.PERCENTAGE + '%',
        gt.DAY_END,
        gt.DIFFERENCE
      ]);

      autoTable(doc, {
        startY: 55,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
        columnStyles: {
          0: { fontStyle: 'bold' },
          6: { fontStyle: 'bold', halign: 'center' },
          8: { fontStyle: 'bold', halign: 'center' }
        },
        didParseCell: (data) => {
          // Color coding for Percentage (%) column
          if (data.column.index === 6 && data.section === 'body') {
            const pct = parseInt(data.cell.text[0]);
            if (pct >= 80) data.cell.styles.textColor = [39, 174, 96]; // Green
            else if (pct >= 60) data.cell.styles.textColor = [211, 84, 0]; // Orange
            else data.cell.styles.textColor = [192, 57, 43]; // Red
          }
          // Color coding for Difference (DIFF) column
          if (data.column.index === 8 && data.section === 'body') {
            const diff = parseInt(data.cell.text[0]);
            if (diff > 0) data.cell.styles.textColor = [39, 174, 96];
            else if (diff < 0) data.cell.styles.textColor = [192, 57, 43];
          }
          // Grand Total Highlight
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 242, 246];
          }
        }
      });

      this.addFooter(doc);
    }

    doc.save(`VECARE_Intelligence_${fileName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  }

  private addHeader(doc: jsPDF, title: string, fileName: string, timestamp: string) {
    // Header Branding Background
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 210, 45, 'F');

    // Logo (VECARE)
    if (this.VECARE_LOGO) {
      try {
        doc.addImage(this.VECARE_LOGO, 'JPEG', 14, 8, 32, 20);
      } catch (e) {
        console.warn('Failed to render PDF logo');
      }
    }

    // Report Title
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 55, 20);

    // Metadata Bar
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(0.5);
    doc.line(55, 24, 196, 24);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`PROJECT: ${fileName}`, 55, 30);
    doc.text(`EXTRACTED: ${timestamp}`, 55, 35);
    
    doc.setTextColor(255, 255, 255);
    doc.text('CERTIFIED DATA REPORT', 150, 35);
  }

  private addFooter(doc: jsPDF) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIAL - VECARE CRM INTELLIGENCE SERVICES', 14, 285);
    doc.text(`Page ${pageCount}`, 190, 285, { align: 'right' });
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 281, 196, 281);
  }
}
