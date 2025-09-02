import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportData {
  title: string;
  headers: string[];
  rows: any[][];
  summary?: {
    label: string;
    value: string | number;
  }[];
  timestamp?: Date;
  chartImages?: {
    title: string;
    dataUrl: string;
  }[];
}

export interface ChartExportOptions {
  element: HTMLElement;
  filename: string;
  title?: string;
  subtitle?: string;
}

export class ExportService {
  /**
   * Export data as CSV
   */
  static async exportAsCSV(data: ExportData): Promise<void> {
    console.log('ExportService: Starting CSV export...');
    const { headers, rows } = data;
    
    // Prepare CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
      .join('\n');

    console.log('ExportService: CSV content prepared, length:', csvContent.length);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${data.title}_${this.getTimestamp()}.csv`;
    console.log('ExportService: Downloading CSV file:', filename);
    this.downloadBlob(blob, filename);
    console.log('ExportService: CSV export completed');
  }

  /**
   * Export chart/component as PNG
   */
  static async exportAsPNG(options: ChartExportOptions): Promise<void> {
    console.log('ExportService: Starting PNG export...');
    const { element, filename, title, subtitle } = options;

    try {
      console.log('ExportService: Capturing element with html2canvas...');
      // Capture the element
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });

      console.log('ExportService: Canvas created, converting to blob...');
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const pngFilename = `${filename}_${this.getTimestamp()}.png`;
          console.log('ExportService: Downloading PNG file:', pngFilename);
          this.downloadBlob(blob, pngFilename);
          console.log('ExportService: PNG export completed');
        } else {
          console.error('ExportService: Failed to create blob from canvas');
        }
      }, 'image/png');
    } catch (error) {
      console.error('PNG export failed:', error);
      throw new Error('Failed to export as PNG');
    }
  }

  /**
   * Export data as PDF
   */
  static async exportAsPDF(data: ExportData): Promise<void> {
    console.log('ExportService: Starting PDF export...');
    try {
      console.log('ExportService: Creating jsPDF document...');
      const doc = new jsPDF();
      const { title, headers, rows, summary, timestamp, chartImages } = data;

      // Add title
      doc.setFontSize(18);
      doc.text(title, 20, 20);

      // Add timestamp
      if (timestamp) {
        doc.setFontSize(10);
        doc.text(`Exported on: ${timestamp.toLocaleString()}`, 20, 30);
      }

             // Add summary if provided
       if (summary && summary.length > 0) {
         let yPos = timestamp ? 45 : 35;
         doc.setFontSize(12);
         summary.forEach((item, index) => {
           if (yPos > 250) {
             doc.addPage();
             yPos = 20;
           }
           doc.text(`${item.label}: ${item.value}`, 20, yPos);
           yPos += 8;
         });
         yPos += 20; // Increased spacing after summary
       }

             // Process table data with special handling for URLs
       const tableData = rows.map(row => 
         row.map(cell => {
           const cellStr = String(cell);
           // Special handling for Google Maps links - preserve the actual URL
           if (cellStr.includes('google.com/maps')) {
             return cellStr; // Keep the actual URL instead of converting to "View on Maps"
           }
           // Special handling for invalid coordinates
           if (cellStr === 'Invalid coordinates') {
             return 'No map link';
           }
           // For description column (usually the last column), allow longer text
           // For other columns, truncate if too long
           const isDescriptionColumn = cellStr.length > 50 && cellStr.includes('reports') || cellStr.includes('system') || cellStr.includes('officers') || cellStr.includes('time') || cellStr.includes('violations') || cellStr.includes('cities') || cellStr.includes('timestamp');
           if (isDescriptionColumn) {
             return cellStr; // Keep full description
           }
           // Truncate other long cells
           return cellStr.substring(0, 40) + (cellStr.length > 40 ? '...' : '');
         })
       );

      console.log('ExportService: Table data processed, attempting to use autoTable...');
      // Try to use autoTable plugin if available
      try {
        const autoTable = await import('jspdf-autotable');
        console.log('ExportService: autoTable imported successfully');
                 autoTable.default(doc, {
           head: [headers],
           body: tableData,
           startY: summary && summary.length > 0 ? (timestamp ? 80 : 70) : (timestamp ? 40 : 30),
           styles: { fontSize: 8 },
           headStyles: { fillColor: [66, 139, 202] },
           margin: { top: 10 },
           columnStyles: {
             // Adjust column widths for better text display
             0: { cellWidth: 40 }, // Metric column
             1: { cellWidth: 30 }, // Value column
             2: { cellWidth: 80, cellPadding: 2 } // Description column - wider with padding
           },
           didDrawCell: function(data) {
             // Enable text wrapping for description column
             if (data.column.index === 2) {
               data.cell.text = data.cell.text.map((text: string) => {
                 if (text.length > 60) {
                   // Split long text into multiple lines
                   const words = text.split(' ');
                   const lines = [];
                   let currentLine = '';
                   
                   words.forEach(word => {
                     if ((currentLine + word).length <= 60) {
                       currentLine += (currentLine ? ' ' : '') + word;
                     } else {
                       if (currentLine) lines.push(currentLine);
                       currentLine = word;
                     }
                   });
                   if (currentLine) lines.push(currentLine);
                   
                   return lines;
                 }
                 return text;
               });
             }
           }
         });
        console.log('ExportService: autoTable applied successfully');
      } catch (error) {
        console.log('ExportService: autoTable failed, using fallback:', error);
                 // Fallback: simple table without autoTable plugin
         this.createSimpleTable(doc, headers, tableData, summary && summary.length > 0 ? (timestamp ? 80 : 70) : (timestamp ? 40 : 30));
      }

             // Add chart images if provided
       if (chartImages && chartImages.length > 0) {
         console.log('ExportService: Adding chart images to PDF...');
         let currentY = doc.internal.pageSize.height - 20; // Start from bottom of current page
         
         for (let i = 0; i < chartImages.length; i++) {
           const chart = chartImages[i];
           
           // Check if we need a new page
           if (currentY < 60) {
             doc.addPage();
             currentY = 20;
           }
           
           // Add chart title
           doc.setFontSize(14);
           doc.setFont(undefined, 'bold');
           doc.text(chart.title, 20, currentY);
           currentY += 15;
           
                       // Add chart image
            try {
              // Convert data URL to base64
              const base64Data = chart.dataUrl.split(',')[1];
              
              // Create a temporary image to get actual dimensions
              const img = new Image();
              img.src = chart.dataUrl;
              
              // Wait for image to load to get actual dimensions
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
              });
              
              // Get actual image dimensions
              const actualWidth = img.naturalWidth;
              const actualHeight = img.naturalHeight;
              const actualAspectRatio = actualWidth / actualHeight;
              
              console.log(`ExportService: Chart ${i + 1} actual dimensions: ${actualWidth}x${actualHeight}, aspect ratio: ${actualAspectRatio.toFixed(2)}`);
              
              // Calculate image dimensions to fit page width while maintaining original aspect ratio
              const pageWidth = doc.internal.pageSize.width - 40; // 20px margin on each side
              const pageHeight = doc.internal.pageSize.height - 40; // 20px margin top/bottom
              
              // Use actual aspect ratio instead of fixed 16:9
              const imgWidth = pageWidth;
              const imgHeight = imgWidth / actualAspectRatio;
              
              // Ensure image doesn't exceed page height
              const finalImgHeight = Math.min(imgHeight, pageHeight * 0.7);
              const finalImgWidth = finalImgHeight * actualAspectRatio;
              
              // Center the image horizontally
              const imgX = (doc.internal.pageSize.width - finalImgWidth) / 2;
              
              // Check if image fits on current page
              if (currentY + finalImgHeight > doc.internal.pageSize.height - 20) {
                doc.addPage();
                currentY = 20;
              }
              
              // Add image to PDF
              doc.addImage(base64Data, 'PNG', imgX, currentY, finalImgWidth, finalImgHeight);
              currentY += finalImgHeight + 20; // Add some spacing after image
              
              console.log(`ExportService: Added chart ${i + 1}/${chartImages.length}: ${chart.title} with dimensions ${finalImgWidth.toFixed(1)}x${finalImgHeight.toFixed(1)}`);
            } catch (imageError) {
              console.error('ExportService: Failed to add chart image:', imageError);
              doc.text('Chart image could not be loaded', 20, currentY);
              currentY += 20;
            }
         }
       }

      // Save PDF
      const pdfFilename = `${data.title}_${this.getTimestamp()}.pdf`;
      console.log('ExportService: Saving PDF file:', pdfFilename);
      doc.save(pdfFilename);
      console.log('ExportService: PDF export completed');
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export as PDF');
    }
  }

  /**
   * Create a simple table without autoTable plugin
   */
  private static createSimpleTable(doc: jsPDF, headers: string[], data: string[][], startY: number): void {
    let yPos = startY;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const colWidth = (pageWidth - 2 * margin) / headers.length;

    // Headers
    doc.setFillColor(66, 139, 202);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    
    headers.forEach((header, index) => {
      doc.text(header, margin + index * colWidth + 2, yPos + 6);
    });

    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // Data rows
    data.slice(0, 20).forEach((row) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      row.forEach((cell, index) => {
        doc.text(cell, margin + index * colWidth + 2, yPos);
      });
      yPos += 6;
    });

    if (data.length > 20) {
      doc.text(`... and ${data.length - 20} more records`, margin, yPos + 10);
    }
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    console.log('ExportService: downloadBlob called with filename:', filename, 'blob size:', blob.size);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    console.log('ExportService: Triggering download...');
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('ExportService: Download triggered for:', filename);
  }

  /**
   * Get formatted timestamp for filenames
   */
  private static getTimestamp(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Format violation type for export
   */
  static formatViolationType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format date for export
   */
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format time for export
   */
  static formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format currency for export
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  /**
   * Format percentage for export
   */
  static formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  /**
   * Create Google Maps link from coordinates
   */
  static createGoogleMapsLink(latitude: number, longitude: number): string {
    // Ensure coordinates are valid numbers
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return 'Invalid coordinates';
    }
    
    // Format coordinates to 6 decimal places for precision
    const lat = Number(latitude).toFixed(6);
    const lng = Number(longitude).toFixed(6);
    
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  /**
   * Format address for better readability
   */
  static formatAddress(address: string): string {
    if (!address || address === 'Location') {
      return 'Location not specified';
    }
    
    // If address looks like coordinates (contains numbers and commas), return a more descriptive text
    if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(address.trim())) {
      return 'Coordinates provided';
    }
    
    // If address is just alphanumeric without spaces, it might be an encoded address
    if (/^[a-zA-Z0-9_-]+$/.test(address) && !address.includes(' ')) {
      return 'Encoded location data';
    }
    
    // Replace underscores and other separators with spaces
    let formatted = address.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // If the result is still not readable, provide a fallback
    if (formatted.length < 3 || /^[0-9_-]+$/.test(formatted)) {
      return 'Location data available';
    }
    
    return formatted;
  }
}
