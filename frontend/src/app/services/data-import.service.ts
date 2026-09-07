import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RowError {
  rowNumber: number;
  column: string;
  rawValue: string;
  errorMessage: string;
  suggestedFix: string;
}

export interface ImportPreviewResponse {
  module: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newRows: number;
  previewRows: any[];
  errors: RowError[];
}

export interface ImportConfirmRequest {
  module: string;
  duplicateStrategy: 'UPDATE' | 'SKIP';
  rows: any[];
}

export interface ImportResultResponse {
  success: boolean;
  message: string;
  module: string;
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataImportService {

  private readonly baseUrl = `${environment.apiUrl}/data-import`;

  constructor(private http: HttpClient) {}

  /**
   * Upload file for dry-run preview and duplicate detection
   */
  previewImport(file: File, module: string): Observable<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);
    return this.http.post<ImportPreviewResponse>(`${this.baseUrl}/preview`, formData);
  }

  /**
   * Confirm and execute transactional import with chosen duplicate strategy
   */
  confirmImport(request: ImportConfirmRequest): Observable<ImportResultResponse> {
    return this.http.post<ImportResultResponse>(`${this.baseUrl}/confirm`, request);
  }

  /**
   * Download pre-formatted sample Excel template (.xlsx)
   */
  downloadTemplate(module: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template/${module}`, { responseType: 'blob' });
  }
}
