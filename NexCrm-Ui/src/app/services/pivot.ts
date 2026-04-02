import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ValueConfig {
  field: string;
  type: string;
}

export interface PivotRequest {
  fileId: string;
  rows: string[];
  columns: string[];
  values: ValueConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class PivotService {
  private apiUrl = environment.apiUrl + '/api/pivot';

  constructor(private http: HttpClient) { }

  build(request: PivotRequest): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/build`, request);
  }
}
