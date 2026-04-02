import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private apiUrl = environment.apiUrl + '/api/import';

  constructor(private http: HttpClient) { }

  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/files`);
  }

  getRecords(fileId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/files/${fileId}/records`);
  }

  getHeaders(fileId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/files/${fileId}/headers`);
  }
}
