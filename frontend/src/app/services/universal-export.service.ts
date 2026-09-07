import { Injectable } from '@angular/core';

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (val: any, row: any) => string;
}

const METADATA_BLACKLIST = new Set([
  'id', 'uuid', '_id', 'ppdId', 'inventoryId', 'partyId', 'vendorId', 'empId',
  'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'password', 'hash', 'token',
  '__v', 'isDeleted', 'isActive', 'deletedDate', 'version', 'rawResponse'
]);

@Injectable({
  providedIn: 'root'
})
export class UniversalExportService {

  /**
   * Export array of objects to clean CSV file with UTF-8 BOM
   * Automatically sanitizes formula injection and strips internal database IDs.
   */
  exportToCsv(data: any[], filename: string, columns?: ExportColumn[] | { [key: string]: string }) {
    if (!data || data.length === 0) {
      return false;
    }

    let cols: { key: string; label: string; formatter?: (val: any, row: any) => string }[] = [];

    if (Array.isArray(columns) && columns.length > 0) {
      cols = columns;
    } else if (columns && typeof columns === 'object' && Object.keys(columns).length > 0) {
      cols = Object.keys(columns).map(k => ({ key: k, label: (columns as any)[k] }));
    } else {
      // Auto-extract business keys (excluding technical IDs and audit metadata)
      cols = Object.keys(data[0])
        .filter(k => !METADATA_BLACKLIST.has(k) && !k.startsWith('_') && !k.startsWith('$') && typeof data[0][k] !== 'function')
        .map(k => ({
          key: k,
          label: this.formatHeaderLabel(k)
        }));
    }

    const headerLine = cols.map(c => this.escapeCsvValue(c.label)).join(',');
    const rowsLines: string[] = [];

    for (const row of data) {
      const rowValues = cols.map(col => {
        let val = this.resolveValue(row, col.key);
        if (col.formatter) {
          val = col.formatter(val, row);
        }
        return this.escapeCsvValue(val);
      });
      rowsLines.push(rowValues.join(','));
    }

    const csvContent = '\uFEFF' + headerLine + '\r\n' + rowsLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, this.sanitizeFilename(filename, 'csv'));
    return true;
  }

  /**
   * Export array of objects to formatted JSON backup (with sensitive passwords stripped)
   */
  exportToJson(data: any[], filename: string) {
    if (!data || data.length === 0) return false;
    const sanitizedData = data.map(item => {
      const copy = { ...item };
      delete copy.password;
      delete copy.hash;
      delete copy.token;
      return copy;
    });
    const jsonStr = JSON.stringify(sanitizedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    this.triggerDownload(blob, this.sanitizeFilename(filename, 'json'));
    return true;
  }

  /**
   * Export array of objects to XML-based Excel spreadsheet (native Excel support with styled headers)
   */
  exportToExcelXml(data: any[], filename: string, sheetName: string = 'Sheet1', columns?: ExportColumn[]) {
    if (!data || data.length === 0) return false;

    let cols: ExportColumn[] = [];
    if (columns && columns.length > 0) {
      cols = columns;
    } else {
      cols = Object.keys(data[0])
        .filter(k => !METADATA_BLACKLIST.has(k) && !k.startsWith('_') && !k.startsWith('$'))
        .map(k => ({ key: k, label: this.formatHeaderLabel(k) }));
    }

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D97706"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#D97706" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="AltRow">
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${this.escapeXml(sheetName)}">
  <Table>
`;

    // Header Row
    xml += '   <Row ss:StyleID="Header">\n';
    cols.forEach(c => {
      xml += `    <Cell><Data ss:Type="String">${this.escapeXml(c.label)}</Data></Cell>\n`;
    });
    xml += '   </Row>\n';

    // Data Rows
    data.forEach((row, idx) => {
      const styleAttr = idx % 2 === 1 ? ' ss:StyleID="AltRow"' : '';
      xml += `   <Row${styleAttr}>\n`;
      for (const col of cols) {
        let val = this.resolveValue(row, col.key);
        if (col.formatter) {
          val = col.formatter(val, row);
        }
        if (typeof val === 'number') {
          xml += `    <Cell><Data ss:Type="Number">${val}</Data></Cell>\n`;
        } else {
          xml += `    <Cell><Data ss:Type="String">${this.escapeXml(val != null ? String(val) : '')}</Data></Cell>\n`;
        }
      }
      xml += `   </Row>\n`;
    });

    xml += `  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    this.triggerDownload(blob, this.sanitizeFilename(filename, 'xls'));
    return true;
  }

  // Helper Methods
  private resolveValue(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : '', obj);
  }

  private escapeCsvValue(val: any): string {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();

    // Neutralize Formula Injection (=, +, -, @)
    if ((str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) && isNaN(Number(str))) {
      str = "'" + str;
    }

    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    } else {
      str = `"${str}"`;
    }
    return str;
  }

  private escapeXml(str: string): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatHeaderLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  }

  private sanitizeFilename(name: string, extension: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanName = (name || 'Export').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanName}_${timestamp}.${extension}`;
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
